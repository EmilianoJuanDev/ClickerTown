// ============================================
// CAMERA MANAGER - Control de cámara avanzado
// ============================================

class CameraManager {
    constructor(scene, worldWidth, worldHeight) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Propiedades de zoom
        this.baseZoom = 1.5;
        this.minZoom = 0.5;
        this.maxZoom = 3;
        this.zoomSpeed = 0.1;
        this.isZooming = false;

        // Propiedades de movimiento
        this.panSpeed = 300;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };

        // Propiedades de mouse
        this.mouseWorldX = 0;
        this.mouseWorldY = 0;

        // Animación suave
        this.targetZoom = this.baseZoom;
        this.targetX = worldWidth / 2;
        this.targetY = worldHeight / 2;
        this.lerpSpeed = 0.15;

        this.setupInputs();
        this.centerCamera();
    }

    // ============================================
    // MÉTODO: Configurar inputs
    // ============================================
    setupInputs() {
        const input = this.scene.input;

        // Rueda del mouse para zoom
        input.on('wheel', (pointer, over, deltaX, deltaY, deltaZ) => {
            this.handleMouseWheel(deltaY);
        });

        // Click y arrastrar para pan
        input.on('pointerdown', (pointer) => {
            if (pointer.button === 2) {
                this.isDragging = true;
                this.dragStart = { x: pointer.x, y: pointer.y };
            }
        });

        input.on('pointermove', (pointer) => {
            this.mouseWorldX = pointer.worldX;
            this.mouseWorldY = pointer.worldY;

            if (this.isDragging) {
                this.handleDrag(pointer);
            }
        });

        input.on('pointerup', () => {
            this.isDragging = false;
        });

        // WASD para movimiento
        this.keys = {
            W: input.keyboard.addKey('W'),
            A: input.keyboard.addKey('A'),
            S: input.keyboard.addKey('S'),
            D: input.keyboard.addKey('D')
        };

        // Teclas para zoom
        this.keys.PLUS = input.keyboard.addKey('PLUS');
        this.keys.MINUS = input.keyboard.addKey('MINUS');
    }

    // ============================================
    // MÉTODO: Manejar scroll del mouse
    // ============================================
    handleMouseWheel(deltaY) {
        const zoomChange = deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed;
        this.targetZoom = Phaser.Math.Clamp(
            this.targetZoom + zoomChange,
            this.minZoom,
            this.maxZoom
        );

        if (zoomChange > 0) {
            this.zoomTowardsMouse();
        } else {
            this.centerCamera();
        }

        this.isZooming = true;
    }

    // ============================================
    // MÉTODO: Zoom hacia la posición del mouse
    // ============================================
    zoomTowardsMouse() {
        this.targetX = this.mouseWorldX;
        this.targetY = this.mouseWorldY;
    }

    // ============================================
    // MÉTODO: Centrar cámara
    // ============================================
    centerCamera() {
        this.targetX = this.worldWidth / 2;
        this.targetY = this.worldHeight / 2;
    }

    // ============================================
    // MÉTODO: Manejar arrastrar con mouse
    // ============================================
    handleDrag(pointer) {
        const deltaX = this.dragStart.x - pointer.x;
        const deltaY = this.dragStart.y - pointer.y;

        this.pan(deltaX, deltaY);

        this.dragStart = { x: pointer.x, y: pointer.y };
    }

    // ============================================
    // MÉTODO: Hacer pan
    // ============================================
    pan(deltaX, deltaY) {
        const scale = 1 / this.camera.zoom;
        this.targetX += deltaX * scale;
        this.targetY += deltaY * scale;

        this.clampCameraPosition();
    }

    // ============================================
    // MÉTODO: Validar posición de cámara
    // ============================================
    clampCameraPosition() {
        const width = this.scene.scale.gameSize.width / this.camera.zoom;
        const height = this.scene.scale.gameSize.height / this.camera.zoom;

        this.targetX = Phaser.Math.Clamp(
            this.targetX,
            width / 2,
            this.worldWidth - width / 2
        );

        this.targetY = Phaser.Math.Clamp(
            this.targetY,
            height / 2,
            this.worldHeight - height / 2
        );
    }

    // ============================================
    // MÉTODO: Actualizar cámara
    // ============================================
    update(deltaTime) {
        this.handleKeyboardInputs();

        this.camera.scrollX = Phaser.Math.Linear(
            this.camera.scrollX,
            this.targetX - this.scene.scale.gameSize.width / 2,
            this.lerpSpeed
        );

        this.camera.scrollY = Phaser.Math.Linear(
            this.camera.scrollY,
            this.targetY - this.scene.scale.gameSize.height / 2,
            this.lerpSpeed
        );

        const currentZoom = this.camera.zoom;
        this.camera.setZoom(
            Phaser.Math.Linear(currentZoom, this.targetZoom, this.lerpSpeed)
        );

        this.clampCameraPosition();
    }

    // ============================================
    // MÉTODO: Manejar inputs de teclado
    // ============================================
    handleKeyboardInputs() {
        const moveDistance = 10;

        if (this.keys.W.isDown) {
            this.targetY -= moveDistance;
        }
        if (this.keys.S.isDown) {
            this.targetY += moveDistance;
        }
        if (this.keys.A.isDown) {
            this.targetX -= moveDistance;
        }
        if (this.keys.D.isDown) {
            this.targetX += moveDistance;
        }

        if (this.keys.PLUS.isDown) {
            this.targetZoom = Phaser.Math.Clamp(
                this.targetZoom + 0.02,
                this.minZoom,
                this.maxZoom
            );
            this.zoomTowardsMouse();
        }
        if (this.keys.MINUS.isDown) {
            this.targetZoom = Phaser.Math.Clamp(
                this.targetZoom - 0.02,
                this.minZoom,
                this.maxZoom
            );
            this.centerCamera();
        }

        this.clampCameraPosition();
    }

    // ============================================
    // MÉTODO: Zoom a posición
    // ============================================
    zoomTo(x, y, zoom, duration = 500) {
        this.targetX = x;
        this.targetY = y;
        this.targetZoom = Phaser.Math.Clamp(zoom, this.minZoom, this.maxZoom);
    }

    // ============================================
    // MÉTODO: Obtener posición de cámara
    // ============================================
    getPosition() {
        return {
            x: this.targetX,
            y: this.targetY,
            zoom: this.camera.zoom
        };
    }

    // ============================================
    // MÉTODO: Obtener posición del mouse en mundo
    // ============================================
    getMouseWorldPosition() {
        return {
            x: this.mouseWorldX,
            y: this.mouseWorldY
        };
    }

    // ============================================
    // MÉTODO: Info de debugging
    // ============================================
    debugInfo() {
        return {
            cameraX: Math.floor(this.camera.scrollX),
            cameraY: Math.floor(this.camera.scrollY),
            zoom: this.camera.zoom.toFixed(2),
            worldX: Math.floor(this.targetX),
            worldY: Math.floor(this.targetY)
        };
    }
}

