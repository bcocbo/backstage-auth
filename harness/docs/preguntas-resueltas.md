# Preguntas resueltas

Dudas que salieron mientras se construía la PoC, con su respuesta corta.

## Sobre el harness

**¿Qué es un harness?**
Lo que rodea al agente para habilitarlo (identidad, acceso a modelo y MCPs) y controlarlo (permisos, políticas, trazas). Tiene dos mitades: habilitar y controlar.

**¿"Dentro del harness" es solo un formulario?**
No. El formulario es solo el nacimiento del agente. "Dentro del harness" significa que los controles se aplican durante toda su vida: cada llamada lleva su identidad, Istio revisa el permiso y queda una traza.

**¿Qué se busca con esto?**
Que nadie cree agentes con un botón suelto y permisos amplios. Cada agente nace con los permisos y accesos justos, y la plataforma los hace cumplir.

**¿El agente harness queda en el catálogo como un agente más?**
Sí. Es un Component de tipo `agent` (sufijo `_aiagent`), con sus dependencias a MCPs, modelo y skills, igual que en Kaizen.

## Sobre lo construido

**¿Cuál es el MCP real?**
`consulta-productos_smcp`. Corre en el EKS con dos tools y datos ficticios. `cartera_smcp` también corre, solo para mostrar el bloqueo (403). Los otros MCPs del catálogo son fichas sin servicio detrás.

**¿Qué hace hoy el agente creado desde la plantilla?**
Todavía no ejecuta nada. El repo generado declara sus piezas (`catalog-info.yaml`, `harness.yaml`, blueprint) y trae un esqueleto de código. El agente que sí funciona se construyó a mano a partir de ese blueprint, en `harness/casos/atencion-cliente/`.

**¿Ese agente coordina o fusiona?**
Si corriera, sería coordinador, nunca fusión. Con solo MCPs es un agente con tools. Si elige otros agentes, sería un supervisor que delega. Cada pieza conserva su identidad y permisos.

**¿Unir varios agentes y MCPs en uno es común?**
Sí, pero componiendo, no fusionando. Para agentes se llama orquestación o sistema multiagente. Para MCPs se llama agregación, con un MCP Gateway. Juntar todo en un monolito confunde al modelo y rompe el mínimo privilegio.

## Sobre la plataforma

**¿Cómo se activó Backstage si el CI/CD falla?**
No se construyó imagen nueva. Se usó la que ya corría y todo se cargó por fuera:
1. Configuración en un ConfigMap montado como `app-config.local.yaml`, que permite el tipo `Template` en el catálogo.
2. Token de GitHub actualizado en el Secret de Backstage.
3. Catálogo y plantilla leídos desde GitHub en tiempo de ejecución, registrados por la API del catálogo.
4. Agente, MCPs y modelo desplegados con `kubectl`, sobre imágenes públicas y con el código en ConfigMaps.

Riesgo: si el pipeline redespliega Backstage con su manifiesto original, se pierde el montaje del ConfigMap.

**¿El catálogo se puede alimentar de un repositorio?**
Ya lo hace. `harness/catalogo/all.yaml` es un índice (`Location`) que Backstage relee cada pocos minutos. Para agregar una pieza: escribir su YAML, listarlo en `all.yaml` si es nuevo, y hacer push a `harness-poc`.

**¿Y de varios repositorios, incluido uno innersource con credenciales?**
1. Guardar el token de solo lectura del innersource en el Secret de Backstage (nunca en un archivo ni en el repo).
2. En `app-config.local.yaml`, declarar la integración (`integrations.azure` o `integrations.github`) usando esa variable.
3. Listar ambas ubicaciones en `catalog.locations`.

En GitHub Enterprise hay que poner las dos entradas de `integrations.github`, porque Backstage reemplaza listas en vez de combinarlas.

**¿Por qué no se usa el LLM Gateway corporativo?**
Requiere un trámite con caso de uso, código CMDB y cuenta de IA, que la PoC no tiene. El modelo dentro del clúster expone la misma API (compatible con OpenAI). Al portar, solo cambian la URL y la credencial.

**¿El modelo de identidad es el vigente?**
Sí: user pool `consumo-mcps`, un App Client por agente, un scope por MCP y autorización con Istio. La evolución es Entra ID con OBO hacia un MCP Gateway, que aún no reemplaza a Cognito.

**¿Se puede controlar por tool y no solo por MCP?**
Istio controla el MCP completo. El control por tool le corresponde al MCP Gateway. En la PoC se puede mostrar con un gateway simulado.

**¿En qué rama queda todo?**
`harness-poc` del repo `backstage-auth`. Cada agente creado con la plantilla tiene su propio repo.

## Preguntas abiertas

- ¿Dónde está el repo del scaffold de MCPs y agentes en Python, para copiar su estructura?
- ¿Publicamos el agente con un nombre web o seguimos con port-forward?
- ¿Cuál es la URL del LLM Gateway en DEV?
