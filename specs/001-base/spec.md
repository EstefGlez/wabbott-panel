# Spec 001: Reglas del dominio y datos simulados
Estado: borrador

## Contexto y objetivo
Reglas de negocio y datos ficticios que usarán todas las pantallas del panel de atención de WhatsApp.
En esta fase no hay pantallas completas ni servidor: todo funciona con datos simulados.

## Usuarios
Héctor, dueño de varios negocios. Usa iPhone. Es poco técnico.

## Historias de usuario
- HU-1. Como Héctor, quiero ver cuánto tiempo queda para responder a un cliente desde el panel, para no perder la ventana de WhatsApp.
- HU-2. Como Héctor, quiero tomar una conversación y devolverla al bot, para controlar quién atiende.
- HU-3. Como Héctor, quiero abrir el chat del cliente en mi WhatsApp con un toque, para responder cuando la ventana ya cerró.
- HU-4. Como Héctor, quiero ver cuánto contexto usan las fuentes de un negocio, para que el bot no se sature.
- HU-5. Como Héctor, quiero que los teléfonos se vean ocultos en las listas, para cuidar la privacidad de los clientes.

## Definiciones
- **Ventana:** periodo de 24 horas, contado desde el último mensaje del cliente, en que se puede enviar texto libre por WhatsApp.
- **Estado de atención:** Bot, Esperando asesor o Atendido por humano.
- **Fuente activa:** fuente de conocimiento con el interruptor encendido y en estado Lista.
- **Enlace wa.me:** dirección que abre el chat con un número en la app de WhatsApp.
- **Presupuesto de contexto:** suma de caracteres de las fuentes activas de un negocio. Límite: 30,000.
- **Código de país:** para ocultar teléfonos se asume de 2 dígitos (México es el caso de uso).

## Requisitos funcionales

### Ventana de 24 horas
- RF-1: EL SISTEMA calculará el vencimiento de la ventana como el momento del último mensaje del cliente más 24 horas.
- RF-2: MIENTRAS la ventana esté abierta, EL SISTEMA calculará el tiempo restante y un nivel: verde si faltan más de 6 horas, ámbar si faltan 6 horas o menos y 1 hora o más, rojo si falta menos de 1 hora.
- RF-3: CUANDO el tiempo restante sea cero o negativo, EL SISTEMA marcará la ventana como cerrada.
- RF-4: SI la conversación no tiene mensajes del cliente, ENTONCES EL SISTEMA tratará la ventana como cerrada.

### Estado de atención
- RF-5: EL SISTEMA soportará tres estados de atención por conversación: Bot, Esperando asesor y Atendido por humano.
- RF-6: MIENTRAS el estado sea Bot o Esperando asesor, EL SISTEMA ofrecerá solo la acción Tomar conversación.
- RF-7: MIENTRAS el estado sea Atendido por humano, EL SISTEMA ofrecerá la acción Devolver al bot.
- RF-8: MIENTRAS el estado sea Atendido por humano y la ventana esté abierta, EL SISTEMA permitirá el envío de mensajes.
- RF-9: SI el estado no es Atendido por humano o la ventana está cerrada, ENTONCES EL SISTEMA no permitirá el envío e indicará el motivo.
- RF-10: CUANDO el usuario tome una conversación, EL SISTEMA cambiará el estado a Atendido por humano y agregará al hilo un evento de sistema que lo indique.
- RF-11: CUANDO el usuario pida devolver una conversación al bot, EL SISTEMA pedirá confirmación.
- RF-12: CUANDO el usuario confirme la devolución, EL SISTEMA cambiará el estado a Bot y agregará al hilo un evento de sistema que lo indique.
- RF-13: SI el usuario cancela la confirmación, ENTONCES EL SISTEMA conservará el estado Atendido por humano y no agregará eventos.

### Enlace wa.me
- RF-14: EL SISTEMA construirá el enlace wa.me de una conversación con `https://wa.me/` seguido del número del cliente en formato internacional, solo con dígitos, sin "+", espacios ni guiones. Ejemplo: +52 33 1234 5678 produce `https://wa.me/523312345678`.
- RF-15: SI el número del cliente tiene menos de 10 o más de 15 dígitos, ENTONCES EL SISTEMA no ofrecerá el enlace wa.me para esa conversación.

