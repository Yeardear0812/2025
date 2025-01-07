class Minesweeper {
    constructor(difficulty = 'easy') {
        this.setDifficulty(difficulty);
        this.init();
    }

    setDifficulty(difficulty) {
        switch(difficulty) {
            case 'medium':
                this.rows = 16;
                this.cols = 16;
                this.mines = 40;
                this.cellSize = 30;
                break;
            default: // easy
                this.rows = 8;
                this.cols = 8;
                this.mines = 10;
                this.cellSize = 35;
        }
        
        const board = document.getElementById('board');
        
        // Встановлюємо розміри сітки
        board.style.gridTemplateColumns = `repeat(${this.cols}, ${this.cellSize}px)`;
        board.style.gridTemplateRows = `repeat(${this.rows}, ${this.cellSize}px)`;
        
        // Оновлюємо розміри клітинок
        const cells = document.getElementsByClassName('cell');
        Array.from(cells).forEach(cell => {
            cell.style.width = `${this.cellSize}px`;
            cell.style.height = `${this.cellSize}px`;
            cell.style.fontSize = `${this.cellSize * 0.45}px`;
        });
    }

    init() {
        this.board = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );

        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }

        this.gameOver = false;
        this.minesLeft = this.mines;
        this.renderBoard();
        this.updateMinesLeft();
        this.startTimer();

        const firstCell = document.querySelector('.cell');
        if (firstCell) firstCell.focus();
    }

    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols &&
                    this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    renderBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.tabIndex = 0;

                cell.addEventListener('click', () => this.handleClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.handleRightClick(row, col);
                });

                if (this.board[row][col].isRevealed) {
                    cell.classList.add('revealed');
                    if (this.board[row][col].isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.board[row][col].neighborMines > 0) {
                        cell.textContent = this.board[row][col].neighborMines;
                        cell.dataset.mines = this.board[row][col].neighborMines;
                    }
                } else if (this.board[row][col].isFlagged) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }

                board.appendChild(cell);
            }
        }
    }

    handleClick(row, col) {
        if (this.gameOver || this.board[row][col].isFlagged) return;

        if (this.board[row][col].isMine) {
            this.gameOver = true;
            this.revealAll();
            alert('Гра закінчена!');
            this.stopTimer();
            return;
        }

        this.reveal(row, col);
        this.renderBoard();

        if (this.checkWin()) {
            this.gameOver = true;
            alert('Ви перемогли!');
            this.stopTimer();
        }
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.board[row][col].isRevealed) return;

        this.board[row][col].isFlagged = !this.board[row][col].isFlagged;
        this.minesLeft += this.board[row][col].isFlagged ? -1 : 1;
        this.updateMinesLeft();
        this.renderBoard();
    }

    reveal(row, col) {
        if (row < 0 || row >= this.rows || 
            col < 0 || col >= this.cols || 
            this.board[row][col].isRevealed || 
            this.board[row][col].isFlagged) {
            return;
        }

        this.board[row][col].isRevealed = true;

        if (this.board[row][col].neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    this.reveal(row + i, col + j);
                }
            }
        }
    }

    revealAll() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col].isRevealed = true;
            }
        }
        this.renderBoard();
    }

    checkWin() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine && !this.board[row][col].isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }

    updateMinesLeft() {
        document.getElementById('mines-left').textContent = this.minesLeft;
    }

    startTimer() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimer();
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = formattedTime;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}

let game = new Minesweeper();

// Event Listeners
document.getElementById('difficulty').addEventListener('change', (e) => {
    game = new Minesweeper(e.target.value);
});

document.getElementById('reset').addEventListener('click', () => {
    game = new Minesweeper(document.getElementById('difficulty').value);
});

const toggleButton = document.getElementById('toggle-instructions');
const instructions = document.querySelector('.instructions');

toggleButton.addEventListener('click', () => {
    instructions.classList.toggle('collapsed');
    toggleButton.style.transform = instructions.classList.contains('collapsed') 
        ? 'rotate(-90deg)' 
        : 'rotate(0deg)';
});

document.addEventListener('keydown', (e) => {
    if (game.gameOver) return;

    const activeCell = document.activeElement;
    const board = document.getElementById('board');
    const cells = board.getElementsByClassName('cell');

    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        document.getElementById('reset').click();
        return;
    }

    let currentRow = 0;
    let currentCol = 0;

    if (activeCell?.classList?.contains('cell')) {
        currentRow = parseInt(activeCell.dataset.row);
        currentCol = parseInt(activeCell.dataset.col);
    }

    switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
            if (activeCell?.classList?.contains('cell')) {
                e.preventDefault();
                if (e.key === 'ArrowUp') currentRow = Math.max(0, currentRow - 1);
                if (e.key === 'ArrowDown') currentRow = Math.min(game.rows - 1, currentRow + 1);
                if (e.key === 'ArrowLeft') currentCol = Math.max(0, currentCol - 1);
                if (e.key === 'ArrowRight') currentCol = Math.min(game.cols - 1, currentCol + 1);
                cells[currentRow * game.cols + currentCol]?.focus();
            }
            break;
        case ' ':
        case 'f':
        case 'F':
            e.preventDefault();
            if (activeCell?.classList?.contains('cell')) {
                if (e.key === ' ') game.handleClick(currentRow, currentCol);
                else game.handleRightClick(currentRow, currentCol);
            } else {
                cells[0]?.focus();
            }
            break;
    }
});

window.addEventListener('resize', () => {
    const container = document.querySelector('.container');
    const containerWidth = container.offsetWidth;
    const difficulty = document.getElementById('difficulty').value;
    
    // Визначаємо базовий розмір клітинки в залежності від складності
    let baseSize;
    switch(difficulty) {
        case 'hard':
            baseSize = 25;
            break;
        case 'medium':
            baseSize = 30;
            break;
        default:
            baseSize = 35;
    }
    
    // Оновлюємо розміри
    game.cellSize = baseSize;
    game.setDifficulty(difficulty);
}); 