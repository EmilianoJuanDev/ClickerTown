// ============================================
// GRID MANAGER - Sistema de tiles/casillas
// ============================================

class GridManager {
    constructor(scene, gridWidth, gridHeight, tileSize = 64) {
        this.scene = scene;
        this.gridWidth = gridWidth;      // Cantidad de columnas
        this.gridHeight = gridHeight;     // Cantidad de filas
        this.tileSize = tileSize;         // Pixels por casilla

        // Grid array 2D: null = vacío, objeto = ocupado
        this.grid = this.initializeGrid();

        // Visualización
        this.gridGraphics = null;
        this.showGridLines = false;
        this.placementMode = false;
        this.selectedPosition = null;
        this.highlightGraphics = null;

        // Dimensiones del mundo
        this.worldWidth = gridWidth * tileSize;
        this.worldHeight = gridHeight * tileSize;
    }

    // ============================================
    // MÉTODO: Inicializar grid vacío
    // ============================================
    initializeGrid() {
        const grid = [];
        for (let row = 0; row < this.gridHeight; row++) {
            grid[row] = [];
            for (let col = 0; col < this.gridWidth; col++) {
                grid[row][col] = null;  // null = vacío
            }
        }
        return grid;
    }

    // ============================================
    // MÉTODO: Convertir pixel a posición grid
    // ============================================
    pixelToGrid(pixelX, pixelY) {
        const col = Math.floor(pixelX / this.tileSize);
        const row = Math.floor(pixelY / this.tileSize);

        // Validar limites
        if (col < 0 || col >= this.gridWidth || 
            row < 0 || row >= this.gridHeight) {
            return null;
        }

        return { row, col };
    }

    // ============================================
    // MÉTODO: Convertir posición grid a pixel
    // ============================================
    gridToPixel(row, col) {
        return {
            x: col * this.tileSize,
            y: row * this.tileSize,
            centerX: (col * this.tileSize) + (this.tileSize / 2),
            centerY: (row * this.tileSize) + (this.tileSize / 2)
        };
    }

    // ============================================
    // MÉTODO: Verificar si un área está disponible
    // ============================================
    isAreaAvailable(startRow, startCol, width, height) {
        // width y height en casillas

        // Validar limites del mapa
        if (startRow < 0 || startCol < 0 ||
            startRow + height > this.gridHeight ||
            startCol + width > this.gridWidth) {
            return false;
        }

        // Verificar si todas las casillas están vacías
        for (let r = startRow; r < startRow + height; r++) {
            for (let c = startCol; c < startCol + width; c++) {
                if (this.grid[r][c] !== null) {
                    return false;
                }
            }
        }

        return true;
    }

    // ============================================
    // MÉTODO: Ocupar área en el grid
    // ============================================
    occupyArea(startRow, startCol, width, height, buildingId) {
        if (!this.isAreaAvailable(startRow, startCol, width, height)) {
            return false;
        }

        for (let r = startRow; r < startRow + height; r++) {
            for (let c = startCol; c < startCol + width; c++) {
                this.grid[r][c] = buildingId;
            }
        }

        return true;
    }

    // ============================================
    // MÉTODO: Liberar área en el grid
    // ============================================
    releaseArea(startRow, startCol, width, height) {
        for (let r = startRow; r < startRow + height; r++) {
            for (let c = startCol; c < startCol + width; c++) {
                if (r >= 0 && r < this.gridHeight && 
                    c >= 0 && c < this.gridWidth) {
                    this.grid[r][c] = null;
                }
            }
        }
    }

