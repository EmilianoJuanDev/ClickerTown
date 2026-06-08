// ================================================
// CONFIGURACIÓN GLOBAL - Datos y Constantes
// ================================================

const GAME_CONFIG = {
    grid: {
        width: 12,
        height: 9,
        tileSize: 64
    },
    
    colors: {
        sky: 0x87ceeb,
        grass: 0x90ee90,
        gridLine: 0x000000,
        valid: 0x00ff00,
        invalid: 0xff0000,
        button: 0x4CAF50,
        buttonHover: 0x66BB6A,
        buttonActive: 0x2E7D32,
        text: '#ffffff',
        bgDark: '#000000',
        bgPanel: 'rgba(0, 0, 0, 0.7)'
    },
    
    buildings: {
        woodcutter: {
            name: '🪵 Leñador',
            emoji: '🪵',
            width: 1,
            height: 1,
            cost: { wood: 0, stone: 0, gold: 100 },
            maxHealth: 100,
            workers: 3,
            production: { wood: 1.0 }
        },
        mine: {
            name: '⛏️ Mina',
            emoji: '⛏️',
            width: 2,
            height: 2,
            cost: { wood: 200, stone: 100, gold: 200 },
            maxHealth: 120,
            workers: 4,
            production: { stone: 0.8, gold: 0.15 }
        },
        farm: {
            name: '🌾 Granja',
            emoji: '🌾',
            width: 2,
            height: 1,
            cost: { wood: 100, stone: 50, gold: 150 },
            maxHealth: 80,
            workers: 2,
            production: { food: 1.2 }
        },
        market: {
            name: '🏪 Mercado',
            emoji: '🏪',
            width: 2,
            height: 2,
            cost: { wood: 300, stone: 200, gold: 300 },
            maxHealth: 110,
            workers: 2,
            production: { gold: 0.5 }
        }
    },
    
    ui: {
        buttonHeight: 40,
        buttonWidth: 140,
        padding: 15,
        fontSize: '14px',
        smallFontSize: '12px'
    }
};