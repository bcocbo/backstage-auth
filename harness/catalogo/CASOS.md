# Casos para jugar con la plantilla "Agente con Harness"

El catálogo es ficticio y sigue la forma del Catálogo IA de Kaizen: todo es `Component` y `spec.type` dice qué es. Los archivos se generan con `gen-catalogo-kaizen.js`. Cada pieza lleva la etiqueta `caso-...` para filtrarla.

| Pieza | Forma | Cantidad |
|---|---|---|
| Agentes | `Component`, type `agent`, sufijo `_aiagent`, código de aplicación | 9 (8 dentro del harness, 1 fuera) |
| MCPs | `Component`, type `mcp`, sufijo `_smcp`, scope `<dominio>-<nombreMcp>`, sensibilidad | 12 |
| Tools | `Component`, type `tool`, hijas del MCP (`subcomponentOf`); acción lectura, escritura o escritura con aprobación | 27 |
| Prompts | `Component`, type `prompt`, hijos del MCP | 4 |
| Skills | `Component`, type `skill`, con categoría, complejidad y madurez | 7 |
| Modelos | `Resource`, type `llm-model` (no están en el Catálogo IA; se usan para armar) | 3 |
| Bases de conocimiento | `Resource`, type `knowledge-base` | 5 |

## Casos

1. **Atención al cliente (pro-code).** Modelo de razonamiento; MCPs consulta-productos, clientes y pqr; skill respuesta-clientes; base portafolio-productos.
   *Probar:* `clientes_smcp` tiene sensibilidad alta.
2. **Cobranza (low-code).** Modelo ligero; MCPs cartera y notificaciones; skill negociacion-cobranza.
   *Probar:* elegir solo las tools `consultar_obligaciones`, `simular_acuerdo` y `registrar_acuerdo_pago`. El blueprint marca la última con aprobación humana y deja por fuera los envíos.
3. **Soporte de TI multi-agente (pro-code).** MCPs observabilidad y pipelines; skill diagnostico-incidentes; base runbooks-ti; invoca a `soporte-tickets_aiagent`.
4. **Asistente de desarrollo (pro-code).** Modelo de código; MCPs repositorios y catalogo-kaizen; base lineamientos-desarrollo.
   *Probar:* solo tools de lectura, para un agente que no puede escribir.
5. **Cumplimiento.** MCPs listas-restrictivas y documentos-internos; skill verificacion-cumplimiento; base normativa-regulatoria.
6. **Orquestador.** Invoca a los agentes de atención y cobranza: un agente hecho de agentes.
7. **Caso negativo.** `reportes-legado_aiagent` está marcado `fuera-del-harness`: usa credencial compartida y accede a datos sensibles sin blueprint.
