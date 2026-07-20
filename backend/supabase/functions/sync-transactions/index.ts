import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import { error } from "node:console";
import { access } from "node:fs";
import { json } from "node:stream/consumers";

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;
const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

Deno.serve(async (req) => {
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
      .select("access_token")
      .eq("user_id", user.id);

    const rows: any[] = [];
    for(const item of items ?? []){
      let cursor = undefined;
      let hasMore = true;
      while(hasMore){
        const res = await fetch(`${PLAID_BASE}/transactions/sync`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: item.access_token,
            cursor,
          }),
        });
        const data = await res.json();
        if(!res.ok){
          console.error("transactions/sync failed", JSON.stringify(data));
          return Response.json({error: data.error_message ?? "Sync failed"}, {status: 500});
        }

        for(const t of data.added){
          rows.push({
            external_id: t.transaction_id,
            user_id: user.id,
            description: t.name,
            amount: t.amount,
            posted_at: t.date,
          });
        }

        hasMore = data.hasMore;
        cursor = data.next_cursor;
      }
    }
    if (rows.length > 0){
      const {error} = await supabaseAdmin
        .from("transactions")
        .upsert(rows, {onConflict: "external_id"});
      if(error) return Response.json({error: error.message}, {status: 500});
    }

    return Response.json({synced: rows.length});
  } catch(e) {
    console.error("sync error:", String(e));
    return Response.json({error: String(e)}, {status: 500});
  }
})