### Presupuesto de contexto
- RF-16: EL SISTEMA calculará el presupuesto de contexto de un negocio sumando los caracteres de sus fuentes activas. Las fuentes inactivas y las que no estén en estado Lista no cuentan.
- RF-17: MIENTRAS el total sea mayor a 24,000 caracteres y no mayor a 30,000, EL SISTEMA marcará el nivel como advertencia.
- RF-18: MIENTRAS el total sea mayor a 30,000 caracteres, EL SISTEMA marcará el nivel como peligro y dará el mensaje "Demasiado texto: el bot puede responder más lento o ignorar partes."
- RF-19: EL SISTEMA reconocerá cinco tipos de fuente de conocimiento: enlace, PDF, Markdown, TXT y texto pegado.

### Privacidad del teléfono
- RF-20: PARA las listas, EL SISTEMA ofrecerá el teléfono del cliente con los dígitos intermedios ocultos: conserva el código de país, los dos dígitos siguientes y los últimos cuatro, y sustituye el resto por "•••". Ejemplo: +52 33 ••• 5678.
- RF-21: SI el número tiene menos de 10 dígitos, ENTONCES EL SISTEMA ofrecerá solo los últimos cuatro dígitos.
- RF-22: PARA la vista de conversación, EL SISTEMA ofrecerá el teléfono completo con formato legible.

### Datos simulados
- RF-23: EL SISTEMA incluirá solo datos ficticios. Ningún nombre ni teléfono será real.
- RF-24: EL SISTEMA incluirá al menos 3 negocios, cada uno con nombre y color distintos.
- RF-25: EL SISTEMA incluirá al menos 12 conversaciones repartidas entre los negocios, que cubran: cada estado de atención; ventana en verde, ámbar, rojo y cerrada; mensajes sin leer; mensajes que no son texto (imagen y audio); y eventos de sistema, incluidos los de tomar y devolver.
- RF-26: EL SISTEMA generará las horas de los datos simulados relativas al momento actual, para que los estados de ventana se mantengan al abrir el panel en cualquier momento.
- RF-27: EL SISTEMA incluirá fuentes de ejemplo para cada negocio, con al menos un enlace, un PDF y un Markdown; con los estados Lista, Procesando y Error; y con al menos un negocio cuyas fuentes activas sumen entre 24,001 y 30,000 caracteres.

## Requisitos no funcionales
- RNF-1. Idioma: todos los textos que genere el sistema estarán en español de México.
- RNF-2. Privacidad: ningún secreto, token ni dato real estará en el código que corre en el navegador.

## Casos límite
- Tiempo restante exactamente de 6 h o de 1 h: nivel ámbar (RF-2).
- Tiempo restante exactamente cero: cerrada (RF-3).
- Presupuesto exactamente de 24,000 o de 30,000 caracteres: no cambia de nivel; solo cambia al superarlo (RF-17, RF-18).
- Fuente inactiva o en estado Procesando o Error: no cuenta para el presupuesto (RF-16).
- Teléfono con menos de 10 o más de 15 dígitos: sin enlace wa.me (RF-15).
- Conversación sin mensajes del cliente: ventana cerrada (RF-4).
- Devolución al bot cancelada: sin cambios ni eventos (RF-13).
- Tomar una conversación que ya está atendida por humano: no es válido y se rechaza.

## Fuera de alcance
- Estructura de pantallas, navegación y diseño adaptable (spec 002).
- Pantallas de bandeja, conversación, negocios, fuentes, login y avisos (specs 003 a 007).
- Abrir el enlace wa.me en el navegador y el flujo de agregar fuentes por enlace, archivo o texto.
- Envío real de mensajes, inicio de sesión real y procesamiento real de fuentes.
- Servidor y base de datos.

## Criterios de finalización
- Las reglas RF-1 a RF-22 tienen pruebas automáticas en verde, incluidos los casos límite.
- Los datos simulados cumplen RF-23 a RF-27, verificado con pruebas.
- `npm test` pasa completo.

## Dudas abiertas
- [NECESITA ACLARACIÓN] ¿Las fuentes en estado Procesando o Error deben contar para el presupuesto? Esta spec supone que no (RF-16).
- [NECESITA ACLARACIÓN] El límite de 30,000 caracteres viene del bot actual. Confirmar después con pruebas de la IA gratuita.
- [NECESITA ACLARACIÓN] Código de país de 2 dígitos: confirmar si se necesitarán números de otros países.
