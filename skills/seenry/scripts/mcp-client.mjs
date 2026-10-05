// Minimal Streamable HTTP client for the public Seenry endpoint. No retries or credential logging.
export const ENDPOINT = 'https://mcp.seenry.design';
export class SeenryClient {
  constructor({key, fetchImpl=fetch, maxCalls=3, timeoutMs=30000}={}) {
    if(!key) throw Error('A Seenry key is required; use connected MCP tools when available.');
    Object.assign(this,{key,fetchImpl,maxCalls,timeoutMs,calls:0,rpcId:0,session:null,protocol:'2025-03-26'});
  }
  async rpc(method,params,notification=false) {
    const headers={Authorization:`Bearer ${this.key}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':this.protocol};
    if(this.session) headers['Mcp-Session-Id']=this.session;
    let r;
    try {r=await this.fetchImpl(ENDPOINT,{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(this.timeoutMs),body:JSON.stringify({jsonrpc:'2.0',...(notification?{}:{id:++this.rpcId}),method,params})});}
    catch {throw Error('Seenry request failed or timed out. No retry was made.');}
    if(!r.ok) throw Error(`Seenry HTTP ${r.status}. Stop and resolve access, quota or service availability before retrying.`);
    this.session=r.headers.get('mcp-session-id')||this.session;
    if(notification) return;
    const raw=await r.text();
    let body;
    try {
      if((r.headers.get('content-type')||'').includes('text/event-stream')) {
        body=raw.split(/\r?\n\r?\n/).map(event=>event.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n')).filter(Boolean).map(s=>JSON.parse(s)).find(x=>x.id===this.rpcId);
      } else body=JSON.parse(raw);
    } catch {throw Error('Seenry returned an unreadable response. No retry was made.');}
    if(!body||body.error) throw Error(`Seenry protocol error${body?.error?.code ? ` (${body.error.code})`:''}. No retry was made.`);
    if(body.result?.isError) throw Error('Seenry tool failed. Stop; do not treat this as an empty search result.');
    return body.result;
  }
  async initialize() {
    const result=await this.rpc('initialize',{protocolVersion:this.protocol,capabilities:{},clientInfo:{name:'seenry-research',version:'0.1.0'}});
    if(result?.protocolVersion) this.protocol=result.protocolVersion;
    await this.rpc('notifications/initialized',{},true);
  }
  async call(name,args={}) {
    if(this.calls>=this.maxCalls) throw Error('Research call budget reached. Reuse the evidence or continue manually with an explicit budget.');
    this.calls++;
    const result=await this.rpc('tools/call',{name,arguments:args});
    let data=result?.structuredContent;
    if(!data) {try {data=JSON.parse(result?.content?.find(c=>c.type==='text')?.text);}catch{}}
    if(!data) throw Error('Seenry returned no structured evidence. Stop rather than invent a result.');
    return {data,content:result.content||[]};
  }
}
