// ================================================
// JUEGO PRINCIPAL - Toda la lógica en Phaser
// ================================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    // ================================================
    // CREATE - Inicializar todo
    // ================================================
    create() {
        // Recursos del jugador
        this.resources = {
            wood: 500,
            stone: 300,
            gold: 200,
            food: 100,
            villagers: 5,
            maxVillagers: 10
        };

        // Sistemas
        this.grid = new Array(GAME_CONFIG.grid.height)
            .fill(null)
            .map(() => new Array(GAME_CONFIG.grid.width).fill(null));
        
        this.buildings = [];
        this.buildingToPlace = null;
        this.placementMode = false;
        this.selectedGrid = null;
        
        // Crear fondo
        this.createBackground();
        
        // Crear UI
        this.createTopBar();
        this.createBuildingPanel();
        this.createDebugInfo();
        
        // Eventos
        this.setupEvents();
        
        // Grid visual
        this.drawGrid();
        
        console.log('🏘️ Idle Town iniciado - Lista para construir!');
    }

    // ================================================
    // FONDO - Cielo y pasto
    // ================================================
    createBackground() {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        const worldWidth = GAME_CONFIG.grid.width * GAME_CONFIG.grid.tileSize;
        const worldHeight = GAME_CONFIG.grid.height * GAME_CONFIG.grid.tileSize;
        
        // Cielo
        gfx.fillStyle(GAME_CONFIG.colors.sky, 1);
        gfx.fillRect(0, 0, worldWidth, worldHeight * 0.4);
        
        // Pasto
        gfx.fillStyle(GAME_CONFIG.colors.grass, 1);
        gfx.fillRect(0, worldHeight * 0.4, worldWidth, worldHeight * 0.6);
        
        gfx.generateTexture('background', worldWidth, worldHeight);
        gfx.destroy();
        
        const bg = this.add.image(0, 0, 'background');
        bg.setOrigin(0, 0);
        bg.setDepth(-100);
        bg.setScrollFactor(1);
    }

    // ================================================
    // UI - Barra superior
    // ================================================
    createTopBar() {
        const y = 15;
        let x = 20;
        const spacing = 200;
        
        const resources = [
            { key: 'wood', emoji: '🪵' },
            { key: 'stone', emoji: '⛏️' },
            { key: 'gold', emoji: '💰' },
            { key: 'food', emoji: '🍎' },
            { key: 'villagers', emoji: '👥' }
        ];
        
        resources.forEach((res, i) => {
            const display = this.add.text(x + (i * spacing), y, '', {
                fontSize: GAME_CONFIG.ui.fontSize,
                color: GAME_CONFIG.colors.text,
                fontStyle: 'bold'
            });
            display.setScrollFactor(0);
            display.setDepth(1000);
            display.name = `display_${res.key}`;
            
            this.add.existing(display);
        });
        
        this.updateResourceDisplay();
    }

    // ================================================
    // UI - Panel de construcción
    // ================================================
    createBuildingPanel() {
        const startX = 20;
        const startY = 70;
        const spacing = 150;
        
        const buildings = Object.entries(GAME_CONFIG.buildings).map(([key, config]) => ({
            key,
            ...config
        }));
        
        buildings.forEach((building, i) => {
            // Botón
            const btn = this.add.rectangle(
                startX + (i * spacing),
                startY,
                GAME_CONFIG.ui.buttonWidth,
                GAME_CONFIG.ui.buttonHeight,
                GAME_CONFIG.colors.button
            );
            btn.setScrollFactor(0);
            btn.setDepth(1000);
            btn.setInteractive();
            btn.building = building;
            
            // Texto
            const txt = this.add.text(
                startX + (i * spacing),
                startY,
                building.name,
                {
                    fontSize: GAME_CONFIG.ui.smallFontSize,
                    color: GAME_CONFIG.colors.text
                }
            );
            txt.setOrigin(0.5);
            txt.setScrollFactor(0);
            txt.setDepth(1001);
            
            // Eventos
            btn.on('pointerdown', () => this.selectBuilding(building));
            btn.on('pointerover', () => btn.setFillStyle(GAME_CONFIG.colors.buttonHover));
            btn.on('pointerout', () => btn.setFillStyle(GAME_CONFIG.colors.button));
        });
    }

    // ================================================
    // UI - Info de debug
    // ================================================
    createDebugInfo() {
        this.debugText = this.add.text(15, 150, '', {
            fontSize: GAME_CONFIG.ui.smallFontSize,
            color: GAME_CONFIG.colors.text,
            backgroundColor: GAME_CONFIG.colors.bgDark,
            padding: { x: 8, y: 8 },
            fontFamily: 'monospace'
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(1000);
    }

    // ================================================
    // GRID - Dibujar líneas
    // ================================================
    drawGrid() {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        const tileSize = GAME_CONFIG.grid.tileSize;
        const width = GAME_CONFIG.grid.width * tileSize;
        const height = GAME_CONFIG.grid.height * tileSize;
        
        gfx.lineStyle(1, GAME_CONFIG.colors.gridLine, 0.2);
        
        // Líneas verticales
        for (let i = 0; i <= GAME_CONFIG.grid.width; i++) {
            gfx.lineBetween(i * tileSize, 0, i * tileSize, height);
        }
        
        // Líneas horizontales
        for (let i = 0; i <= GAME_CONFIG.grid.height; i++) {
            gfx.lineBetween(0, i * tileSize, width, i * tileSize);
        }
        
        gfx.generateTexture('grid', width, height);
        gfx.destroy();
        
        const gridImage = this.add.image(0, 0, 'grid');
        gridImage.setOrigin(0, 0);
        gridImage.setDepth(-50);
        gridImage.setScrollFactor(1);
    }

    // ================================================
    // CONSTRUCCIÓN - Seleccionar edificio
    // ================================================
    selectBuilding(building) {
        if (this.placementMode) {
            console.log('❌ Ya estás colocando un edificio');
            return;
        }
        
        // Verificar recursos
        const canAfford = Object.entries(building.cost).every(
            ([res, cost]) => this.resources[res] >= cost
        );
        
        if (!canAfford) {
            console.log('❌ Recursos insuficientes');
            return;
        }
        
        this.buildingToPlace = building;
        this.placementMode = true;
        console.log(`✨ Modo construcción: ${building.name}`);
    }

    // ================================================
    // CONSTRUCCIÓN - Colocar edificio
    // ================================================
    placeBuilding(row, col) {
        if (!this.buildingToPlace) return false;
        
        const { width, height } = this.buildingToPlace;
        
        // Validar espacio
        if (!this.isAreaAvailable(row, col, width, height)) {
            console.log('❌ Espacio no disponible');
            return false;
        }
        
        // Restar costo
        Object.entries(this.buildingToPlace.cost).forEach(([res, cost]) => {
            this.resources[res] -= cost;
        });
        
        // Crear edificio
        const pixelPos = this.gridToPixel(row, col);
        const building = this.createBuildingObject(
            this.buildingToPlace.key,
            pixelPos.centerX,
            pixelPos.centerY
        );
        
        // Ocupar espacio
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                this.grid[r][c] = building.id;
            }
        }
        
        building.gridRow = row;
        building.gridCol = col;
        building.gridWidth = width;
        building.gridHeight = height;
        
        this.buildings.push(building);
        
        // Salir del modo construcción
        this.placementMode = false;
        this.buildingToPlace = null;
        
        this.updateResourceDisplay();
        console.log(`✅ ${this.buildingToPlace.name} colocado`);
        
        return true;
    }

    // ================================================
    // EDIFICIOS - Crear objeto
    // ================================================
    createBuildingObject(buildingKey, x, y) {
        const config = GAME_CONFIG.buildings[buildingKey];
        
        const building = {
            id: `${buildingKey}_${Date.now()}`,
            key: buildingKey,
            x: x,
            y: y,
            ...config
        };
        
        // Dibujar edificio
        const rect = this.add.rectangle(x, y, 50, 50, 0xFF6B6B);
        rect.setDepth(50);
        
        const text = this.add.text(x, y, config.emoji, {
            fontSize: '32px',
            align: 'center'
        });
        text.setOrigin(0.5);
        text.setDepth(51);
        
        building.rect = rect;
        building.text = text;
        
        return building;
    }

    // ================================================
    // GRID - Verificar disponibilidad
    // ================================================
    isAreaAvailable(startRow, startCol, width, height) {
        if (startRow < 0 || startCol < 0 ||
            startRow + height > GAME_CONFIG.grid.height ||
            startCol + width > GAME_CONFIG.grid.width) {
            return false;
        }
        
        for (let r = startRow; r < startRow + height; r++) {
            for (let c = startCol; c < startCol + width; c++) {
                if (this.grid[r][c] !== null) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // ================================================
    // GRID - Convertir pixel a grid
    // ================================================
    pixelToGrid(x, y) {
        const tileSize = GAME_CONFIG.grid.tileSize;
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);
        
        if (col < 0 || col >= GAME_CONFIG.grid.width ||
            row < 0 || row >= GAME_CONFIG.grid.height) {
            return null;
        }
        
        return { row, col };
    }

    // ================================================
    // GRID - Convertir grid a pixel
    // ================================================
    gridToPixel(row, col) {
        const tileSize = GAME_CONFIG.grid.tileSize;
        return {
            x: col * tileSize,
            y: row * tileSize,
            centerX: (col * tileSize) + (tileSize / 2),
            centerY: (row * tileSize) + (tileSize / 2)
        };
    }

    // ================================================
    // UI - Actualizar recursos
    // ================================================
    updateResourceDisplay() {
        const displays = [
            { key: 'wood', emoji: '🪵' },
            { key: 'stone', emoji: '⛏️' },
            { key: 'gold', emoji: '💰' },
            { key: 'food', emoji: '🍎' },
            { key: 'villagers', emoji: '👥' }
        ];
        
        displays.forEach((display, i) => {
            const element = this.children.list.find(
                child => child.name === `display_${display.key}`
            );
            if (element) {
                const value = this.resources[display.key];
                const max = this.resources[`max${display.key.charAt(0).toUpperCase() + display.key.slice(1)}`];
                const text = max 
                    ? `${display.emoji}: ${value}/${max}` 
                    : `${display.emoji}: ${value}`;
                element.setText(text);
            }
        });
    }

    // ================================================
    // UI - Actualizar debug
    // ================================================
    updateDebugInfo() {
        const camera = this.cameras.main;
        
        let text = `🎮 DEBUG\n`;
        text += `Zoom: ${camera.zoom.toFixed(2)}\n`;
        text += `Edificios: ${this.buildings.length}\n`;
        text += `ESC: Cancelar\n`;
        text += `Click Der: Pan`;
        
        this.debugText.setText(text);
    }

    // ================================================
    // EVENTOS
    // ================================================
    setupEvents() {
        this.input.on('pointerdown', (pointer) => {
            if (!this.placementMode) return;
            
            const worldPos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const gridPos = this.pixelToGrid(worldPos.x, worldPos.y);
            
            if (gridPos) {
                this.placeBuilding(gridPos.row, gridPos.col);
            }
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.placementMode) {
                this.placementMode = false;
                this.buildingToPlace = null;
                console.log('❌ Construcción cancelada');
            }
        });
        
        // Zoom con rueda
        this.input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
            const camera = this.cameras.main;
            const zoomChange = deltaY > 0 ? 0.1 : -0.1;
            camera.zoom = Phaser.Math.Clamp(camera.zoom + zoomChange, 0.5, 3);
        });
    }

    // ================================================
    // UPDATE - Loop principal
    // ================================================
    update() {
        // Generar recursos pasivos
        this.buildings.forEach(building => {
            Object.entries(building.production || {}).forEach(([resource, rate]) => {
                this.resources[resource] += rate * 0.016; // 16ms por frame
            });
        });
        
        this.updateResourceDisplay();
        this.updateDebugInfo();
    }
}

// ================================================
// CONFIGURACIÓN DE PHASER
// ================================================
const phaserConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game',
    backgroundColor: '#2a2a2a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene],
    render: {
        pixelArt: true,
        antialias: false,
        willReadFrequently: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Crear el juego
const game = new Phaser.Game(phaserConfig);