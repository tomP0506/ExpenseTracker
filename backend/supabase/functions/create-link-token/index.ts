import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { error } from "node:console";
import { withCors } from "../_shared/cors.ts";

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID")!;
const PLAID_SECRET = Deno.env.get("PLAID_SECRET")!;
const PLAID_ENV = Deno.env.get("PLAID_ENV") ?? "sandbox";
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

Deno.serve(withCors(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: {Authorization: authHeader}}},
    );

    const {data: {user}} = await supabaseAuth.auth.getUser();
    if(!user) return Response.json({error: "Not authenticated"}, {status: 401});

    const reqBody = await req.json().catch(() => ({}));
    const redirectUri = reqBody?.redirect_uri;

    const res = await fetch(`${PLAID_BASE}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: {client_user_id: user.id},
        client_name: "Expense Tracker",
        transactions: {days_requested: 200},
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
        ...(redirectUri ? { redirect_uri: redirectUri} : {}),
      }),
    });

    const data = await res.json();
    if(!res.ok){
      console.error("link/token/create failed:", JSON.stringify(data));
      return Response.json({error: data.error_message}, {status: 500});
    }
    return Response.json({link_token: data.link_token});
  }
  catch(e){
    return Response.json({error:String(e)}, {status: 500});
  }
}));