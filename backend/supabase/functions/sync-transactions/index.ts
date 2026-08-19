import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "../_shared/crypto.ts";
import { error } from "node:console";
import { access } from "node:fs";
import { json } from "node:stream/consumers";
// import { drainableProtocol } from "node:stream/iter";
import { it } from "node:test";
import { withCors } from "../_shared/cors.ts";

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;
const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

Deno.serve(withCors(async (req) => {
  try{
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {global: {headers: {Authorization: authHeader}}},
    );
    const {data: {user}} = await supabaseAuth.auth.getUser();
    if (!user) return Response.json({error: "Not authenticated"}, {status: 401});

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    
    const {data: items} = await supabaseAdmin
      .from("plaid_items")
      .select("id, access_token, cursor, institution_name")
      .eq("user_id", user.id);

    // const rows: any[] = [];
    
    let synced = 0;
    let removed = 0;

    for(const item of items ?? []){
      const accessToken = await decrypt(item.access_token);
      
      const acctRes = await fetch(`${PLAID_BASE}/accounts/get`,{
        method: 'POST',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token: accessToken,
        }),
      });

      const acctData = await acctRes.json();
      if (acctRes.ok){
        const accountRows = acctData.accounts.map((a) => ({
          account_id: a.account_id,
          item_id: acctData.item.item_id,
          user_id: user.id,
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          mask: a.mask,
          current_balance: a.balances.current,
          institution_name: item.institution_name,
          last_synced: new Date().toISOString(),
        }));

        const {error: acctError}= await supabaseAdmin
          .from("accounts")
          .upsert(accountRows, {onConflict: "account_id"});

        if (acctError){
          console.error("accounts upsert:", acctError.message);
        }
      }

      let cursor = item.cursor ?? undefined;
      let hasMore = true;

      while(hasMore){
        const res = await fetch(`${PLAID_BASE}/transactions/sync`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: accessToken,
            cursor,
          }),
        });
        const data = await res.json();
        if(!res.ok){
          console.error("transactions/sync failed", JSON.stringify(data));
          return Response.json({error: data.error_message ?? "Sync failed"}, {status: 500});
        }

        const rows = [...data.added, ...data.modified].map((t) => ({
          external_id: t.transaction_id,
          account_id: t.account_id,
          user_id: user.id,
          description: t.name,
          amount: t.amount,
          posted_at: t.date,
        }))
        const removedIds = data.removed.map((r) => r.transaction_id);

        if (rows.length > 0){
          const {error} = await supabaseAdmin
            .from("transactions")
            .upsert(rows, {onConflict: "external_id"});
          if(error){
            console.error("transactions upsert failed: ", error.message);
            return Response.json({error: error.message}, {status: 500});
          }
          synced += rows.length
        }

        if(removedIds.length > 0){
          const {error} = await supabaseAdmin.from("transactions").delete()
            .in("external_id", removedIds).eq("user_id", user.id);
          if(error){
            console.error("transaction delete failed", error.message);
            return Response.json({error: error.message}, {status: 500});
          }
          removed += removedIds.length;
        }
        
        await supabaseAdmin.from("plaid_items").update({cursor: data.next_cursor}).eq("id", item.id);

        hasMore = data.has_more;
        cursor = data.next_cursor;
      }

      
    }

    return Response.json({synced, removed});
  } catch(e) {
    console.error("sync error:", String(e));
    return Response.json({error: String(e)}, {status: 500});
  }
}));