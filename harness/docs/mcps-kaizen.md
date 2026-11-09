# MCPs con la forma del catálogo de Kaizen (9-nov-2026)

Pregunta: ¿cuántos MCPs de un catálogo real pueden funcionar en la PoC sin datos internos?

**Respuesta:** de 36 MCPs reales, 5 funcionan con su código real en el clúster. Los otros 31 dependen de sistemas internos, de servicios externos o de permisos de AWS. Para esos hay **MCPs simulados**: imitan la cantidad de tools y los parámetros del real, con nombres y descripciones genéricos, y responden datos inventados. Los 36 están en el catálogo y respondieron a una llamada real.

## Cómo quedó

| Pieza | Qué es |
|---|---|
| 5 pods `*-smcp` (origen `real`) | Código real, instalado en el pod al arrancar. Ese código, su despliegue y el mapa de nombres reales no están en este repo, porque el repo es público. |
| `mcp-simulador` (1 pod) | Publica los 31 simulados, cada uno en `/<mcp>/mcp`. Las tools que escriben o ejecutan algo no hacen nada y lo dicen en la respuesta. Está en `harness/mcps-kaizen/`. |
| `backstage-adaptador` | nginx pequeño para los dos MCP de Kaizen: imita el intercambio de token y reenvía las consultas a nuestro Backstage. |
| `harness/catalogo/mcps-kaizen.yaml` | 36 fichas con el formato de Kaizen: `Component` de tipo `mcp`, `API` con sus tools y la anotación `server-url`. La etiqueta `harness.poc/origen` dice `real` o `simulado`. |

Recursos: cada real pide 50m y 192Mi (límite 512Mi); el simulador, 50m y 128Mi; el adaptador, 10m y 16Mi. En total son 7 pods en `harness-poc`.

## Los 36

"Verificación" significa: `initialize`, `tools/list` y `tools/call` desde un pod dentro de `harness-poc`, como lo haría un agente (`harness/mcps-kaizen/verificar.mjs`).

