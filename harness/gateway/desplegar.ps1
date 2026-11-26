# Despliega el harness externo en harness-poc: bloqueos de Istio (paso 1) y gateway de MCPs con OPA (paso 2).
# Correr las pruebas de las reglas antes: opa test politicas/politica.rego politicas/politica_test.rego politicas/data.json
$ErrorActionPreference = 'Stop'
$d = $PSScriptRoot
$ns = 'harness-poc'
kubectl apply -f "$d\00-bloqueos-istio.yaml"
kubectl create configmap mcp-decision-codigo -n $ns --from-file="$d\decision\decision.py" --from-file="$d\decision\ext_mcp.proto" --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap mcp-gateway-politicas -n $ns --from-file="$d\politicas\politica.rego" --from-file="$d\politicas\data.json" --from-file="$d\politicas\politica_test.rego" --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$d\20-gateway.yaml"
# Las reglas y el código van en ConfigMaps: reiniciar el servicio de decisión para que los tome.
kubectl rollout restart deployment/mcp-decision -n $ns
kubectl get pods -n $ns -l 'harness.poc/rol=gateway'
kubectl get pods -n $ns -l app=mcp-decision
