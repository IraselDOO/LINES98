import { Utils } from './Utils.js';

export class Renderer {
    constructor(grid, handlers) {
        this.grid = grid;
        this.handlers = handlers; // onCellClick, etc.

        // Debug: Check all elements
        // Unified Start/Game Over screen elements
        const elements = {
            'grid': document.getElementById('grid'),
            'preview-balls': document.getElementById('preview-balls'),
            'score': document.getElementById('score'),
            'start-high-score': document.getElementById('start-high-score'),
            'high-score-game': document.getElementById('high-score-game'),
            // Game Over elements inside Start Screen
            'game-over-message': document.getElementById('game-over-message'),
            'final-score': document.getElementById('final-score'),
            // 'best-score' might not be separately needed if we use start-high-score, 
            // but let's keep it if the html has it (I removed it in HTML? No, I kept final-score in game-over-message div)
            // Wait, my HTML update for index.html had:
            // <div id="game-over-message" class="hidden"> ... Score: <span id="final-score">0</span> ... </div>
            // I did NOT put best-score there, as it's already on the start screen ("High Score: ...")
            // So we can remove best-score ref
        };

        this.container = elements['grid'];
        this.nextBallsContainer = elements['preview-balls'];
        this.scoreEl = elements['score'];
        this.highScoreEl = elements['start-high-score'];
        this.highScoreGameEl = elements['high-score-game'];

        // Game Over specific
        this.gameOverMsg = elements['game-over-message'];
        this.finalScoreEl = elements['final-score'];
    }

    init() {
        this.renderGrid();
    }

    renderGrid() {
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${this.grid.cols}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${this.grid.rows}, 1fr)`;

        for (let y = 0; y < this.grid.rows; y++) {
            for (let x = 0; x < this.grid.cols; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                // Add click listener
                cell.addEventListener('click', () => this.handlers.onCellClick(x, y));

                // Create ball element (empty initially)
                const ball = document.createElement('div');
                ball.className = 'ball';
                cell.appendChild(ball);

                this.container.appendChild(cell);
            }
        }
    }

    updateBoard(selectedCell = null) {
        const cells = this.container.children;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const val = this.grid.get(x, y);
            const ball = cell.querySelector('.ball');

            // Reset classes
            ball.className = 'ball';
            cell.classList.remove('selected', 'highlight');

            if (val) {
                ball.classList.add(val); // e.g., 'red', 'blue'
                ball.classList.add('visible');
            } else {
                ball.classList.remove('visible');
            }

            if (selectedCell && selectedCell.x === x && selectedCell.y === y) {
                cell.classList.add('selected');
                ball.classList.add('bounce');
            }
        }
    }

    renderPreview(colors) {
        this.nextBallsContainer.innerHTML = '';
        colors.forEach(color => {
            const ball = document.createElement('div');
            ball.className = `preview-ball ${color}`;
            this.nextBallsContainer.appendChild(ball);
        });
    }

    renderHints(nextPositions) {
        // First remove old hints
        const oldHints = this.container.querySelectorAll('.spawn-hint');
        oldHints.forEach(el => el.remove());

        if (!nextPositions) return;

        nextPositions.forEach(pos => {
            const cell = this.getCell(pos.x, pos.y);
            // Only if cell is empty (should be, logic-wise)
            if (cell && !cell.querySelector('.ball.visible')) {
                const hint = document.createElement('div');
                hint.className = `spawn-hint`;
                // Map color name to CSS variable
                hint.style.backgroundColor = `var(--ball-${pos.color})`;
                cell.appendChild(hint);
            }
        });
    }


    updateScore(score, highScore) {
        this.scoreEl.innerText = score;
        this.highScoreEl.innerText = highScore;
        if (this.highScoreGameEl) {
            this.highScoreGameEl.innerText = highScore;
        }
    }

    showGameOver(score, highScore) {
        // Switch to Start Screen
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('active');

        const startScreen = document.getElementById('start-screen');
        startScreen.classList.remove('hidden');
        startScreen.classList.add('active');

        // Show Game Over details
        if (this.gameOverMsg) {
            this.gameOverMsg.classList.remove('hidden');
            // Add some animation class?
            this.gameOverMsg.classList.add('fade-in');
        }

        if (this.finalScoreEl) this.finalScoreEl.innerText = score;
        // High score is already updated on start screen via updateScore or separate logic, 
        // but let's ensure it's set
        if (this.highScoreEl) this.highScoreEl.innerText = highScore;
    }

    hideGameOver() {
        // Reset Start Screen to normal state (Prepare for new game)
        if (this.gameOverMsg) {
            this.gameOverMsg.classList.add('hidden');
            this.gameOverMsg.classList.remove('fade-in');
        }
    }

    updateUndoButton(enabled) {
        document.getElementById('btn-undo').disabled = !enabled;
    }

    // Animate ball movement along a path
    // Animate ball movement along a path
    async animateMove(start, path, color) {
        if (!start || !path || path.length === 0) return;

        // Visual helper to get coords
        const getRect = (x, y) => {
            const cell = this.getCell(x, y);
            const rect = cell.getBoundingClientRect();
            // Adjust for ball size (80% of cell) inside
            return {
                top: rect.top + rect.height * 0.1,
                left: rect.left + rect.width * 0.1,
                width: rect.width * 0.8,
                height: rect.height * 0.8
            };
        };

        const startRect = getRect(start.x, start.y);

        // Create flying ball
        const flyingBall = document.createElement('div');
        flyingBall.className = `ball ${color} visible flying`;
        flyingBall.style.width = `${startRect.width}px`;
        flyingBall.style.height = `${startRect.height}px`;
        flyingBall.style.top = `${startRect.top}px`;
        flyingBall.style.left = `${startRect.left}px`;
        flyingBall.style.position = 'fixed';
        flyingBall.style.zIndex = '100';
        flyingBall.style.transition = 'top 0.1s linear, left 0.1s linear';

        document.body.appendChild(flyingBall);

        // Iterate path
        // We assume path is sequence of cells to visit.
        return new Promise(async (resolve) => {
            for (const step of path) {
                await Utils.delay(50); // Speed of movement
                const rect = getRect(step.x, step.y);
                flyingBall.style.top = `${rect.top}px`;
                flyingBall.style.left = `${rect.left}px`;
            }

            await Utils.delay(50); // Wait for last frame
            flyingBall.remove();
            resolve();
        });
    }


    getCell(x, y) {
        return this.container.children[y * this.grid.cols + x];
    }
}
