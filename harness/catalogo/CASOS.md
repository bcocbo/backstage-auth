# Casos para jugar con la plantilla "Agente con Harness"

Todo el catálogo es ficticio. Cada pieza lleva la etiqueta `caso-...` para filtrarla en el catálogo.

| Pieza | Cantidad |
|---|---|
| Modelos (`llm-model`) | 3 |
| MCPs (`mcp`) | 12, con scope y sensibilidad |
| Tools (`mcp-tool`) | 27; acción lectura, escritura o escritura con aprobación |
| Skills (`skill`) | 7 |
| Bases de conocimiento (`knowledge-base`) | 5 |
| Agentes (`agent`) | 9: 8 dentro del harness y 1 fuera |

## Casos

1. **Atención al cliente (pro-code).** Modelo de razonamiento; MCPs consulta-productos, clientes y pqr; skill respuesta-clientes; base portafolio-productos.
   *Probar:* `mcp-clientes` tiene sensibilidad alta.
2. **Cobranza (low-code).** Modelo ligero; MCPs cartera y notificaciones; skill negociacion-cobranza.
   *Probar:* elegir solo las tools `consultar_obligaciones`, `simular_acuerdo` y `registrar_acuerdo_pago`. El blueprint marca la última con aprobación humana y deja por fuera los envíos.
3. **Soporte de TI multi-agente (pro-code).** MCPs observabilidad y pipelines; skill diagnostico-incidentes; base runbooks-ti; invoca a `agente-soporte-tickets`.
   *Probar:* componer agentes como legos.
4. **Asistente de desarrollo (pro-code).** Modelo de código; MCPs repositorios y catalogo-kaizen; base lineamientos-desarrollo.
   *Probar:* solo tools de lectura, para un agente que no puede escribir.
5. **Cumplimiento (pro-code o low-code).** MCPs listas-restrictivas y documentos-internos; skill verificacion-cumplimiento; base normativa-regulatoria.
6. **Orquestador.** Invoca a los agentes de atención y cobranza: un agente hecho de agentes.
7. **Caso negativo.** `agente-reportes-legado` está marcado `fuera-del-harness`: usa credencial compartida y accede a datos sensibles sin blueprint. Sirve para mostrar qué detecta el harness.
