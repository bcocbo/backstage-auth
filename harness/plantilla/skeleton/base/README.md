# ${{ values.nombre }}

${{ values.descripcion }}

Agente **${{ values.tipoAgente }}** (${{ values.runtime }}) creado con la plantilla *Agente con Harness*.

| Archivo | Para qué sirve |
|---|---|
| `harness.yaml` | Piezas del agente (modelo, MCPs, skills, bases de conocimiento, agentes) y los controles del harness |
| `blueprint-accesos.yaml` | Identidad del agente y permisos (scope por MCP) que hay que aprobar |
| `catalog-info.yaml` | Registro del agente en el catálogo |
| `agente/` | Esqueleto del agente según su tipo |

Siguiente paso: aprobar el blueprint de accesos y desplegar.
