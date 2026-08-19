export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function withCors(handler: (req: Request) => Promise<Response>){
    return async (req: Request): Promise<Response> => {
        if(req.method === "OPTIONS"){
            return new Response("ok", {headers: corsHeaders});
        }
        const res = await handler(req);
        const headers = new Headers(res.headers);
        for(const  [key, value] of Object.entries(corsHeaders)) {
            headers.set(key, value);
        }
        return new Response(res.body, {status: res.status, headers});
    };
}