export class Grid {
    constructor(rows = 9, cols = 9) {
        this.rows = rows;
        this.cols = cols;
        this.cells = []; // 2D array: null or color string
        this.reset();
    }

    reset() {
        this.cells = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    }

    // Get value at x,y (0-indexed). x=col, y=row
    get(x, y) {
        if (this.isValid(x, y)) {
            return this.cells[y][x];
        }
        return null;
    }

    set(x, y, value) {
        if (this.isValid(x, y)) {
            this.cells[y][x] = value;
            return true;
        }
        return false;
    }

    isValid(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    isEmpty(x, y) {
        return this.isValid(x, y) && this.cells[y][x] === null;
    }

    getEmptyCells() {
        const empty = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.cells[y][x] === null) {
                    empty.push({ x, y });
                }
            }
        }
        return empty;
    }

    isFull() {
        return this.getEmptyCells().length === 0;
    }

    // Pathfinding using BFS
    findPath(startX, startY, endX, endY) {
        if (!this.isEmpty(endX, endY)) return null; // Target must be empty

        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 1, dy: 0 },  // Right
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }  // Left
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === endX && current.y === endY) {
                return current.path;
            }

            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;

                // Check bounds
                if (this.isValid(nx, ny)) {
                    // It's a valid neighbor if it's empty OR it is the target destination
                    // Since we checked isEmpty(endX, endY) at start, checking isEmpty is usually enough.
                    // But wait, the standard rule is: path cannot go through existing balls.
                    if (this.isEmpty(nx, ny) && !visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        queue.push({
                            x: nx,
                            y: ny,
                            path: [...current.path, { x: nx, y: ny }]
                        });
                    }
                }
            }
        }

        return null; // No path found
    }

    // Check for lines at a specific position
    // Returns array of cells to clear (including the placing one)
    checkLines(x, y) {
        const color = this.get(x, y);
        if (!color) return [];

        let linesToClear = new Set();

        // Directions to check: Horizontal, Vertical, Diagonal1 (\), Diagonal2 (/)
        const directions = [
            [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }], // Horizontal
            [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }], // Vertical
            [{ dx: 1, dy: 1 }, { dx: -1, dy: -1 }], // Diagonal \
            [{ dx: 1, dy: -1 }, { dx: -1, dy: 1 }]  // Diagonal /
        ];

        for (const axis of directions) {
            let line = [{ x, y }];

            for (const dir of axis) {
                let cx = x + dir.dx;
                let cy = y + dir.dy;
                while (this.isValid(cx, cy) && this.get(cx, cy) === color) {
                    line.push({ x: cx, y: cy });
                    cx += dir.dx;
                    cy += dir.dy;
                }
            }

            if (line.length >= 5) {
                line.forEach(pt => linesToClear.add(`${pt.x},${pt.y}`));
            }
        }

        // Convert Set back to array of objects
        return Array.from(linesToClear).map(str => {
            const [x, y] = str.split(',').map(Number);
            return { x, y };
        });
    }
}
