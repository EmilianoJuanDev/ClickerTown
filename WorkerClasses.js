// ============================================
// CLASE BASE: Worker (Trabajador)
// ============================================

class Worker extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, workerType) {
        super(scene, x, y, 'worker', workerType);
        
        this.scene = scene;
        this.workerType = workerType;
        
        // Física
        this.setScale(1.5);
        this.setDepth(5);
        this.scene.physics.world.enable(this);
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        
        // Propiedades del trabajador
        this.assignedBuilding = null;
        this.currentTarget = null;
        this.state = 'idle';  // idle, walking, working, returning
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 100;  // píxeles por segundo
        this.energy = 100;
        this.maxEnergy = 100;
        
        // Trabajo
        this.workTimer = 0;
        this.workDuration = 1.0;
        this.carryLoad = 0;
        this.carryCapacity = 10;
        
        // Mejoras aplicadas
        this.speedBonus = 1.0;
        this.efficiencyBonus = 1.0;
        
        scene.add.existing(this);
        
        // Iniciar estado idle
        this.enterIdleState();
    }

    // ============================================
    // MÉTODO: Asignar a un edificio
    // ============================================
    assignToBuilding(building) {
        this.assignedBuilding = building;
        
        if (building) {
            this.state = 'idle';
            this.enterIdleState();
        } else {
            this.state = 'idle';
            this.setTint(0xff0000);  // Rojo = sin trabajo
        }
    }

    // ============================================
    // MÉTODO: Cambiar a estado Idle
    // ============================================
    enterIdleState() {
        if (!this.assignedBuilding) return;
        
        this.state = 'idle';
        this.workTimer = 0;
        this.setVelocity(0, 0);
        this.stop();
        
        this.play(`worker-${this.workerType}-idle`);
    }

    // ============================================
    // MÉTODO: Cambiar a estado Working
    // ============================================
    enterWorkingState() {
        this.state = 'working';
        this.workTimer = 0;
        this.setVelocity(0, 0);
        
        this.play(`worker-${this.workerType}-work`, true);
    }

    // ============================================
    // MÉTODO: Cambiar a estado Walking
    // ============================================
    enterWalkingState(target) {
        this.state = 'walking';
        this.currentTarget = target;
        
        this.play(`worker-${this.workerType}-walk`, true);
    }

    // ============================================
    // MÉTODO: Cambiar a estado Returning
    // ============================================
    enterReturningState() {
        this.state = 'returning';
        this.currentTarget = this.assignedBuilding;
        
        this.play(`worker-${this.workerType}-walk`, true);
    }

    // ============================================
    // MÉTODO: Mover hacia un objetivo
    // ============================================
    moveTowards(target, speed) {
        if (!target) return false;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 15) {
            return true;  // Llegó al objetivo
        }

        const actualSpeed = speed * this.speedBonus;
        const angle = Math.atan2(dy, dx);

        this.setVelocity(
            Math.cos(angle) * actualSpeed,
            Math.sin(angle) * actualSpeed
        );

        // Girar sprite en dirección del movimiento
        if (dx < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }

        return false;  // Sigue caminando
    }

    // ============================================
    // MÉTODO: Actualizar trabajador (VIRTUAL)
    // ============================================
    update(deltaTime) {
        // Las subclases implementan su lógica específica
        
        // Regenerar energía mientras descansa
        if (this.state === 'idle') {
            this.energy = Math.min(this.maxEnergy, this.energy + 20 * deltaTime);
        }
    }

    // ============================================
    // MÉTODO: Aplicar mejora de velocidad
    // ============================================
    applySpeedUpgrade(multiplier) {
        this.speedBonus *= multiplier;
    }

    // ============================================
    // MÉTODO: Aplicar mejora de eficiencia
    // ============================================
    applyEfficiencyUpgrade(multiplier) {
        this.efficiencyBonus *= multiplier;
    }

    // ============================================
    // MÉTODO: Recibir daño
    // ============================================
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.destroy();
        }
    }

    // ============================================
    // MÉTODO: Descansar (recuperar energía)
    // ============================================
    rest() {
        this.energy = Math.min(this.maxEnergy, this.energy + 50);
    }
}

