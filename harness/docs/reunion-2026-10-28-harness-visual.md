# Reunión "Harness Visual" (28-oct-2026)

Miércoles 28 de octubre de 2026, 10:00 a 10:30 a. m. Se presentó el documento *Definicion_Harness_v1.0*.

Resumen hecho a partir de la transcripción, con ayuda de Copilot. No incluye nombres de personas.

## En una línea

Construir una PoC **visual** en Kaizen donde alguien elija el tipo de agente y configure modelo, MCPs, skills, contexto e identidad, y que genere una salida usable (repo o blueprint). Así se prueba si Kaizen sirve como **harness externo** para agentes de distintas tecnologías.

## Objetivo

1. Alinear qué es un Agent Harness, qué no es, qué problemas resuelve y en qué se diferencian el interno y el externo.
2. Llevar esa definición a una PoC que responda: **¿puede Kaizen dar una configuración común y gobernada a agentes hechos con tecnologías distintas (pro-code y low-code)?**

## Temas tratados

**Qué es el harness.** El modelo razona, pero solo no es una solución empresarial. El harness es todo lo que lo rodea para que actúe de forma confiable, segura y repetible: contexto, reglas, herramientas, modelos, subagentes, permisos, identidad, memoria, verificación, trazas, políticas, pruebas y evidencias. *"El modelo razona; el harness lo vuelve confiable."*

**Problemas que debe resolver:**
- Agentes que no terminan su tarea por falta de permisos, contexto o herramientas.
- Contexto no gobernado y controles de IA fragmentados.
- Accesos inconsistentes a modelos, datos, MCPs y bases de conocimiento.
- Falta de trazabilidad y evidencias, y la regulación convertida en cuello de botella.
- Dificultad para escalar agentes de forma confiable.

**Interno vs. externo:**

| | Harness interno | Harness externo |
|---|---|---|
| Quién lo da | La plataforma o SDK del agente (n8n, LangGraph, CrewAI…) | La organización, encima de esas plataformas |
| Qué cubre | Ciclo de ejecución, uso de tools, contexto, memoria | Identidad, seguridad, accesos, políticas, guardrails, observabilidad, trazas, evidencias, gobierno |
| En la PoC | Se usa, no se reemplaza | **Es el foco** |

**No es solo gobierno.** El harness tiene tres partes:
- **habilitar**, para que el agente pueda actuar;
- **controlar**, para que actúe dentro de límites;
- **verificar**, para demostrar qué hizo.

**Papel de Kaizen.** Sería el punto central con los catálogos (agentes, skills, MCPs), plantillas, políticas como código, identidades y accesos, selección de modelo, bases de conocimiento y blueprints. Desde ahí se configura el agente y se genera una salida para su plataforma.

**Experiencia visual primero.** Se prefiere un formulario parametrizado antes que un chat que lo resuelva todo, para controlar el alcance y mostrar valor rápido.

**Alcance del MVP.** La salida podría ser un scaffold, un repo, archivos de configuración o algo casi listo para desplegar. Riesgo: un scaffold sirve bien para pro-code, pero no representa bien a low-code (n8n).

**Hoja de ruta en 4 fases:**

| Fase | Contenido |
|---|---|
| 1. Harness mínimo | Identidad del agente, acceso mínimo, contexto autorizado, LLM, MCP Gateway, verificación, trazas, aprobación humana, línea base |
| 2. Controles automáticos | Policy-as-code, guardrails, límites, gates, clasificación de fallas, mejora continua |
| 3. Capacidades reutilizables | Registro de skills, contexto vivo, memoria gobernada, catálogo de MCPs, procedencia, madurez |
| 4. Plantillas versionadas | Plantillas por tipo de agente, evaluaciones automáticas, versionamiento, propagación de mejoras |

## Decisiones

