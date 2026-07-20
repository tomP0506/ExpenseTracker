import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import { access } from "node:fs";

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;
const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

Deno.serve(async (req) => {
  try{
    // const jwt = req.headers.get("Authorization")!.replace("Bearer", "");
    // const supabaseAuth = createClient(
    //   Deno.env.get("SUPABASE_URL")!,
    //   Deno.env.get("SUPABASE_ANON_KEY")!,
    // );

    // const {data: {user}} = await supabaseAuth.auth.getUser(jwt);
    
    // if (!user) {
    //   console.error("No authenticated user");
    //   return Response.json({error: "Not authenticated"}, {status: 401});
    // }
    const authHeader = req.headers.get("Authorization") ?? "";

    try{
      const part = authHeader.replace("Bearer", "").split(".")[1]
        .replace(/-/g, "+").replace(/_/g, "/");
    }
    catch(_){
      console.log("Could not decode incoming token");
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {global: {headers: {Authorization: authHeader}}},
    );
    const {data: {user}, error: authErr} = await supabaseAuth.auth.getUser();
    if(!user){
      console.error("Auth failed: ", authErr?.message);
      return Response.json({error: "Not authenticated"}, {status: 401});
    }

    const ptRes = await fetch(`${PLAID_BASE}/sandbox/public_token/create`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        institution_id: "ins_109508",
        initial_products: ["transactions"],
      }),
    });

    const ptData = await ptRes.json();
    if(!ptRes.ok){
      console.error("public token/create failed", JSON.stringify(ptData));
      return Response.json({error: ptData.error_message}, {status: 500});
    } 

    const exRes = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token: ptData.public_token,
      }),
    });
    const exData = await exRes.json();
    if(!exRes.ok){
      console.error("exchange failed", JSON.stringify(exData));
      return Response.json({ error: exData.error_message}, {status: 500});
    } 

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {error} = await supabaseAdmin.from("plaid_items").insert({
      user_id: user.id,
      access_token: exData.access_token,
      item_id: exData.item_id,
      institution_name: "First Platypus Bank(sandbox)",
    });
    if(error){
      console.error("insert failed", error.message);
      return Response.json({error: error.message}, {status: 500});
    } 

    return Response.json({success: true, institution: "First Platypus Bank(sandbox)"});
  } catch(e){
    return Response.json({error: String(e)}, {status: 500});
  }
});