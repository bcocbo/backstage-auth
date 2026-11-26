# Pruebas de las reglas del gateway. Correr: opa test politica.rego politica_test.rego data.json
package harness.gateway_test

import rego.v1

import data.harness.gateway

base := {
	"agente": "cliente-agente-prueba",
	"scopes": ["consumo-mcps/productos-consultaProductos", "consumo-mcps/plataforma-kubernetes"],
	"mcp": "consulta-productos-smcp",
	"tool": "buscar_producto",
	"args": {"texto": "tarjeta"},
}

test_lectura_con_scope_pasa if {
	gateway.decision.resultado == "allow" with input as base
}

test_sin_token_se_niega if {
	d := gateway.decision with input as object.remove(base, ["agente"])
	d.resultado == "deny"
}

test_mcp_sin_scope_se_niega if {
	d := gateway.decision with input as object.union(base, {"mcp": "cartera-smcp", "tool": "consultar_obligaciones"})
	d.resultado == "deny"
	some m in d.motivos
	contains(m, "consumo-mcps/cartera-gestionCartera")
}

test_mcp_desconocido_se_niega if {
	gateway.decision.resultado == "deny" with input as object.union(base, {"mcp": "otro-mcp"})
}

test_argumento_prohibido_se_niega if {
	entrada := object.union(base, {"mcp": "kubernetes-smcp", "tool": "kubernetes_list_pods", "args": {"kind": "Secret"}})
	gateway.decision.resultado == "deny" with input as entrada
}

test_escritura_pide_aprobacion if {
	entrada := object.union(base, {"mcp": "kubernetes-smcp", "tool": "kubernetes_scale_deployment", "args": {"replicas": 0}})
	gateway.decision.resultado == "approval" with input as entrada
}

test_agente_suspendido_se_niega if {
	gateway.decision.resultado == "deny" with input as base
		with data.gateway.suspendidos.agentes as ["cliente-agente-prueba"]
}
