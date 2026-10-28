# Recarga el código del agente y de los MCPs en sus ConfigMaps y reinicia los pods.
# Usa delete + create: en PowerShell 5.1 pasar el YAML por tubería (| kubectl apply -f -) daña la codificación UTF-8.
$ErrorActionPreference = 'Continue'
$d = $PSScriptRoot
$ns = 'harness-poc'
$codigo = @{
  'agente-atencion-prueba-codigo' = @('app.py', "$d\agente\app.py")
  'mcp-consulta-productos-codigo' = @('server.py', "$d\mcps\consulta_productos_smcp\server.py")
  'mcp-cartera-codigo'            = @('server.py', "$d\mcps\cartera_smcp\server.py")
}
foreach ($cm in $codigo.Keys) {
  kubectl delete configmap $cm -n $ns --ignore-not-found
  kubectl create configmap $cm -n $ns "--from-file=$($codigo[$cm][0])=$($codigo[$cm][1])"
}
kubectl rollout restart deployment -n $ns atencion-prueba-aiagent consulta-productos-smcp cartera-smcp
kubectl rollout status deployment/atencion-prueba-aiagent -n $ns --timeout=400s
