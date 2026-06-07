// ============================================
// CLASE BASE: Building (Edificio)
// ============================================

class Building extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, buildingType, config) {
        super(scene, x, y, 'buildings', buildingType);
        
        this.scene = scene;
        this.buildingType = buildingType;
        this.config = config;
        
        // Propiedades físicas
        this.setScale(2);
        this.setDepth(1);
        
        // Propiedades del edificio
        this.level = 1;
        this.health = config.maxHealth;
        this.maxHealth = config.maxHealth;
        this.workerSlots = config.workerSlots;
        this.workers = [];
        
        // Producción
        this.productionRate = config.baseProduction;
        this.storedResources = {};
        
        // UI
        this.healthBar = null;
        this.workerCountText = null;
        
        scene.add.existing(this);
        scene.physics.world.enable(this);
        
        this.createUI();
    }

    // ============================================
    // MÉTODO: Crear UI del edificio
    // ============================================
    createUI() {
        // Barra de salud (pequeña, encima del edificio)
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();

        // Contador de trabajadores
        this.workerCountText = this.scene.add.text(
            this.x - 15,
            this.y - 40,
            `👥${this.workers.length}`,
            { fontSize: '12px', color: '#ffffff' }
        );
        this.workerCountText.setDepth(10);
    }

    // ============================================
    // MÉTODO: Actualizar barra de salud
    // ============================================
    updateHealthBar() {
        this.healthBar.clear();
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 30;
        const barHeight = 4;

        // Fondo rojo
        this.healthBar.fillStyle(0xff0000, 0.8);
        this.healthBar.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth, barHeight);

        // Salud verde
        this.healthBar.fillStyle(0x00ff00, 0.8);
        this.healthBar.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth * healthPercent, barHeight);

        // Borde
        this.healthBar.lineStyle(1, 0xffffff, 1);
        this.healthBar.strokeRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth, barHeight);
    }

    // ============================================
    // MÉTODO: Asignar trabajador (VIRTUAL)
    // ============================================
    assignWorker(worker) {
        if (this.workers.length < this.workerSlots) {
            this.workers.push(worker);
            worker.assignToBuilding(this);
            this.updateWorkerCount();
            return true;
        }
        return false;
    }

    // ============================================
    // MÉTODO: Remover trabajador
    // ============================================
    removeWorker(worker) {
        const index = this.workers.indexOf(worker);
        if (index > -1) {
            this.workers.splice(index, 1);
            this.updateWorkerCount();
        }
    }

    // ============================================
    // MÉTODO: Actualizar contador de trabajadores
    // ============================================
    updateWorkerCount() {
        if (this.workerCountText) {
            this.workerCountText.setText(`👥${this.workers.length}`);
            this.workerCountText.setX(this.x - 8);
            this.workerCountText.setY(this.y - 40);
        }
    }

    // ============================================
    // MÉTODO: Producción (VIRTUAL - sobrescribir en subclases)
    // ============================================
    produce(deltaTime) {
        // Cada edificio produce diferente
        // Las subclases implementan su lógica propia
    }

    // ============================================
    // MÉTODO: Mejorar edificio
    // ============================================
    upgrade() {
        this.level++;
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.productionRate *= 1.2;  // +20% producción
        this.updateHealthBar();
    }

    // ============================================
    // MÉTODO: Recibir daño
    // ============================================
    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.destroy();
            this.healthBar.destroy();
            this.workerCountText.destroy();
        }
    }

    // ============================================
    // MÉTODO: Limpiar
    // ============================================
    destroy() {
        // Liberar todos los workers
        this.workers.forEach(w => w.assignToBuilding(null));
        this.workers = [];
        
        super.destroy();
    }
}

// ============================================
// CLASE: Woodcutter (Leñador) - Hereda de Building
// ============================================

class WoodcutterHut extends Building {
    constructor(scene, x, y) {
        const config = {
            maxHealth: 100,
            workerSlots: 3,
            baseProduction: 1.0  // Madera por segundo
        };

        super(scene, x, y, 'woodcutter', config);
        
        this.buildingType = 'woodcutter';
        this.resourceType = 'wood';
        
        // Árbol cercano (target para trabajadores)
        this.nearestTree = null;
    }

    // ============================================
    // MÉTODO: Producción específica del leñador
    // ============================================
    produce(deltaTime) {
        // Si hay trabajadores, producen madera
        if (this.workers.length > 0) {
            const woodPerSecond = this.productionRate * this.workers.length;
            const woodThisFrame = woodPerSecond * deltaTime;
            
            this.storedResources.wood = (this.storedResources.wood || 0) + woodThisFrame;

            // Emit event con recursos producidos
            if (Math.floor(this.storedResources.wood) > 0) {
                const woodToCollect = Math.floor(this.storedResources.wood);
                this.scene.events.emit('building-produced', {
                    building: this,
                    resourceType: 'wood',
                    amount: woodToCollect
                });
                
                this.storedResources.wood -= woodToCollect;
            }
        }
    }

