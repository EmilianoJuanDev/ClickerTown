# 🔌 GUÍA DE INTEGRACIÓN: Adapta tu Proyecto Actual

## Tienes 3 Opciones

### Opción A: Reemplazar TODO (Recomendado)
- ⏱️ Tiempo: 2-3 horas
- ✅ Mejor: Sistema limpio desde cero
- ✅ Recomendado si empezaste hace poco

### Opción B: Agregar gradualmente
- ⏱️ Tiempo: 4-5 horas
- ✅ Mantiene tu código actual
- ✅ Recomendado si tienes mucho avanzado

### Opción C: Solo lo que necesitas
- ⏱️ Tiempo: 30 min
- ✅ GridManager + CameraManager
- ✅ Sin tocar arquitectura de edificios

---

## 🟢 OPCIÓN A: Implementar desde Cero (Recomendado)

### Paso 1: Copiar archivos necesarios

```
Tu Proyecto/
├── GridManager.js           ← Copiar
├── CameraManager.js         ← Copiar
├── BuildingClasses.js       ← Copiar (del anterior)
├── WorkerClasses.js         ← Copiar (del anterior)
├── VillageSceneCompleta.js  ← Usar como base
└── index.html
```

### Paso 2: Actualizar index.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Pueblo Cozy - Grid Edition</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.js"></script>
</head>
<body>
    <script type="module">
        import GridManager from './GridManager.js';
        import CameraManager from './CameraManager.js';
        import { WoodcutterHut, Mine, Farm, Market } from './BuildingClasses.js';
        import VillageScene from './VillageSceneCompleta.js';

        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: VillageScene
        };

        const game = new Phaser.Game(config);

        // Ajustar size on resize
        window.addEventListener('resize', () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>
```

### Paso 3: Personalizar VillageSceneCompleta.js

Solo necesitas cambiar estos valores en `create()`:

```javascript
// Parámetros del grid
const GRID_WIDTH = 12;      // ← Cambiar según necesites
const GRID_HEIGHT = 9;      // ← Cambiar según necesites
const TILE_SIZE = 64;       // ← 64px por casilla

// Parámetros de cámara (si quieres)
this.cameraManager.minZoom = 0.5;   // Zoom out máximo
this.cameraManager.maxZoom = 3;     // Zoom in máximo
this.cameraManager.baseZoom = 1.5;  // Zoom inicial
```

**¡LISTO!** Ya tienes todo funcionando.

---

## 🟡 OPCIÓN B: Integrar en tu Proyecto Actual

Si ya tienes code y quieres mantenerlo...

### Paso 1: Agregar GridManager

En tu Scene.create():

```javascript
// Agregar esto:
this.gridManager = new GridManager(this, 12, 9, 64);

// Dibujar grid (opcional, comentar para ocultarlo):
this.gridManager.drawGridLines();
```

### Paso 2: Agregar CameraManager

En tu Scene.create():

```javascript
// Agregar esto después del gridManager:
this.cameraManager = new CameraManager(
    this,
    this.gridManager.worldWidth,
    this.gridManager.worldHeight
);
```

### Paso 3: Actualizar tu update()

Agregar esto al principio:

```javascript
update(time, deltaTime) {
    // AGREGAR ESTA LÍNEA PRIMERO
    this.cameraManager.update(deltaTime);

    // El resto de tu código aquí...
    // ...
}
```

### Paso 4: Agregar Sistema de Construcción

Agregar esto en tu Scene.create():

```javascript
// Sistema de construcción
this.buildingToPlace = null;

// Botones (adapta a tu HTML)
this.input.on('pointerdown', (pointer) => {
    if (pointer.button === 0 && this.gridManager.placementMode) {
        const mouseWorld = this.cameraManager.getMouseWorldPosition();
        const gridPos = this.gridManager.selectedPosition;

        if (gridPos && this.buildingToPlace) {
            this.createBuildingAtGrid(
                this.buildingToPlace.key,
                gridPos.row,
                gridPos.col
            );
        }
    }
});

this.input.on('pointermove', (pointer) => {
    if (this.gridManager.placementMode) {
        const mouseWorld = this.cameraManager.getMouseWorldPosition();
        this.gridManager.updatePlacementPreview(mouseWorld.x, mouseWorld.y);
    }
});

// ESC para cancelar
this.input.keyboard.on('keydown-ESC', () => {
    if (this.gridManager.placementMode) {
        this.gridManager.deactivatePlacementMode();
        this.buildingToPlace = null;
    }
});
```

### Paso 5: Adaptar tu lógica de construcción

```javascript
// Convertir tu createBuilding() a grid-based

// ANTES:
createBuilding(x, y, type) {
    const building = new WoodcutterHut(this, x, y);
    this.buildings.push(building);
}

// DESPUÉS:
createBuildingAtGrid(buildingType, row, col) {
    let building;
    const pixelPos = this.gridManager.gridToPixel(row, col);

    // Crear edificio según tipo
    switch (buildingType) {
        case 'woodcutter':
            building = new WoodcutterHut(this, pixelPos.centerX, pixelPos.centerY);
            break;
        case 'mine':
            building = new Mine(this, pixelPos.centerX, pixelPos.centerY);
            break;
        // ... etc
    }

    // Ocupar casillas en grid
    const width = this.buildingToPlace.width;
    const height = this.buildingToPlace.height;

    if (this.gridManager.occupyArea(row, col, width, height, building.name)) {
        building.gridRow = row;
        building.gridCol = col;
        this.buildings.push(building);
        this.gridManager.deactivatePlacementMode();
        return building;
    }

    building.destroy();
    return null;
}
```

---

## 🔵 OPCIÓN C: Solo Grid + Camera (Sin cambiar edificios)

Si solo quieres los managers sin cambiar tu arquitectura:

### Simplemente agrega a tu Scene:

```javascript
create() {
    // Tu código actual...

    // AGREGAR ESTO:
    this.gridManager = new GridManager(this, 12, 9, 64);
    this.cameraManager = new CameraManager(
        this,
        this.gridManager.worldWidth,
        this.gridManager.worldHeight
    );
}

update(time, deltaTime) {
    // AGREGAR ESTA LÍNEA:
    this.cameraManager.update(deltaTime);

    // Tu código actual...
}
```

**Ahora tienes:**
- ✅ Control de cámara profesional
- ✅ Grid system (aunque tus edificios no lo usen todavía)

Después puedes migrar edificios gradualmente.

---

## 🧪 Testing

### Verificar que funciona:

```javascript
// En tu update():
if (this.input.keyboard.checkDown('P')) {
    console.log('Grid state:');
    this.gridManager.debugGrid();
    
    console.log('Camera info:');
    console.log(this.cameraManager.debugInfo());
}
```

Presiona P en cualquier momento.

---

## 🔄 Migrar Edificios Existentes a Grid

Si ya tienes edificios sin grid:

### Paso 1: Obtener posición del edificio

```javascript
// Edificio existente en pixel coords:
const building = this.buildings[0];
console.log(`Pixel: [${building.x}, ${building.y}]`);
```

### Paso 2: Convertir a grid

```javascript
const gridPos = this.gridManager.pixelToGrid(building.x, building.y);
console.log(`Grid: [${gridPos.row}, ${gridPos.col}]`);
```

### Paso 3: Re-colocar en grid

```javascript
const width = 1;  // o 2, 3, etc según edificio
const height = 1;

if (this.gridManager.occupyArea(gridPos.row, gridPos.col, width, height, building.name)) {
    building.gridRow = gridPos.row;
    building.gridCol = gridPos.col;
    building.gridWidth = width;
    building.gridHeight = height;
    console.log('✅ Edificio migrado a grid');
} else {
    console.log('❌ No se pudo colocar en grid');
}
```

---

## ⚠️ Problemas Comunes

### "No funciona scroll del mouse"

```javascript
// Asegúrate que input está activo:
this.input.mouse.enabled = true;
```

### "Preview no se ve"

```javascript
// Verifica que el graphics está en la escena:
this.gridManager.highlightGraphics.setDepth(10);
this.gridManager.highlightGraphics.setScrollFactor(1);
```

### "Cámara salta cuando zoom"

```javascript
// Aumentar lerpSpeed (suavidad):
this.cameraManager.lerpSpeed = 0.15;  // Defecto
// Más bajo = más rápido
// Más alto = más suave
```

### "Edificios aparecen en posición incorrecta"

```javascript
// Verificar que gridToPixel retorna centerX/centerY:
const pixelPos = this.gridManager.gridToPixel(row, col);
new WoodcutterHut(this, pixelPos.centerX, pixelPos.centerY);
//                            ^^^^^^        ^^^^^^
// Usar CENTER, no esquina superior
```

---

## 📋 Checklist de Implementación

Según tu opción:

### Opción A (Desde Cero)
- [ ] Copié GridManager.js, CameraManager.js
- [ ] Actualicé index.html con imports
- [ ] Cambié GRID_WIDTH, GRID_HEIGHT, TILE_SIZE según necesito
- [ ] Probé controles de cámara
- [ ] Probé colocar edificios
- [ ] Probé guardar/cargar

### Opción B (Integración)
- [ ] Agregué GridManager en create()
- [ ] Agregué CameraManager en create()
- [ ] Actualicé update() para llamar cameraManager.update()
- [ ] Agregué sistema de construcción con grid
- [ ] Convertí createBuilding() a createBuildingAtGrid()
- [ ] Probé todo

### Opción C (Solo managers)
- [ ] Agregué GridManager y CameraManager
- [ ] Actualicé update()
- [ ] Funciona cámara
- [ ] Planeo migrar edificios después

---

## 🎯 Próximos Pasos

Cuando termines:

1. **Fase 1:** Grid + Cámara funcionando ✅
2. **Fase 2:** Edificios en grid ✅
3. **Fase 3:** Sistema de mejoras (del anterior)
4. **Fase 4:** Guardado/cargado con grid
5. **Fase 5:** Optimizaciones y features avanzadas

**¿Cuál es tu opción?** A, B o C? 🤔

