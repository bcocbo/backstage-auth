// Verifica cada MCP desplegado con una llamada real por StreamableHTTP: initialize, tools/list y tools/call.
// Se corre DENTRO del clúster (namespace harness-poc), como lo haría un agente. Ver harness/docs/mcps-kaizen.md.
// Uso: node verificar.mjs            -> imprime una línea por MCP y un JSON con el detalle al final.
const NS = 'harness-poc.svc.cluster.local';
const SIM = `http://mcp-simulador.${NS}`;
const CASOS = [
  // [MCP, url, tool, argumentos, headers]
  ['kubernetes-mcp-server (real)', `http://kubernetes-smcp.${NS}/mcp`, 'kubernetes_list_pods', { cluster_name: 'eks-cloud', namespace: 'harness-poc' }],
  ['kaizen-mcp-server (real)', `http://kaizen-smcp.${NS}/mcp`, 'search_entity_by_name', { entity: 'component', name: 'consulta-productos_smcp' }, { Authorization: 'Bearer token-de-prueba-poc' }],
  ['kaizen-docs-mcp-server (real)', `http://kaizen-docs-smcp.${NS}/mcp`, 'get_techdocs_url', { page_path: 'index' }],
  ['file-system-mcp-server (real)', `http://file-system-smcp.${NS}/mcp`, 'list-dir', { path: '.' }],
  ['performance-tests-mcp-server (real)', `http://performance-tests-smcp.${NS}/mcp`, 'generate_jmx',
    { script_name: 'prueba-poc', base_url: 'api-demo.example.com', transactions_json: JSON.stringify([{ name: 'consulta', method: 'GET', path: '/salud' }]) }],
];

async function probar(url, tool, args, extra = {}) {
  let sesion;
  const rpc = async (cuerpo) => {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...extra };
    if (sesion) headers['Mcp-Session-Id'] = sesion;
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', ...cuerpo }), signal: AbortSignal.timeout(60000) });
    sesion = r.headers.get('mcp-session-id') || sesion;
    const texto = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status} ${texto.slice(0, 200)}`);
    if (cuerpo.id === undefined) return null;
    const datos = texto.split(/\r?\n/).filter((l) => l.startsWith('data:')).pop();
    return JSON.parse(datos ? datos.slice(5) : texto);
  };
  await rpc({ id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'verificar-poc', version: '1' } } });
  await rpc({ method: 'notifications/initialized' });
  const lista = await rpc({ id: 2, method: 'tools/list' });
  const res = await rpc({ id: 3, method: 'tools/call', params: { name: tool, arguments: args } });
  const texto = JSON.stringify(res.result?.content ?? res.error ?? res);
  return { tools: lista.result.tools.length, error: !!(res.error || res.result?.isError), muestra: texto.slice(0, 400) };
}

const indice = await (await fetch(`${SIM}/`)).json();
for (const [ruta, d] of Object.entries(indice)) {
  CASOS.push([`${d.nombre} (simulado)`, `${SIM}${d.url}`, null, {}]);
}
const salida = [];
for (const [nombre, url, tool, args, headers] of CASOS) {
  try {
    let t = tool, a = args;
    if (!t) { // simulado: primera tool de la lista, con argumentos de ejemplo según su esquema
      const r = await probarLista(url);
      t = r.name; a = r.args;
    }
    const r = await probar(url, t, a, headers);
    salida.push({ mcp: nombre, tools: r.tools, tool: t, resultado: r.error ? 'tool respondió con error' : 'ok', muestra: r.muestra });
  } catch (e) {
    salida.push({ mcp: nombre, tools: 0, tool: tool || '-', resultado: 'fallo: ' + e.message.slice(0, 150) });
  }
}
for (const s of salida) console.log(`${s.resultado === 'ok' ? 'OK   ' : 'REVISA'} ${s.mcp} | ${s.tools} tools | ${s.tool} | ${s.resultado}`);
console.log('DETALLE ' + JSON.stringify(salida));

async function probarLista(url) {
  let sesion;
  const rpc = async (cuerpo) => {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    if (sesion) headers['Mcp-Session-Id'] = sesion;
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', ...cuerpo }) });
    sesion = r.headers.get('mcp-session-id') || sesion;
    return cuerpo.id === undefined ? null : r.json();
  };
  await rpc({ id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'verificar-poc', version: '1' } } });
  const lista = await rpc({ id: 2, method: 'tools/list' });
  const t = lista.result.tools[0];
  const args = {};
  for (const k of t.inputSchema?.required || []) {
    const p = t.inputSchema.properties[k] || {};
    args[k] = p.enum ? p.enum[0] : p.type === 'integer' || p.type === 'number' ? 1 : p.type === 'boolean' ? true : p.type === 'array' ? [] : p.type === 'object' ? {} : 'demo';
  }
  return { name: t.name, args };
}