    // ============================================
    // MÉTODO: Buscar árbol más cercano
    // ============================================
    findNearestTree() {
        const trees = this.scene.trees.getChildren();
        let nearest = null;
        let minDistance = Infinity;

        trees.forEach(tree => {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                tree.x, tree.y
            );

            if (distance < minDistance && tree.health > 0) {
                minDistance = distance;
                nearest = tree;
            }
        });

        return nearest;
    }
}

// ============================================
// CLASE: Mine (Mina) - Hereda de Building
// ============================================

class Mine extends Building {
    constructor(scene, x, y) {
        const config = {
            maxHealth: 120,
            workerSlots: 4,
            baseProduction: 0.8
        };

        super(scene, x, y, 'mine', config);
        
        this.buildingType = 'mine';
        this.resourceType = 'stone';
        this.secondaryResource = 'gold';
    }

    // ============================================
    // MÉTODO: Producción de piedra y oro
    // ============================================
    produce(deltaTime) {
        if (this.workers.length > 0) {
            // Piedra principal
            const stonePerSecond = this.productionRate * this.workers.length;
            const stoneThisFrame = stonePerSecond * deltaTime;
            
            this.storedResources.stone = (this.storedResources.stone || 0) + stoneThisFrame;

            // Oro como subproducto (20% de la piedra)
            const goldThisFrame = stoneThisFrame * 0.2;
            this.storedResources.gold = (this.storedResources.gold || 0) + goldThisFrame;

            // Emit event
            if (Math.floor(this.storedResources.stone) > 0) {
                const stoneToCollect = Math.floor(this.storedResources.stone);
                this.scene.events.emit('building-produced', {
                    building: this,
                    resourceType: 'stone',
                    amount: stoneToCollect
                });
                
                this.storedResources.stone -= stoneToCollect;
            }
        }
    }
}

// ============================================
// CLASE: Farm (Granja) - Hereda de Building
// ============================================

class Farm extends Building {
    constructor(scene, x, y) {
        const config = {
            maxHealth: 80,
            workerSlots: 2,
            baseProduction: 1.2
        };

        super(scene, x, y, 'farm', config);
        
        this.buildingType = 'farm';
        this.resourceType = 'food';
        
        // Ciclo de crecimiento
        this.growthTime = 0;
        this.growthCycle = 5;  // 5 segundos por ciclo
    }

    // ============================================
    // MÉTODO: Producción de comida con ciclo
    // ============================================
    produce(deltaTime) {
        this.growthTime += deltaTime;

        if (this.growthTime >= this.growthCycle) {
            const cycles = Math.floor(this.growthTime / this.growthCycle);
            const foodPerCycle = this.productionRate;
            
            this.storedResources.food = (this.storedResources.food || 0) + (foodPerCycle * cycles);
            this.growthTime -= cycles * this.growthCycle;

            // Emit event
            if (Math.floor(this.storedResources.food) > 0) {
                const foodToCollect = Math.floor(this.storedResources.food);
                this.scene.events.emit('building-produced', {
                    building: this,
                    resourceType: 'food',
                    amount: foodToCollect
                });
                
                this.storedResources.food -= foodToCollect;
            }
        }
    }
}

// ============================================
// CLASE: Market (Mercado) - Hereda de Building
// ============================================

class Market extends Building {
    constructor(scene, x, y) {
        const config = {
            maxHealth: 110,
            workerSlots: 2,
            baseProduction: 0.5
        };

        super(scene, x, y, 'market', config);
        
        this.buildingType = 'market';
        this.resourceType = 'gold';
        
        // El mercado compra recursos y vende oro
        this.exchangeRate = {
            wood: 0.1,   // 10 madera = 1 oro
            stone: 0.15,
            food: 0.2
        };
    }

    // ============================================
    // MÉTODO: Intercambiar recursos por oro
    // ============================================
    trade(resourceType, amount) {
        if (this.exchangeRate[resourceType]) {
            const goldEarned = amount * this.exchangeRate[resourceType];
            this.storedResources.gold = (this.storedResources.gold || 0) + goldEarned;
            return goldEarned;
        }
        return 0;
    }

    // ============================================
    // MÉTODO: Producción pasiva
    // ============================================
    produce(deltaTime) {
        // El mercado genera oro más lentamente que otros edificios
        if (this.workers.length > 0) {
            const goldPerSecond = this.productionRate * this.workers.length;
            const goldThisFrame = goldPerSecond * deltaTime;
            
            this.storedResources.gold = (this.storedResources.gold || 0) + goldThisFrame;

            if (Math.floor(this.storedResources.gold) > 0) {
                const goldToCollect = Math.floor(this.storedResources.gold);
                this.scene.events.emit('building-produced', {
                    building: this,
                    resourceType: 'gold',
                    amount: goldToCollect
                });
                
                this.storedResources.gold -= goldToCollect;
            }
        }
    }
}

// ============================================
// EXPORTAR CLASES
// ============================================

export { Building, WoodcutterHut, Mine, Farm, Market };
