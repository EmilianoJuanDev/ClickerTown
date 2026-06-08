// ============================================
// CONFIGURACIÓN DE PHASER
// ============================================

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    canvas: document.getElementById('mapa-canvas'),
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [VillageScene],
    render: {
        pixelArt: true,
        antialias: false
    }
};

// Crear el juego
const game = new Phaser.Game(config);

// Redimensionar cuando cambie la ventana
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
