
function cors(body, status = 200, headers = {}) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers
    },
    body: JSON.stringify(body),
  };
}

const BASE = (process.env.PAYPAL_MODE === "live") ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
async function token(){
  const id = process.env.PAYPAL_CLIENT_ID, sec = process.env.PAYPAL_CLIENT_SECRET;
  if(!id||!sec) throw new Error("PAYPAL env missing");
  const auth = Buffer.from(id+":"+sec).toString("base64");
  const r = await fetch(`${BASE}/v1/oauth2/token`,{method:"POST",headers:{"Authorization":"Basic "+auth,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
  if(!r.ok) throw new Error("oauth fail");
  return (await r.json()).access_token;
}
exports.handler = async (event)=>{
  if (event.httpMethod === "OPTIONS") return cors({ok:true});
  if (event.httpMethod !== "POST") return cors({ok:false,error:"Method not allowed"},405);
  let amount="50.00"; try{ const d=JSON.parse(event.body||"{}"); if(d.amount) amount=String(d.amount) }catch{}
  try{ const t = await token();
    const res = await fetch(`${BASE}/v2/checkout/orders`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+t},body:JSON.stringify({intent:"CAPTURE",purchase_units:[{amount:{currency_code:"EUR", value:amount}}]})});
    const data = await res.json(); if(!res.ok) return cors({ok:false,error:data},500);
    return cors({ok:true,id:data.id});
  }catch(e){ return cors({ok:false,error:e.message},500) }
};
