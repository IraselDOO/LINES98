import { Grid } from './Grid.js';
import { Renderer } from './Renderer.js';
import { Game } from './Game.js';
import { SoundManager } from './SoundManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Initialization ---
    const grid = new Grid(9, 9);
    const renderer = new Renderer(grid, {});
    const soundManager = new SoundManager();

    // Pass soundManager to Game
    const game = new Game(grid, renderer, soundManager);

    // Link renderer handlers back to game logic
    renderer.handlers = {
        onCellClick: (x, y) => game.onCellClick(x, y)
    };

    // Build the grid
    renderer.init();

    // Initialize
    game.start();

    // --- Header Buttons ---

    // Home Button (Icon)
    const btnHome = document.getElementById('btn-home-header');
    if (btnHome) {
        btnHome.addEventListener('click', () => {
            showScreen('start');
            renderer.hideGameOver();
        });
    }

    // Undo Button
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            game.undo();
        });
    }

    // Sound Toggle
    let isSoundOn = true;
    const btnSound = document.getElementById('btn-sound');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');

    if (btnSound && iconSoundOn && iconSoundOff) {
        btnSound.addEventListener('click', () => {
            isSoundOn = !isSoundOn;
            soundManager.setMuted(!isSoundOn);

            // Visual toggle
            if (isSoundOn) {
                iconSoundOn.classList.remove('hidden');
                iconSoundOff.classList.add('hidden');
                btnSound.style.opacity = '1';
            } else {
                iconSoundOn.classList.add('hidden');
                iconSoundOff.classList.remove('hidden');
                btnSound.style.opacity = '0.7';
            }
        });
    }

    // --- Start Screen ---
    const btnStart = document.getElementById('btn-new-game'); // Corrected ID
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            showScreen('game');
            game.start();
            soundManager.playClick();
        });
    }

    // --- Screen Management ---
    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });

        const target = document.getElementById(`${screenName}-screen`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    }

    // --- Service Worker & Updates ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateToast();
                        }
                    });
                });
            });
        });
    }

    function showUpdateToast() {
        const toast = document.createElement('div');
        toast.className = 'update-toast';
        toast.innerHTML = `
            <span>New version available!</span>
            <button id="btn-update-reload">Reload</button>
        `;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('visible'), 100);

        document.getElementById('btn-update-reload').addEventListener('click', () => {
            window.location.reload();
        });
    }
});
