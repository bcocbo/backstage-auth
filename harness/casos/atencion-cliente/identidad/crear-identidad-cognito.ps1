# Identidad del harness con el modelo transitorio documentado por Kaizen (Catálogo de MCPs):
# un User Pool, un Resource Server "consumo-mcps", un scope por MCP (<dominio>-<nombreMcp>)
# y un App Client por agente (<codigoApp>-<nombre>) con solo los scopes de su blueprint.
# El secreto del App Client va directo a un Secret de Kubernetes; no se imprime.
# Uso: powershell -ExecutionPolicy Bypass -File crear-identidad-cognito.ps1
$ErrorActionPreference = 'Stop'
$region = 'us-east-1'
$poolName = 'consumo-mcps-harness-poc'
$ns = 'harness-poc'
$salida = Join-Path $PSScriptRoot 'identidad-generada.json'

# Scopes = labels harness.poc/scope de los MCPs del catálogo.
$scopes = @(
  'productos-consultaProductos', 'clientes-consultaClientes', 'servicio-gestionPqr', 'cartera-gestionCartera',
  'canales-envioNotificaciones', 'soporte-gestionTickets', 'operacion-consultaObservabilidad', 'devops-gestionPipelines',
  'desarrollo-gestionRepositorios', 'plataforma-consultaCatalogo', 'cumplimiento-validacionListas', 'conocimiento-consultaDocumentos'
)
# Agente creado con la plantilla: atencion-prueba eligió clientes, pqr y consulta-productos.
$agente = @{ codigoApp = 'POC0000111'; nombre = 'atencion-prueba'; scopes = @('productos-consultaProductos', 'clientes-consultaClientes', 'servicio-gestionPqr') }

function Invoke-Aws { param([string[]]$a) $o = & aws.exe @a --region $region --output json; if ($LASTEXITCODE) { throw "aws $($a -join ' ')" }; if ($o) { $o | ConvertFrom-Json } }

$pool = (Invoke-Aws @('cognito-idp', 'list-user-pools', '--max-results', '60')).UserPools | Where-Object Name -eq $poolName
if (-not $pool) { $pool = (Invoke-Aws @('cognito-idp', 'create-user-pool', '--pool-name', $poolName)).UserPool; Write-Output "User Pool creado: $($pool.Id)" } else { Write-Output "User Pool existente: $($pool.Id)" }
$poolId = $pool.Id

$detalle = (Invoke-Aws @('cognito-idp', 'describe-user-pool', '--user-pool-id', $poolId)).UserPool
$dominio = $detalle.Domain
if (-not $dominio) {
  $dominio = 'harness-poc-' + ($poolId.Split('_')[1].ToLower())
  Invoke-Aws @('cognito-idp', 'create-user-pool-domain', '--domain', $dominio, '--user-pool-id', $poolId) | Out-Null
  Write-Output "Dominio creado: $dominio"
}

$scopeArgs = $scopes | ForEach-Object { "ScopeName=$_,ScopeDescription=Acceso al MCP $_" }
$rs = $null
try { $rs = Invoke-Aws @('cognito-idp', 'describe-resource-server', '--user-pool-id', $poolId, '--identifier', 'consumo-mcps') } catch { }
if ($rs) { Invoke-Aws (@('cognito-idp', 'update-resource-server', '--user-pool-id', $poolId, '--identifier', 'consumo-mcps', '--name', 'consumo-mcps', '--scopes') + $scopeArgs) | Out-Null; Write-Output 'Resource Server actualizado' }
else { Invoke-Aws (@('cognito-idp', 'create-resource-server', '--user-pool-id', $poolId, '--identifier', 'consumo-mcps', '--name', 'consumo-mcps', '--scopes') + $scopeArgs) | Out-Null; Write-Output 'Resource Server creado' }

$clientName = "$($agente.codigoApp)-$($agente.nombre)"
$cliente = (Invoke-Aws @('cognito-idp', 'list-user-pool-clients', '--user-pool-id', $poolId, '--max-results', '60')).UserPoolClients | Where-Object ClientName -eq $clientName
$oauthScopes = $agente.scopes | ForEach-Object { "consumo-mcps/$_" }
if (-not $cliente) {
  $cliente = (Invoke-Aws (@('cognito-idp', 'create-user-pool-client', '--user-pool-id', $poolId, '--client-name', $clientName, '--generate-secret',
      '--allowed-o-auth-flows', 'client_credentials', '--allowed-o-auth-flows-user-pool-client', '--allowed-o-auth-scopes') + $oauthScopes)).UserPoolClient
  Write-Output "App Client creado: $clientName"
}
$cliente = (Invoke-Aws @('cognito-idp', 'describe-user-pool-client', '--user-pool-id', $poolId, '--client-id', $cliente.ClientId)).UserPoolClient

$tokenUrl = "https://$dominio.auth.$region.amazoncognito.com/oauth2/token"
$issuer = "https://cognito-idp.$region.amazonaws.com/$poolId"
kubectl create secret generic "$($agente.nombre)-identidad" -n $ns `
  --from-literal=CLIENT_ID=$($cliente.ClientId) --from-literal=CLIENT_SECRET=$($cliente.ClientSecret) --from-literal=TOKEN_URL=$tokenUrl `
  --dry-run=client -o yaml | kubectl apply -f -

@{ userPoolId = $poolId; issuer = $issuer; jwksUri = "$issuer/.well-known/jwks.json"; tokenUrl = $tokenUrl; appClient = $clientName; scopes = $oauthScopes } |
  ConvertTo-Json | Set-Content -Path $salida -Encoding utf8
Write-Output "Listo. Datos no secretos en $salida"