1. La PoC valida a **Kaizen como harness externo**; no construye ni reemplaza el harness interno de cada plataforma.
2. La primera experiencia es **visual y parametrizada**, no un chat.
3. La salida debe ser **usable**: repo, blueprint o configuración cercana al despliegue, no una maqueta.
4. Se **reutilizan los catálogos de Kaizen** (agentes, MCPs, skills, plantillas), sin crear un inventario paralelo.
5. Primero se demuestra la capacidad transversal; seguridad, gobierno y operación completos vienen después.
6. El alcance del MVP se afina **después de la primera entrega**, que sirve para confirmar y descubrir brechas.
7. Empezar por **pro-code** es aceptable; low-code queda como objetivo deseable.

## Compromisos

| Rol | Compromiso |
|---|---|
| Arquitectura técnica de IA | Compartir la presentación y la documentación de definición, alcance, brechas y hoja de ruta |
| Arquitectura técnica de IA | Acompañar la validación y revisar las brechas tras la primera prueba |
| Equipo constructor de la PoC | Revisar la documentación y definir el alcance y la salida del primer entregable |
| Equipo constructor de la PoC | Construir la experiencia gráfica para configurar un agente (tipo, MCPs y demás piezas) |
| Equipo constructor de la PoC | Decidir si se soporta solo pro-code o también low-code |
| Equipo constructor de la PoC | Generar una salida verificable (repo, scaffold, blueprint o parametrización) |
| Equipo constructor de la PoC | Ajustar el plan de trabajo, presentarlo al liderazgo y mostrar avances periódicos, posiblemente semanales |

## Preguntas abiertas

- ¿Solo pro-code o también low-code en la primera versión?
- ¿Qué forma exacta tendrá la salida: scaffold, código, archivos declarativos, blueprint o una combinación?
- ¿El MVP despliega el agente o termina en una configuración lista para desplegar?
- ¿Qué controles entran en el piloto (identidad, guardrails, políticas, observabilidad, pruebas, aprobaciones, trazas) y cuáles quedan para después?
- ¿Cómo se hace el inventario corporativo de agentes y se concilia con Kaizen, la CMDB y otros catálogos?
- ¿Quién opera el harness, atiende fallas y gestiona excepciones?
- ¿Con qué marco común se evalúan agentes pro-code y low-code?

## Definiciones que se explicaron

| Término | Significado |
|---|---|
| **Agent Harness** | Capa de capacidades de ingeniería, ejecución, seguridad, control y gobierno que rodea al agente durante su vida |
| **Harness interno** | Lo que trae la plataforma o SDK del agente: ciclo de ejecución, tools, contexto |
| **Harness externo** | Capa que construye la organización para aplicar identidad, seguridad, políticas, observabilidad y gobierno, sin importar la tecnología del agente |
| **Runtime agéntico** | Entorno donde corre el agente y ejecuta su ciclo de razonar y actuar |
| **Capa transversal** | Servicios y controles comunes a todas las plataformas, para que cada equipo no los rehaga |
| **Policy-as-code** | Reglas de la organización convertidas en controles ejecutables y versionados |
| **Gate** | Punto de control que decide si un agente o cambio puede pasar a la siguiente etapa |
| **Blueprint** | Declaración de lo que necesita un agente: tecnología, modelo, MCPs, skills, contexto, identidad y accesos |
| **Configuración transversal** | Configuración que se aplica igual a agentes de tecnologías distintas. Es lo que Kaizen debe demostrar |

## Cómo responde la PoC a lo acordado

| Lo acordado | Estado en la PoC |
|---|---|
| Experiencia visual para configurar el agente | Hecho: plantilla "Agente con Harness" en Backstage |
| Reutilizar catálogos al estilo Kaizen | Hecho: catálogo de MCPs, tools, skills, agentes y modelos |
| Salida usable | Hecho: repo con ficha, manifiesto (`harness.yaml`) y blueprint de accesos |
| Pro-code y low-code | Parcial: la plantilla ofrece ambos, pero solo pro-code tiene un caso funcionando |
| Fase 1: identidad, acceso mínimo, LLM, trazas | Hecho en el caso real: Cognito por scope, Istio 200/403, LLM en clúster, trazas |
| Fase 1: MCP Gateway y aprobación humana | Pendiente |
| Llegar al despliegue | Pendiente: la plantilla aún no genera los manifiestos ni la identidad |
