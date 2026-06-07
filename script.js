const visor = document.getElementById('visor');
const mapa = document.getElementById('mapa-canvas');


let isDragging = false;
let startX, startY;

// --- CONFIGURACIÓN DE ZOOM ---
let zoom = 1;          // Zoom inicial (1 = 100%)
const ZOOM_MIN = 0.5;   // Máximo alejamiento (50%)
const ZOOM_MAX = 1.2;   // Máximo acercamiento (200%)
const ZOOM_SPEED = 0.1; // Qué tan rápido hace zoom la ruedita

// Posición actual del mapa (las manejamos en variables para que sea más exacto)
let mapX = 0;
let mapY = 0;

// 1. EVENTO DE LA RUEDITA (ZOOM)
visor.addEventListener('wheel', (e) => {
    e.preventDefault(); // Evita que la página haga scroll común

    // Detecta si la rueda va para arriba (aprox) o para abajo (aleja)
    if (e.deltaY < 0) {
        zoom += ZOOM_SPEED;
    } else {
        zoom -= ZOOM_SPEED;
    }

    // Ponemos límites al zoom para que no se vaya al infinito
    zoom = Math.min(Math.max(zoom, ZOOM_MIN), ZOOM_MAX);

    // Aplicamos los cambios visuales y recalculamos límites por si quedó desfasado
    actualizarTransformacion();
});

// 2. HACER CLICK (MOUSEDOWN)
visor.addEventListener('mousedown', (e) => {
    // Si hacés click en la UI, ignoramos el arrastre
    if (e.target.closest('.topbar') || e.target.closest('.tienda')) return;

    isDragging = true;
    // Guardamos la posición del click restándole donde ya estaba el mapa
    startX = e.pageX - mapX;
    startY = e.pageY - mapY;
});

// 3. DEJAR DE HACER CLICK (MOUSEUP)
window.addEventListener('mouseup', () => {
    isDragging = false;
});

// 4. MOVER EL MOUSE (MOUSEMOVE)
window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();

    // Nueva posición tentativa
    mapX = e.pageX - startX;
    mapY = e.pageY - startY;

    actualizarTransformacion();
});

// 5. FUNCIÓN CENTRALIZADA PARA MOVER Y APLICAR LÍMITES
function actualizarTransformacion() {
    // Cuando aplicamos "scale", el tamaño visual del mapa cambia.
    // Multiplicamos el ancho original por el nivel de zoom para saber cuánto mide realmente en pantalla.
    const mapaAnchoVisual = mapa.clientWidth * zoom;
    const mapaAltoVisual = mapa.clientHeight * zoom;

    // Límites máximos y mínimos dinámicos adaptados al zoom actual
    const maxLeft = 0;
    const maxTop = 0;
    const minLeft = visor.clientWidth - mapaAnchoVisual;
    const minTop = visor.clientHeight - mapaAltoVisual;

    // Aplicar los límites de los bordes
    if (mapX > maxLeft) mapX = maxLeft;
    if (mapY > maxTop) mapY = maxTop;
    if (mapX < minLeft) mapX = minLeft;
    if (mapY < minTop) mapY = minTop;

    /* IMPORTANTE: Usamos transform para mover y escalar al mismo tiempo.
       Agregamos "origin: top left" en CSS o lo forzamos acá para que los 
       cálculos de los límites coincidan perfectamente con la esquina superior izquierda.
    */
    mapa.style.transformOrigin = "top left";
    mapa.style.transform = `translate(${mapX}px, ${mapY}px) scale(${zoom})`;
}