// ============================================
// CLASE: Woodcutter (Leñador) - Hereda de Worker
// ============================================

class Woodcutter extends Worker {
    constructor(scene, x, y) {
        super(scene, x, y, 'woodcutter');
        
        this.workerType = 'woodcutter';
        this.axeDamage = 10;
        this.workDuration = 1.5;
    }

    // ============================================
    // MÉTODO: Lógica específica del leñador
    // ============================================
    update(deltaTime) {
        super.update(deltaTime);

        if (!this.assignedBuilding) return;

        switch (this.state) {
            case 'idle':
                this.updateIdleState();
                break;

            case 'walking':
                this.updateWalkingState(deltaTime);
                break;

            case 'working':
                this.updateWorkingState(deltaTime);
                break;

            case 'returning':
                this.updateReturningState(deltaTime);
                break;
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Idle
    // ============================================
    updateIdleState() {
        // Buscar árbol más cercano
        const tree = this.assignedBuilding.findNearestTree();

        if (tree && this.energy >= 50) {
            this.currentTarget = tree;
            this.enterWalkingState(tree);
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Walking
    // ============================================
    updateWalkingState(deltaTime) {
        if (!this.currentTarget) {
            this.enterIdleState();
            return;
        }

        const reachedTarget = this.moveTowards(this.currentTarget, this.speed);

        if (reachedTarget) {
            // Llegó al árbol, comenzar a talar
            this.enterWorkingState();
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Working
    // ============================================
    updateWorkingState(deltaTime) {
        if (!this.currentTarget) {
            this.enterIdleState();
            return;
        }

        this.workTimer += deltaTime;
        this.energy -= deltaTime * 10;  // Gastar energía

        // Aplicar eficiencia a la duración del trabajo
        const actualDuration = this.workDuration / this.efficiencyBonus;

        if (this.workTimer >= actualDuration) {
            // Terminar de talar
            this.currentTarget.takeDamage(this.axeDamage);
            this.carryLoad = Math.min(
                this.carryCapacity,
                this.carryLoad + 5 * this.efficiencyBonus
            );

            // Si la carga está llena, retornar
            if (this.carryLoad >= this.carryCapacity || this.energy <= 20) {
                this.enterReturningState();
            } else {
                this.workTimer = 0;  // Seguir talando
            }
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Returning
    // ============================================
    updateReturningState(deltaTime) {
        const reachedHome = this.moveTowards(this.assignedBuilding, this.speed);

        if (reachedHome) {
            // Entregar carga
            this.assignedBuilding.storedResources.wood = 
                (this.assignedBuilding.storedResources.wood || 0) + this.carryLoad;

            this.carryLoad = 0;

            // Si energía baja, descansar
            if (this.energy <= 30) {
                this.rest();
                this.enterIdleState();
            } else {
                this.enterIdleState();
            }
        }
    }
}

// ============================================
// CLASE: Miner (Minero) - Hereda de Worker
// ============================================

class Miner extends Worker {
    constructor(scene, x, y) {
        super(scene, x, y, 'miner');
        
        this.workerType = 'miner';
        this.pickaxeDamage = 15;
        this.workDuration = 2.0;
        this.secondaryResource = 'gold';  // Subproducto
    }

    // ============================================
    // MÉTODO: Lógica específica del minero
    // ============================================
    update(deltaTime) {
        super.update(deltaTime);

        if (!this.assignedBuilding) return;

        switch (this.state) {
            case 'idle':
                this.updateIdleState();
                break;

            case 'walking':
                this.updateWalkingState(deltaTime);
                break;

            case 'working':
                this.updateWorkingState(deltaTime);
                break;

            case 'returning':
                this.updateReturningState(deltaTime);
                break;
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Idle
    // ============================================
    updateIdleState() {
        // El minero busca la mina más cercana con mineral
        const mine = this.scene.buildings.find(b => 
            b instanceof Mine && b !== this.assignedBuilding
        );

        if (mine && this.energy >= 50) {
            this.currentTarget = mine;
            this.enterWalkingState(mine);
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Walking
    // ============================================
    updateWalkingState(deltaTime) {
        if (!this.currentTarget) {
            this.enterIdleState();
            return;
        }

        const reachedTarget = this.moveTowards(this.currentTarget, this.speed);

        if (reachedTarget) {
            this.enterWorkingState();
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Working
    // ============================================
    updateWorkingState(deltaTime) {
        if (!this.currentTarget) {
            this.enterIdleState();
            return;
        }

        this.workTimer += deltaTime;
        this.energy -= deltaTime * 15;  // Gastar más energía (es trabajo duro)

        const actualDuration = this.workDuration / this.efficiencyBonus;

        if (this.workTimer >= actualDuration) {
            // Extraer piedra y algo de oro
            this.carryLoad = Math.min(
                this.carryCapacity,
                this.carryLoad + 3 * this.efficiencyBonus
            );

            if (this.carryLoad >= this.carryCapacity || this.energy <= 20) {
                this.enterReturningState();
            } else {
                this.workTimer = 0;
            }
        }
    }

    // ============================================
    // MÉTODO: Lógica del estado Returning
    // ============================================
    updateReturningState(deltaTime) {
        const reachedHome = this.moveTowards(this.assignedBuilding, this.speed);

        if (reachedHome) {
            // Entregar carga (piedra + oro como subproducto)
            this.assignedBuilding.storedResources.stone = 
                (this.assignedBuilding.storedResources.stone || 0) + (this.carryLoad * 0.8);
            this.assignedBuilding.storedResources.gold = 
                (this.assignedBuilding.storedResources.gold || 0) + (this.carryLoad * 0.2);

            this.carryLoad = 0;

            if (this.energy <= 30) {
                this.rest();
            }

            this.enterIdleState();
        }
    }
}

// ============================================
// CLASE: Farmer (Granjero) - Hereda de Worker
// ============================================

class Farmer extends Worker {
    constructor(scene, x, y) {
        super(scene, x, y, 'farmer');
        
        this.workerType = 'farmer';
        this.workDuration = 2.5;
        this.harvestAmount = 4;
    }

    // ============================================
    // MÉTODO: Lógica específica del granjero
    // ============================================
    update(deltaTime) {
        super.update(deltaTime);

        if (!this.assignedBuilding) return;

        switch (this.state) {
            case 'idle':
                this.workOnFarm(deltaTime);
                break;

            case 'working':
                this.updateWorkingState(deltaTime);
                break;
        }
    }

    // ============================================
    // MÉTODO: Trabajar en la granja
    // ============================================
    workOnFarm(deltaTime) {
        if (this.energy < 50) {
            this.rest();
            this.state = 'idle';
            return;
        }

        // El granjero trabaja en la granja misma
        this.state = 'working';
        this.workTimer = 0;
        this.play(`worker-${this.workerType}-work`, true);
    }

    // ============================================
    // MÉTODO: Lógica del estado Working
    // ============================================
    updateWorkingState(deltaTime) {
        this.workTimer += deltaTime;
        this.energy -= deltaTime * 8;

        const actualDuration = this.workDuration / this.efficiencyBonus;

        if (this.workTimer >= actualDuration) {
            // Cosechar comida
            this.assignedBuilding.storedResources.food = 
                (this.assignedBuilding.storedResources.food || 0) + 
                (this.harvestAmount * this.efficiencyBonus);

            // Volver a idle para cosechar nuevamente
            this.workTimer = 0;
            this.state = 'idle';
        }
    }
}

// ============================================
// EXPORTAR CLASES
// ============================================

export { Worker, Woodcutter, Miner, Farmer };
