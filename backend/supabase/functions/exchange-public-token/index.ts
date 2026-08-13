import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import { encrypt } from "../_shared/crypto.ts";
import { error } from "node:console";

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
      { global: {headers: {Authorization: authHeader}}},
    );

    const {data: {user}} = await supabaseAuth.auth.getUser();
    if(!user) return Response.json({error: "Not authenticated"},{status: 401});

    const {public_token, institution} = await req.json();
    if (!public_token) return Response.json({error: "Missing public_token"}, {status: 400});

    const exRes = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, public_token}),
    });
    const exData = await exRes.json();
    if(!exRes.ok) {
      console.error("exchange failed:", JSON.stringify(exData));
      return Response.json({error: exData.error_message}, {status: 500});
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {error} = await supabaseAdmin.from("plaid_items").insert({
      user_id: user.id,
      access_token: await encrypt(exData.access_token),
      item_id: exData.item_id,
      institution_name: institution || "Bank",
    });
    if (error) return Response.json({error: error.message}, {status: 500});

    return Response.json({success: true});
  } catch(e){
    return Response.json({error: String(e)}, {status: 500});
  }
});