| Nombre en el catálogo | Estado | Qué necesita el real | Tools | Verificación | Nota |
|---|---|---|---|---|---|
| `kubernetes-mcp-server` | **Real** | Nuestro clúster o Backstage | 10 | OK: `kubernetes_list_pods` | Solo lectura y solo en harness-poc |
| `kaizen-mcp-server` | **Real** | Nuestro clúster o Backstage | 6 | OK: `search_entity_by_name` | Consulta nuestro Backstage por medio del adaptador |
| `kaizen-docs-mcp-server` | **Real** | Nuestro clúster o Backstage | 5 | OK: `get_techdocs_url` | Parcial: la tool probada solo arma la URL; nuestro Backstage no publica TechDocs |
| `file-system-mcp-server` | **Real** | Nada externo | 8 | OK: `list-dir` | Carpeta vacía de 50 MiB y sin aplicar cambios |
| `performance-tests-mcp-server` | **Real** | Nada externo | 3 | OK: `generate_jmx` | Genera el .jmx; la API de checklist no existe en la PoC |
| `agenda-ambientes-mcp-server` | Simulado | Sistemas internos | 11 | OK: `ambientes_find_window` |  |
| `automatizacion-infra-mcp-server` | Simulado | Servicio externo con llave | 9 | OK: `automatizacion_get_cluster_status` |  |
| `pipelines-operativos-mcp-server` | Simulado | Sistemas internos | 7 | OK: `pipeline_execute_instancia` |  |
| `auditoria-nube-mcp-server` | Simulado | Servicios o permisos de AWS que la sandbox no tiene | 1 | OK: `auditoria_lookup_events` |  |
| `observabilidad-nube-mcp-server` | Simulado | Servicios o permisos de AWS que la sandbox no tiene | 9 | OK: `observabilidad_get_active_alarms` |  |
| `revision-codigo-mcp-server` | Simulado | Sistemas internos | 3 | OK: `revision_analizar` |  |
| `pruebas-continuas-mcp-server` | Simulado | Sistemas internos | 6 | OK: `write-test-file` |  |
| `turnos-disponibilidad-mcp-server` | Simulado | Sistemas internos | 1 | OK: `consultar_personal_turno` |  |
| `flujo-devops-mcp-server` | Simulado | Servicio externo con llave | 12 | OK: `git-status` |  |
| `operaciones-git-mcp-server` | Simulado | Servicio externo con llave | 12 | OK: `git-status` |  |
| `disponibilidad-servicios-mcp-server` | Simulado | Sistemas internos | 11 | OK: `get_afectaciones_reales_servicios` |  |
| `gestion-itsm-mcp-server` | Simulado | Sistemas internos | 9 | OK: `get_basic_information_elemento_configuracion` |  |
| `documentacion-legado-mcp-server` | Simulado | Servicio externo con llave | 13 | OK: `legado_get_repository_info` |  |
| `inventario-hosts-mcp-server` | Simulado | Sistemas internos | 3 | OK: `inventario_exist_host` |  |
| `mensajeria-colas-mcp-server` | Simulado | Sistemas internos | 12 | OK: `revisar_estado_de_canales` |  |
| `base-datos-sql-mcp-server` | Simulado | Sistemas internos | 13 | OK: `execute-sel-query` |  |
| `monitoreo-incidentes-mcp-server` | Simulado | Sistemas internos | 3 | OK: `get_current_service_status` |  |
| `rendimiento-linux-mcp-server` | Simulado | Sistemas internos | 7 | OK: `rendimiento_cpu_status` |  |
| `optimizador-broker-mcp-server` | Simulado | Servicios o permisos de AWS que la sandbox no tiene | 1 | OK: `get_broker_configuration` |  |
| `broker-mensajes-mcp-server` | Simulado | Servicios o permisos de AWS que la sandbox no tiene | 12 | OK: `list_users` |  |
| `bases-datos-nube-mcp-server` | Simulado | Servicios o permisos de AWS que la sandbox no tiene | 8 | OK: `bdnube_describe_db_instances` |  |
| `generador-proyectos-mcp-server` | Simulado | Sistemas internos | 2 | OK: `create-java-scaffold` |  |
| `identidad-aplicaciones-mcp-server` | Simulado | Sistemas internos | 6 | OK: `identidad_list_applications` |  |
| `consultas-analiticas-mcp-server` | Simulado | Servicios o permisos de AWS que la sandbox no tiene | 2 | OK: `sql-execute` |  |
| `notificaciones-triage-mcp-server` | Simulado | Servicio externo con llave | 1 | OK: `send_notification` | Nunca envía nada |
| `red-sdwan-mcp-server` | Simulado | Sistemas internos | 12 | OK: `sdwan_get_edge` |  |
| `red-wan-mcp-server` | Simulado | Sistemas internos | 11 | OK: `wan_get_devices` |  |
| `gestion-vulnerabilidades-mcp-server` | Simulado | Sistemas internos | 4 | OK: `vulnerability` |  |
| `servidor-aplicaciones-mcp-server` | Simulado | Sistemas internos | 6 | OK: `get_servidor_status` |  |
| `busqueda-web-mcp-server` | Simulado | Servicio externo con llave | 1 | OK: `web-search` |  |
| `monitoreo-infra-mcp-server` | Simulado | Sistemas internos | 8 | OK: `get_metrics` |  |
## Qué falta o no se verificó

- `kaizen-docs-mcp-server`: solo se probó una tool que arma la URL sin llamar a Backstage. Las que leen TechDocs fallarán, porque nuestro Backstage no los publica.
- Tres de los simulados (observabilidad, auditoría y bases de datos en la nube) podrían ser reales con un rol de IAM de solo lectura en la cuenta sandbox. Eso requiere aprobación.
- Los MCP reales todavía no tienen `AuthorizationPolicy` por scope de Cognito, como sí la tienen `consulta-productos` y `cartera`. Cualquier pod de la malla puede llamarlos.
- `kubernetes-mcp-server` no tiene permisos fuera de `harness-poc`, así que sus tools de todo el clúster deberían fallar por permisos. Esto no se probó.

## Cómo repetirlo

- **Simulador:** `kubectl apply -k harness/mcps-kaizen`. Después, `kubectl rollout restart deployment/mcp-simulador -n harness-poc`.
- **Reales:** con material local que no va al repo (copia del código fuente y sus manifiestos), en la carpeta de contexto de la PoC.
- **Verificar:** copiar `verificar.mjs` a un pod `node:22-alpine` en `harness-poc` y correr `node verificar.mjs`.
