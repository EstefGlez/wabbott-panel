# Spec 002: Estructura base y navegación del panel
Estado: borrador

## Contexto y objetivo
Estructura de pantallas y navegación sobre la que se montan las demás specs del panel de atención WhatsApp. En esta spec no se implementa contenido de pantallas (van en specs 003-007); solo la estructura común, navegación y disposición adaptable.

## Historias de usuario
- HU-1. Como Héctor, quiero navegar entre Conversaciones, Negocios y Ajustes con una barra que siempre está visible, para cambiar de sección sin perder el contexto.
- HU-2. Como Héctor, quiero que al recargar la página me quede en la misma sección, para no tener que navegar de nuevo.
- HU-3. Como Héctor, quiero que en escritorio vea la lista y el detalle de conversación a la vez, y en móvil una a la vez, para aprovechar el ancho de pantalla.
- HU-4. Como Héctor, quiero que todos los botones y enlaces se puedan usar con teclado y se vea el foco, para navegar sin ratón.

## Definiciones
- **Destino principal**: cada una de las tres secciones de navegación (Conversaciones, Negocios, Ajustes).
- **Barra inferior**: navegación fija al pie en pantallas < 1024 px.
- **Barra lateral**: navegación fija a la izquierda en pantallas ≥ 1024 px.
- **Vista de conversación**: zona de detalle de una conversación (lista a la izquierda, detalle a la derecha en escritorio; pantallas separadas en móvil).
- **Dirección propia**: dirección en la barra del navegador que identifica un destino y se conserva al recargar la página.

## Requisitos funcionales

### Navegación principal
- RF-1: EL SISTEMA mostrará tres destinos principales en el orden: Conversaciones, Negocios, Ajustes.
- RF-2: EL SISTEMA marcará el destino activo con al menos dos indicadores visuales (color y uno más: subrayado, icono relleno, grosor de fuente o forma).
- RF-3: CADA destino tendrá su propia dirección en la barra del navegador.
- RF-4: AL cargar una dirección vacía o desconocida, EL SISTEMA mostrará Conversaciones.
- RF-5: AL recargar el navegador, EL SISTEMA conservará el destino actual.

### Disposición adaptable (responsive)
- RF-6: EN pantallas menores de 1024 px, EL SISTEMA mostrará la barra inferior fija y una sola zona de contenido.
- RF-7: EN pantallas de 1024 px o más, EL SISTEMA mostrará la barra lateral fija y, dentro de Conversaciones, dos zonas de contenido (lista y detalle).
- RF-8: (retirado: el detalle de una conversación concreta es de la spec 004).
- RF-9: EL SISTEMA evitará desplazamiento horizontal entre 360 y 430 px de ancho de ventana.
- RF-10: TODOS los elementos táctiles medirán al menos 44 × 44 px.
- RF-11: LA barra inferior no quedará tapada por la barra de inicio del iPhone.

### Accesibilidad
- RF-12: LA navegación usará elementos HTML nativos (`<nav>`, `<a>`, `<button>`).
- RF-13: EL contraste de texto será de al menos 4.5:1.
- RF-14: TODA la navegación se podrá usar con teclado y el foco será visible.
- RF-15: LOS textos de interfaz estarán en español de México.

### Estructura de pantallas (casi vacías)
- RF-16: LA pantalla de Conversaciones tendrá un título "Conversaciones" y el texto "Próximamente" mientras no se implemente su contenido (spec 003).
- RF-17: LA pantalla de Negocios tendrá un título "Negocios" y el texto "Próximamente" mientras no se implemente su contenido (specs 005 y 006).
- RF-18: LA pantalla de Ajustes tendrá un título "Ajustes" y el texto "Próximamente" mientras no se implemente su contenido (spec 007).
- RF-19: LA vista de detalle de conversación (dentro de Conversaciones) tendrá un título "Conversación" y el texto "Próximamente" mientras no se implemente (spec 004). En móvil la zona de detalle no se muestra hasta que la spec 004 permita abrir una conversación.

## Requisitos no funcionales
- RNF-1: Móvil primero con referencia de 390 px (iPhone).
- RNF-2: (retirado: es una decisión técnica y va en el plan).
- RNF-3: Ningún secreto, token ni dato real en el navegador.
- RNF-4: (retirado: lo cubre la constitución).

## Casos límite
- Ancho exactamente 1024 px: disposición de escritorio (barra lateral + dos zonas).
- Ancho 1023 px: disposición móvil (barra inferior + una zona).
- Dirección de Negocios abierta directamente, sin pasar por Conversaciones: la barra marca Negocios como activo.
- Recarga en Ajustes: se mantiene en Ajustes.

## Fuera de alcance
- Contenido real de las pantallas (specs 003 a 007).
- Datos del servicio simulado, listas, colores de negocio, horas y rendimiento de listas (spec 003).
- Login (spec 007, maqueta).
- Autenticación real, backend, base de datos.

## Criterios de finalización
- Navegación funciona en navegador a 360, 390 y 1280 px: tres destinos, activo marcado con ≥2 indicadores, direcciones correctas, recarga conserva destino.
- Barra inferior en pantallas de menos de 1024 px (no tapada por la barra de inicio del iPhone), barra lateral desde 1024 px.
- Dos zonas en escritorio dentro de Conversaciones; una zona en móvil.
- Sin desplazamiento horizontal de 360 a 430 px; elementos táctiles ≥ 44 px.
- Teclado: Tab navega, foco visible, Enter/Space activan.
- Contraste ≥ 4.5:1 en textos de navegación.
- `npm test` pasa completo, e incluye pruebas de la lógica que convierte una dirección en un destino (RF-1, RF-3, RF-4, RF-5).
- Estado: borrador → listo para `/sdd-plan`.