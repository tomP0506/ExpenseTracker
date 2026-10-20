import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "../_shared/crypto.ts";
import { carryOverCategories } from "../_shared/carryOver.ts";



const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;
const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

Deno.serve(async (req) => {
  try{
    if(req.headers.get("x-cron-secret") !== CRON_SECRET){
      return Response.json({error: "Forbidden"}, {status: 401});
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {data: items} = await admin
      .from("plaid_items")
      .select("id, access_token, cursor, institution_name, user_id");

    let totalSynced = 0;

    for (const item of items ?? []){
      const accessToken = await decrypt(item.access_token)

      const acctRes = await fetch(`${PLAID_BASE}/accounts/get`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token: accessToken,
        }),
      });

      const acctData = await acctRes.json();
      if(acctRes.ok) {
        const accountRows = acctData.accounts.map((a) => ({
          account_id: a.account_id,
          item_id: acctData.item.item_id,
          user_id: item.user_id,
          name: a.name,
          type: a.type,
          subtype: a.subtype,
          mask: a.mask,
          current_balance: a.balances.current,
          institution_name: item.institution_name,
          last_synced: new Date().toISOString(),
        }));

        const {error: acctError} = await admin
          .from("accounts")
          .upsert(accountRows, {onConflict: "account_id"});
        
        if(acctError) console.error("accounts upsert for item", item.id, acctError.message)
      }

      let cursor = item.cursor ?? undefined;
      let hasMore = true;
      while(hasMore) {
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
        if(!res.ok) {
          console.error("sync failed for item", item.id, JSON.stringify(data));
          if (data.error_code === "ITEM_LOGIN_REQUIRED") {
            await admin.from("plaid_items").update({needs_reauth: true}).eq("id", item.id);
          }
          break;
        }

        const rows = [...data.added, ...data.modified].map((t) => ({
          external_id: t.transaction_id,
          account_id: t.account_id,
          user_id: item.user_id,
          description: t.name,
          amount: t.amount,
          posted_at: t.date,
        }));
        const removedIds = data.removed.map((r) => r.transaction_id);

        if (rows.length > 0){
          const {error} = await admin
            .from("transactions")
            .upsert(rows, {onConflict: "external_id"});
          
          if(error){ console.error("upsert failed for item", item.id, error.message); break;}
          totalSynced += rows.length;
        }

        await carryOverCategories(admin, item.user_id, data.added);

        if(removedIds.length > 0){
          const {error} = await admin.from("transactions").delete()
            .in("external_id", removedIds).eq("user_id", item.user_id);
          if(error) {console.error("delete removed for item", item.id, error.message); break;}
        }

        await admin.from("plaid_items").update({cursor: data.next_cursor, needs_reauth: false}).eq("id", item.id);

        hasMore = data.has_more;
        cursor = data.next_cursor;
      }
    }

    return Response.json({synced: totalSynced});
  }
  catch(e){
    console.error("cron-sync error", String(e));
    return Response.json({error: String(e)}, {status: 500});
  }
});