import { Utils } from './Utils.js';

export class Game {
    constructor(grid, renderer, soundManager) {
        this.grid = grid;
        this.renderer = renderer;
        this.soundManager = soundManager;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('lines98-highscore')) || 0;
        this.isGameOver = false;
        this.nextColors = [];
        this.selectedCell = null;
        this.isProcessing = false;
        this.nextPositions = [];

        this.previousState = null;
        this.colors = ['red', 'blue', 'green', 'yellow', 'cyan', 'magenta', 'orange'];
    }

    saveState() {
        this.previousState = {
            grid: JSON.parse(JSON.stringify(this.grid.cells)),
            score: this.score,
            nextColors: [...this.nextColors],
            nextPositions: JSON.parse(JSON.stringify(this.nextPositions || []))
        };
        this.renderer.updateUndoButton(true);
    }

    undo() {
        if (!this.previousState || this.isProcessing) return;

        this.grid.cells = JSON.parse(JSON.stringify(this.previousState.grid));
        this.score = this.previousState.score;
        this.nextColors = [...this.previousState.nextColors];
        this.nextPositions = JSON.parse(JSON.stringify(this.previousState.nextPositions || []));

        this.previousState = null;
        this.renderer.updateUndoButton(false);
        this.renderer.renderPreview(this.nextColors);
        this.refreshUI();

        if (this.soundManager) this.soundManager.playClick();
    }

    start() {
        this.grid.reset();
        this.score = 0;
        this.isGameOver = false;

        this.generateNextColors();
        this.spawnRandomBalls(5);

        // Play start sound
        if (this.soundManager) this.soundManager.playSpawn();

        this.generateNextColors();
        this.prepareNextSpawn();

        this.refreshUI();
    }

    generateNextColors() {
        this.nextColors = [];
        for (let i = 0; i < 3; i++) {
            this.nextColors.push(Utils.pickRandom(this.colors));
        }
        this.renderer.renderPreview(this.nextColors);
    }

    prepareNextSpawn() {
        this.nextPositions = [];
        const emptyCells = this.grid.getEmptyCells();
        if (emptyCells.length === 0) return;

        const count = Math.min(this.nextColors.length, emptyCells.length);

        for (let i = 0; i < count; i++) {
            const idx = Utils.randomInt(0, emptyCells.length - 1);
            const pos = emptyCells[idx];
            this.nextPositions.push({
                x: pos.x,
                y: pos.y,
                color: this.nextColors[i]
            });
            emptyCells.splice(idx, 1);
        }
    }

    executeSpawn() {
        if (!this.nextPositions || this.nextPositions.length === 0) {
            this.prepareNextSpawn();
        }

        const currentBatch = [];
        let anyClear = false;

        for (const hint of this.nextPositions) {
            let x = hint.x;
            let y = hint.y;

            if (this.grid.get(x, y)) {
                const empty = this.grid.getEmptyCells();
                if (empty.length > 0) {
                    const idx = Utils.randomInt(0, empty.length - 1);
                    x = empty[idx].x;
                    y = empty[idx].y;
                } else {
                    continue;
                }
            }

            this.grid.set(x, y, hint.color);
            currentBatch.push({ x, y });
        }

        if (this.soundManager && currentBatch.length > 0) {
            this.soundManager.playSpawn();
        }

        currentBatch.forEach(pos => {
            const cleared = this.checkAndClearLines(pos.x, pos.y);
            if (cleared) anyClear = true;
        });

        this.generateNextColors();
        this.prepareNextSpawn();

        if (this.grid.isFull() && !anyClear) {
            this.handleGameOver();
        }
    }

    spawnRandomBalls(count) {
        const emptyCells = this.grid.getEmptyCells();
        const realCount = Math.min(count, emptyCells.length);

        for (let i = 0; i < realCount; i++) {
            const color = Utils.pickRandom(this.colors);
            const idx = Utils.randomInt(0, emptyCells.length - 1);
            const pos = emptyCells[idx];
            this.grid.set(pos.x, pos.y, color);
            emptyCells.splice(idx, 1);
        }
    }

    checkAndClearLines(x, y) {
        const lines = this.grid.checkLines(x, y);
        if (lines.length > 0) {
            const pts = 10 + (lines.length - 5) * 2;
            this.score += pts;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('lines98-highscore', this.highScore);
            }

            lines.forEach(pt => this.grid.set(pt.x, pt.y, null));

            if (this.soundManager) this.soundManager.playClear();

            return true;
        }
        return false;
    }

    async onCellClick(x, y) {
        if (this.isProcessing || this.isGameOver) return;

        const val = this.grid.get(x, y);

        if (val) {
            this.selectedCell = { x, y };
            this.renderer.updateBoard(this.selectedCell);
            return;
        }

        if (!val && this.selectedCell) {
            const path = this.grid.findPath(this.selectedCell.x, this.selectedCell.y, x, y);
            if (path) {
                this.isProcessing = true;
                this.saveState();

                const color = this.grid.get(this.selectedCell.x, this.selectedCell.y);

                if (this.soundManager) this.soundManager.playMove();

                await this.renderer.animateMove(this.selectedCell, path, color);

                this.grid.set(this.selectedCell.x, this.selectedCell.y, null);
                this.grid.set(x, y, color);

                this.selectedCell = null;
                this.renderer.updateBoard();

                const cleared = this.checkAndClearLines(x, y);

                if (cleared) {
                    this.refreshUI();
                } else {
                    await Utils.delay(100);
                    this.executeSpawn();
                    this.refreshUI();
                }

                this.isProcessing = false;
            } else {
                console.log("No path");
            }
        }
    }

    refreshUI() {
        this.renderer.updateBoard(this.selectedCell);
        this.renderer.updateScore(this.score, this.highScore);
        this.renderer.renderHints(this.nextPositions);
    }

    handleGameOver() {
        this.isGameOver = true;
        this.renderer.showGameOver(this.score, this.highScore);
        if (this.soundManager) this.soundManager.playGameOver();
    }
}