    // ============================================
    // MÉTODO: Dibujar grid de líneas
    // ============================================
    drawGridLines() {
        if (this.gridGraphics) {
            this.gridGraphics.destroy();
        }

        this.gridGraphics = this.scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        this.gridGraphics.lineStyle(1, 0x444444, 0.3);

        // Líneas verticales
        for (let col = 0; col <= this.gridWidth; col++) {
            const x = col * this.tileSize;
            this.gridGraphics.lineBetween(x, 0, x, this.worldHeight);
        }

        // Líneas horizontales
        for (let row = 0; row <= this.gridHeight; row++) {
            const y = row * this.tileSize;
            this.gridGraphics.lineBetween(0, y, this.worldWidth, y);
        }

        const texture = this.gridGraphics.generateTexture('grid-texture', this.worldWidth, this.worldHeight);
        this.gridGraphics.destroy();

        // Crear imagen del grid
        const gridImage = this.scene.add.image(0, 0, 'grid-texture');
        gridImage.setOrigin(0, 0);
        gridImage.setDepth(-50);
        gridImage.setScrollFactor(1);
        gridImage.setAlpha(0.3);

        return gridImage;
    }

    // ============================================
    // MÉTODO: Activar modo placement
    // ============================================
    activatePlacementMode(buildingWidth, buildingHeight) {
        this.placementMode = true;
        this.buildingWidth = buildingWidth;
        this.buildingHeight = buildingHeight;
        this.selectedPosition = null;

        // Mostrar grid lines
        this.drawGridLines();

        // Crear graphics para highlight
        this.highlightGraphics = this.scene.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        console.log(`🏗️ Modo placement activado (${buildingWidth}x${buildingHeight})`);
    }

    // ============================================
    // MÉTODO: Desactivar modo placement
    // ============================================
    deactivatePlacementMode() {
        this.placementMode = false;
        this.selectedPosition = null;

        if (this.highlightGraphics) {
            this.highlightGraphics.destroy();
            this.highlightGraphics = null;
        }

        console.log('❌ Modo placement desactivado');
    }

    // ============================================
    // MÉTODO: Actualizar preview de placement
    // ============================================
    updatePlacementPreview(worldX, worldY) {
        if (!this.placementMode || !this.highlightGraphics) return;

        // Convertir posición mundial a grid
        const position = this.pixelToGrid(worldX, worldY);

        if (!position) {
            this.highlightGraphics.clear();
            this.selectedPosition = null;
            return;
        }

        this.selectedPosition = position;

        // Verificar si es válido
        const isValid = this.isAreaAvailable(
            position.row,
            position.col,
            this.buildingWidth,
            this.buildingHeight
        );

        // Dibujar preview
        this.highlightGraphics.clear();

        const pixelPos = this.gridToPixel(position.row, position.col);
        const width = this.buildingWidth * this.tileSize;
        const height = this.buildingHeight * this.tileSize;

        if (isValid) {
            // Verde = válido
            this.highlightGraphics.fillStyle(0x00ff00, 0.3);
            this.highlightGraphics.lineStyle(2, 0x00ff00, 1);
        } else {
            // Rojo = inválido
            this.highlightGraphics.fillStyle(0xff0000, 0.3);
            this.highlightGraphics.lineStyle(2, 0xff0000, 1);
        }

        this.highlightGraphics.fillRect(pixelPos.x, pixelPos.y, width, height);
        this.highlightGraphics.strokeRect(pixelPos.x, pixelPos.y, width, height);

        this.scene.add.existing(this.highlightGraphics);
        this.highlightGraphics.setDepth(10);
        this.highlightGraphics.setScrollFactor(1);
    }

    // ============================================
    // MÉTODO: Colocar edificio
    // ============================================
    placeBuilding(buildingId, row, col) {
        if (this.occupyArea(row, col, this.buildingWidth, this.buildingHeight, buildingId)) {
            this.deactivatePlacementMode();
            return true;
        }
        return false;
    }

    // ============================================
    // MÉTODO: Obtener info del grid (para debugging)
    // ============================================
    debugGrid() {
        console.log('=== GRID STATE ===');
        for (let r = 0; r < this.gridHeight; r++) {
            let row = '';
            for (let c = 0; c < this.gridWidth; c++) {
                row += this.grid[r][c] !== null ? '█' : '·';
            }
            console.log(row);
        }
    }

    // ============================================
    // MÉTODO: Serializar grid (para guardado)
    // ============================================
    serialize() {
        return JSON.stringify(this.grid);
    }

    // ============================================
    // MÉTODO: Deserializar grid (para cargar)
    // ============================================
    deserialize(data) {
        this.grid = JSON.parse(data);
    }
}
