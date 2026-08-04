import {createClient} from "https://esm.sh/@supabase/supabase-js@2";


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
    if(!user) return Response.json({error: "Not authenticated"}, {status: 401});

    const {item_id} = await req.json();
    if(!item_id) return Response.json({error: "Missing item_id"}, {status: 400});

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {data: item} = await admin
      .from("plaid_items")
      .select("access_token")
      .eq("item_id", item_id)
      .eq("user_id", user.id)
      .single();
    if(!item) return Response.json({error: "Bank not found"}, {status: 404});

    const res = await fetch(`${PLAID_BASE}/item/remove`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: item.access_token,
      }),
    });

    if(!res.ok){
      console.error("item/remove failed", JSON.stringify(await res.json()));
    }
    
    // const {data: accts} = await admin
    //   .from("accounts")
    //   .select("account_id")
    //   .eq("item_id", item_id)
    //   .eq("user_id", user.id);

    // const acctIds = (accts ?? []).map((a) => a.account_id);

    // if(acctIds.length > 0){
    //   const {error: txErr} = await admin.from("transactions").delete()
    //     .in("account_id", acctIds).eq("user_id", user.id);
      
    //   if(txErr){
    //     console.error("delete transactions: ", txErr.message);
    //     return Response.json({error: txErr.message}, {status: 500});
    //   }
    // }

    const {error: acctErr} = await admin.from("accounts").delete().eq("item_id", item_id).eq("user_id", user.id);
    if(acctErr){
      console.error("delete accounts", acctErr.message);
      return Response.json({error: acctErr.message}, {status: 500});
    }

    const {error: itemErr} = await admin.from("plaid_items").delete().eq("item_id", item_id).eq("user_id", user.id);
    if(itemErr){
      console.error("delete item", itemErr.message);
      return Response.json({error: itemErr.message}, {status: 500});
    }
    
    return Response.json({success: true});
  }
  catch(e){
    console.error("disconnect error:", String(e));
    return Response.json({error: String(e)}, {status: 500});
  }
});