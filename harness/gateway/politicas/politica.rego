# Reglas del gateway de MCPs del harness. OPA decide cada tools/call que pasa por el gateway.
# Entrada (la arma el servicio de decisión):
#   agente: client_id del token de Cognito (vacío si no hay token)
#   scopes: scopes del token
#   mcp: nombre del MCP destino
#   tool, args: la tool pedida y sus argumentos
# Salida: decision = {resultado: allow | approval | deny, motivos: [...], version}
# Los datos (MCPs, scopes, tools de lectura, valores prohibidos, suspendidos) viven en data.json.
package harness.gateway

import rego.v1

mcp := data.gateway.mcps[input.mcp]

niega contains "Sin identidad: la llamada no trae token de Cognito" if not input.agente

niega contains sprintf("Agente suspendido: %s", [input.agente]) if input.agente in data.gateway.suspendidos.agentes

niega contains sprintf("MCP suspendido: %s", [input.mcp]) if input.mcp in data.gateway.suspendidos.mcps

niega contains sprintf("MCP desconocido para el harness: %s", [input.mcp]) if not data.gateway.mcps[input.mcp]

niega contains sprintf("El token no trae el scope %s", [mcp.scope]) if not mcp.scope in input.scopes

niega contains sprintf("Tool prohibida: %s", [input.tool]) if input.tool in mcp.prohibidas

# Un argumento con un valor prohibido (por ejemplo, leer Secrets) se niega aunque la tool esté permitida.
niega contains sprintf("Argumento prohibido en %s: %s=%v", [input.tool, clave, valor]) if {
	some clave, valor in input.args
	is_string(valor)
	some prohibido in mcp.valores_prohibidos
	lower(valor) == prohibido
}

# Lo que no está en la lista de lectura de su MCP se trata como escritura: pide aprobación humana.
pide_aprobacion contains sprintf("La tool %s no es de solo lectura: requiere aprobación", [input.tool]) if {
	mcp
	not input.tool in mcp.lectura
}

resultado := "deny" if {
	count(niega) > 0
} else := "approval" if {
	count(pide_aprobacion) > 0
} else := "allow"

motivos := sort([m | some m in niega]) if resultado == "deny"

motivos := sort([m | some m in pide_aprobacion]) if resultado == "approval"

motivos := [] if resultado == "allow"

decision := {
	"resultado": resultado,
	"motivos": motivos,
	"version": data.gateway.version,
}
