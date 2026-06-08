// ============================================
// EJEMPLO: VillageScene con Grid y Cámara Avanzada
// ============================================

class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
    }

    // ============================================
    // CREATE - Inicializar escena
    // ============================================
    create() {
        // Parámetros del grid
        const GRID_WIDTH = 12;      // 12 columnas
        const GRID_HEIGHT = 9;      // 9 filas
        const TILE_SIZE = 64;       // 64 píxeles por casilla

        // Crear grid manager
        this.gridManager = new GridManager(this, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE);

        // Crear camera manager
        this.cameraManager = new CameraManager(
            this,
            this.gridManager.worldWidth,
            this.gridManager.worldHeight
        );

        // Crear fondo
        this.createBackground();

        // Crear grupos
        this.buildings = [];
        this.workers = this.add.group();
        this.buildingDisplays = [];

        // Sistema de construcción
        this.buildingToPlace = null;
        this.selectedBuilding = null;

        // UI
        this.createBuildingButtons();
        this.createDebugUI();

        // Events
        this.setupEvents();

        // Dibujar grid (comentar para ocultarlo)
        this.gridManager.drawGridLines();

        console.log(`🏘️ Village Scene creada - Grid ${GRID_WIDTH}x${GRID_HEIGHT}`);
    }

    // ============================================
    // MÉTODO: Crear fondo
    // ============================================
    createBackground() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Cielo
        graphics.fillStyle(0x87ceeb, 1);
        graphics.fillRect(0, 0, this.gridManager.worldWidth, this.gridManager.worldHeight * 0.3);

        // Tierra
        graphics.fillStyle(0x90ee90, 1);
        graphics.fillRect(0, this.gridManager.worldHeight * 0.3, this.gridManager.worldWidth, this.gridManager.worldHeight * 0.7);

        graphics.generateTexture('village-background', this.gridManager.worldWidth, this.gridManager.worldHeight);
        graphics.destroy();

        // Centrar la imagen en el mundo
        const bg = this.add.image(
            this.gridManager.worldWidth / 2,  // Centro X
            this.gridManager.worldHeight / 2, // Centro Y
            'village-background'
        );
        bg.setOrigin(0.5, 0.5);  // Origen en el centro
        bg.setDepth(-100);
        bg.setScrollFactor(1);
    }

    // ============================================
    // MÉTODO: Crear botones de edificios
    // ============================================
    createBuildingButtons() {
        const buttonData = [
            { key: 'woodcutter', name: '🪵 Leñador', width: 1, height: 1, cost: 100 },
            { key: 'mine', name: '⛏️ Mina', width: 2, height: 2, cost: 200 },
            { key: 'farm', name: '🌾 Granja', width: 2, height: 1, cost: 150 },
            { key: 'market', name: '🏪 Mercado', width: 2, height: 2, cost: 300 }
        ];

        let startX = 20;
        const startY = 20;
        const spacing = 150;

        buttonData.forEach((data, index) => {
            // Botón
            const button = this.add.rectangle(
                startX + (index * spacing),
                startY,
                140,
                40,
                0x4CAF50
            );
            button.setScrollFactor(0);
            button.setDepth(100);
            button.setInteractive();

            // Texto
            const text = this.add.text(
                startX + (index * spacing),
                startY,
                data.name,
                {
                    fontSize: '12px',
                    color: '#ffffff',
                    fontStyle: 'bold'
                }
            );
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(101);

            // Click listener
            button.on('pointerdown', () => {
                this.selectBuildingToPlace(data.key, data.width, data.height, data.name);
            });

            button.on('pointerover', () => {
                button.setFillStyle(0x66BB6A);
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x4CAF50);
            });
        });
    }

    // ============================================
    // MÉTODO: Seleccionar edificio para colocar
    // ============================================
    selectBuildingToPlace(buildingKey, width, height, name) {
        if (this.gridManager.placementMode) {
            console.log('❌ Ya estás en modo placement');
            return;
        }

        this.buildingToPlace = {
            key: buildingKey,
            width: width,
            height: height,
            name: name
        };

        this.gridManager.activatePlacementMode(width, height);
        console.log(`✨ Seleccionado: ${name} (${width}x${height})`);
    }

    // ============================================
    // MÉTODO: Crear edificio en grid
    // ============================================
    createBuildingAtGrid(buildingKey, row, col) {
        let building;
        const pixelPos = this.gridManager.gridToPixel(row, col);

        switch (buildingKey) {
            case 'woodcutter':
                building = new WoodcutterHut(this, pixelPos.centerX, pixelPos.centerY);
                break;
            case 'mine':
                building = new Mine(this, pixelPos.centerX, pixelPos.centerY);
                break;
            case 'farm':
                building = new Farm(this, pixelPos.centerX, pixelPos.centerY);
                break;
            case 'market':
                building = new Market(this, pixelPos.centerX, pixelPos.centerY);
                break;
            default:
                return null;
        }

        // Guardar posición en grid
        const width = this.buildingToPlace.width;
        const height = this.buildingToPlace.height;

        if (this.gridManager.occupyArea(row, col, width, height, building.name)) {
            building.gridRow = row;
            building.gridCol = col;
            building.gridWidth = width;
            building.gridHeight = height;

            this.buildings.push(building);
            this.add.existing(building);

            console.log(`✅ ${building.name} colocado en grid[${row}, ${col}]`);
            return building;
        } else {
            building.destroy();
            console.log(`❌ No se pudo colocar ${building.name}`);
            return null;
        }
    }

    // ============================================
    // MÉTODO: Configurar eventos
    // ============================================
    setupEvents() {
        this.input.on('pointerdown', (pointer) => {
            // Click izquierdo para colocar edificio
            if (pointer.button === 0 && this.gridManager.placementMode) {
                const mouseWorld = this.cameraManager.getMouseWorldPosition();
                const gridPos = this.gridManager.selectedPosition;

                if (gridPos && this.buildingToPlace) {
                    this.createBuildingAtGrid(this.buildingToPlace.key, gridPos.row, gridPos.col);
                }
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.gridManager.placementMode) {
                const mouseWorld = this.cameraManager.getMouseWorldPosition();
                this.gridManager.updatePlacementPreview(mouseWorld.x, mouseWorld.y);
            }
        });

        // Tecla ESC para cancelar placement
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gridManager.placementMode) {
                this.gridManager.deactivatePlacementMode();
                this.buildingToPlace = null;
                console.log('❌ Construcción cancelada');
            }
        });
    }

    // ============================================
    // MÉTODO: Crear UI de debug
    // ============================================
    createDebugUI() {
        this.debugText = this.add.text(10, 100, '', {
            fontSize: '11px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 },
            fontFamily: 'monospace'
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(100);
    }

    // ============================================
    // MÉTODO: Actualizar UI de debug
    // ============================================
    updateDebugUI() {
        const cameraInfo = this.cameraManager.debugInfo();
        const gridPos = this.gridManager.selectedPosition;

        let text = `🎮 DEBUG INFO\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `Cámara:\n`;
        text += `  Zoom: ${cameraInfo.zoom}\n`;
        text += `  Pos: [${cameraInfo.worldX}, ${cameraInfo.worldY}]\n\n`;
        text += `Mouse:\n`;
        text += `  Mundo: [${Math.floor(cameraInfo.mouseWorldX)}, ${Math.floor(cameraInfo.mouseWorldY)}]\n`;
        text += `  Grid: ${gridPos ? `[${gridPos.row}, ${gridPos.col}]` : 'Fuera del mapa'}\n\n`;
        text += `Edificios: ${this.buildings.length}\n`;
        text += `Grid: ${this.gridManager.gridWidth}x${this.gridManager.gridHeight}\n\n`;
        text += `Controles:\n`;
        text += `  🖱️ Rueda: Zoom\n`;
        text += `  🖱️ Click Der: Pan\n`;
        text += `  WASD: Mover\n`;
        text += `  +/- : Zoom con teclado\n`;
        text += `  ESC: Cancelar construcción`;

        this.debugText.setText(text);
    }

    // ============================================
    // UPDATE - Loop principal
    // ============================================
    update(time, deltaTime) {
        // Actualizar cámara
        this.cameraManager.update(deltaTime);

        // Actualizar edificios
        this.buildings.forEach(building => {
            building.produce(deltaTime / 1000);
        });

        // Actualizar UI
        this.updateDebugUI();
    }
}

// ============================================
// CÓMO USAR ESTE SISTEMA
// ============================================

/*
1. CREAR GRID:
   - GridManager maneja un array 2D
   - Cada casilla = 64x64 píxeles (configurable)
   - null = vacío, buildingId = ocupado

2. CONTROLES DE CÁMARA:
   - Scroll del mouse: Zoom in (hacia mouse) / Zoom out (centrar)
   - Click derecho + arrastrar: Pan
   - WASD: Mover cámara
   - +/- : Zoom con teclado

3. CONSTRUIR EDIFICIOS:
   - Click en botón de edificio
   - Modo placement se activa
   - Grid muestra preview (verde = válido, rojo = inválido)
   - Click izquierdo para colocar
   - ESC para cancelar

4. VENTAJAS DEL SISTEMA:
   ✅ Collisions automáticas (no hay overlap)
   ✅ Fácil guardar/cargar (es un array 2D)
   ✅ Optimización: solo renderizar lo visible
   ✅ IA para pathfinding sobre grid
   ✅ Múltiples mapas fácil (diferente tamaño grid)
*/
