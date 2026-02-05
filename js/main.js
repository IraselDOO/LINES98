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
    let waitingWorker = null;
    let isRefreshing = false;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (isRefreshing) return;
            isRefreshing = true;
            window.location.reload();
        });

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(reg => {
                const checkForUpdates = () => reg.update().catch(() => { });
                checkForUpdates();

                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        checkForUpdates();
                    }
                });

                if (reg.waiting) {
                    waitingWorker = reg.waiting;
                    showUpdateToast();
                }

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            waitingWorker = reg.waiting || newWorker;
                            showUpdateToast();
                        }
                    });
                });
            });
        });
    }

    const btnForceUpdate = document.getElementById('btn-force-update');
    if (btnForceUpdate) {
        btnForceUpdate.addEventListener('click', async () => {
            btnForceUpdate.disabled = true;
            btnForceUpdate.textContent = 'Updating...';

            try {
                if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map(reg => reg.unregister()));
                }

                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }

                const url = new URL(window.location.href);
                url.searchParams.set('update', Date.now().toString());
                window.location.replace(url.toString());
            } catch (err) {
                window.location.reload();
            }
        });
    }

    function showUpdateToast() {
        let toast = document.querySelector('.update-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'update-toast';
            toast.innerHTML = `
                <span>New version available!</span>
                <button id="btn-update-reload">Update now</button>
            `;
            document.body.appendChild(toast);

            const btnApplyUpdate = document.getElementById('btn-update-reload');
            btnApplyUpdate.addEventListener('click', () => {
                if (waitingWorker) {
                    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                } else {
                    window.location.reload();
                }
            });
        }

        setTimeout(() => toast.classList.add('visible'), 100);
    }
});
