class Checkers {
    constructor() {
        this.initGame();
        this.setupRestartButton();
    }

    initGame() {
        this.board = [];
        this.selectedPiece = null;
        this.currentPlayer = 'white';
        this.possibleMoves = [];
        this.whiteScore = 12;
        this.blackScore = 12;
        this.isMultipleCapture = false;
        this.capturedPositions = [];
        this.initializeBoard();
        this.updateScores();
    }

    setupRestartButton() {
        document.getElementById('restart-button').addEventListener('click', () => {
            document.getElementById('winner-modal').classList.add('hidden');
            this.initGame();
        });
    }

    showWinner(message) {
        document.getElementById('winner-text').textContent = message;
        document.getElementById('winner-modal').classList.remove('hidden');
    }

    initializeBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        // Создаем доску 8x8
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Размещаем шашки
                if ((row + col) % 2 !== 0) {
                    if (row < 3) {
                        this.board[row][col] = 'black';
                        const piece = document.createElement('div');
                        piece.className = 'piece black-piece';
                        cell.appendChild(piece);
                    } else if (row > 4) {
                        this.board[row][col] = 'white';
                        const piece = document.createElement('div');
                        piece.className = 'piece white-piece';
                        cell.appendChild(piece);
                    } else {
                        this.board[row][col] = null;
                    }
                } else {
                    this.board[row][col] = null;
                }

                cell.addEventListener('click', (e) => this.handleCellClick(row, col));
                boardElement.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        const piece = this.board[row][col];
        
        if (piece === this.currentPlayer) {
            const hasCaptures = this.hasCaptureMoves();
            
            if (hasCaptures) {
                const moves = [];
                this.checkCapture(row, col, moves);
                if (moves.length === 0) {
                    alert('Ви повинні бити шашку противника!');
                    return;
                }
            }
            
            this.clearHighlights();
            this.selectedPiece = { row, col };
            this.highlightCell(row, col);
            this.possibleMoves = this.calculatePossibleMoves(row, col);
            this.highlightPossibleMoves();
        }
        else if (this.selectedPiece && this.isPossibleMove(row, col)) {
            this.makeMove(row, col);
            if (!this.isMultipleCapture) {
                this.clearHighlights();
                this.selectedPiece = null;
                this.possibleMoves = [];
            }
        }
    }

    calculatePossibleMoves(row, col) {
        const moves = [];
        const piece = this.board[row][col];
        
        // Перевіряємо можливість взяття
        this.checkCapture(row, col, moves, piece);
        
        // Якщо немає взяття, перевіряємо звичайні ходи
        if (moves.length === 0) {
            if (piece === 'blackKing' || piece === 'whiteKing') {
                // Дамка може ходити по всім діагоналям
                this.checkKingMove(row, col, moves);
            } else {
                const direction = this.currentPlayer === 'white' ? -1 : 1;
                this.checkMove(row, col, direction, -1, moves);
                this.checkMove(row, col, direction, 1, moves);
            }
        }
        
        return moves;
    }

    checkMove(row, col, rowDir, colDir, moves) {
        const newRow = row + rowDir;
        const newCol = col + colDir;
        
        if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol]) {
            moves.push({ row: newRow, col: newCol });
        }
    }

    checkCapture(row, col, moves, piece) {
        if (piece === 'blackKing' || piece === 'whiteKing') {
            this.checkKingCapture(row, col, moves);
        } else {
            // Існуюча логіка для звичайних шашок
            const directions = [
                { row: -1, col: -1 }, { row: -1, col: 1 },
                { row: 1, col: -1 }, { row: 1, col: 1 }
            ];

            for (const dir of directions) {
                const jumpRow = row + dir.row * 2;
                const jumpCol = col + dir.col * 2;
                const middleRow = row + dir.row;
                const middleCol = col + dir.col;

                if (this.isValidPosition(jumpRow, jumpCol) && 
                    !this.board[jumpRow][jumpCol] && 
                    this.board[middleRow][middleCol] && 
                    !this.isCurrentPlayerPiece(this.board[middleRow][middleCol])) {
                    
                    const isPositionCaptured = this.capturedPositions.some(pos => 
                        pos.row === middleRow && pos.col === middleCol
                    );

                    if (!isPositionCaptured) {
                        moves.push({ row: jumpRow, col: jumpCol, isCapture: true });
                    }
                }
            }
        }
    }

    checkKingMove(row, col, moves) {
        const directions = [
            { row: -1, col: -1 }, // вліво-вгору
            { row: -1, col: 1 },  // вправо-вгору
            { row: 1, col: -1 },  // вліво-вниз
            { row: 1, col: 1 },   // вправо-вниз
            { row: -1, col: 0 },  // вгору
            { row: 1, col: 0 },   // вниз
            { row: 0, col: -1 },  // вліво
            { row: 0, col: 1 }    // вправо
        ];

        for (const dir of directions) {
            let newRow = row + dir.row;
            let newCol = col + dir.col;
            
            // Дамка може ходити на будь-яку відстань в будь-якому напрямку
            while (this.isValidPosition(newRow, newCol)) {
                if (!this.board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    break;
                }
                newRow += dir.row;
                newCol += dir.col;
            }
        }
    }

    checkKingCapture(row, col, moves) {
        const directions = [
            { row: -1, col: -1 }, // вліво-вгору
            { row: -1, col: 1 },  // вправо-вгору
            { row: 1, col: -1 },  // вліво-вниз
            { row: 1, col: 1 },   // вправо-вниз
            { row: -1, col: 0 },  // вгору
            { row: 1, col: 0 },   // вниз
            { row: 0, col: -1 },  // вліво
            { row: 0, col: 1 }    // вправо
        ];

        for (const dir of directions) {
            let newRow = row + dir.row;
            let newCol = col + dir.col;
            let foundEnemy = false;
            let enemyRow, enemyCol;

            while (this.isValidPosition(newRow, newCol)) {
                if (!foundEnemy && this.board[newRow][newCol] && 
                    !this.isCurrentPlayerPiece(this.board[newRow][newCol])) {
                    foundEnemy = true;
                    enemyRow = newRow;
                    enemyCol = newCol;
                } else if (foundEnemy && !this.board[newRow][newCol]) {
                    const isPositionCaptured = this.capturedPositions.some(pos => 
                        pos.row === enemyRow && pos.col === enemyCol
                    );

                    if (!isPositionCaptured) {
                        moves.push({ 
                            row: newRow, 
                            col: newCol, 
                            isCapture: true,
                            capturedRow: enemyRow,
                            capturedCol: enemyCol
                        });
                    }
                    // Продовжуємо пошук можливих взяттів далі в цьому напрямку
                    newRow += dir.row;
                    newCol += dir.col;
                    continue;
                } else if (this.board[newRow][newCol]) {
                    break;
                }
                newRow += dir.row;
                newCol += dir.col;
            }
        }
    }

    isCurrentPlayerPiece(piece) {
        return piece === this.currentPlayer || 
               (this.currentPlayer === 'white' && piece === 'whiteKing') ||
               (this.currentPlayer === 'black' && piece === 'blackKing');
    }

    makeMove(newRow, newCol) {
        const { row: oldRow, col: oldCol } = this.selectedPiece;
        
        // Перевіряємо, чи є хід взяттям
        if (Math.abs(newRow - oldRow) === 2) {
            const middleRow = (oldRow + newRow) / 2;
            const middleCol = (oldCol + newCol) / 2;
            
            // Зберігаємо позицію биття
            this.capturedPositions.push({
                row: middleRow,
                col: middleCol
            });

            const capturedPiece = document.querySelector(`[data-row="${middleRow}"][data-col="${middleCol}"] .piece`);
            
            // Оновлюємо рахунок при взятті шашки
            if (this.currentPlayer === 'white') {
                this.blackScore--;
            } else {
                this.whiteScore--;
            }
            this.updateScores();

            if (capturedPiece) {
                capturedPiece.classList.add('captured');
                setTimeout(() => {
                    this.board[middleRow][middleCol] = null;
                    this.updateDOM(middleRow, middleCol);
                }, 500);
            }

            // Перевіряємо можливість подальшого биття
            this.board[newRow][newCol] = this.currentPlayer;
            this.board[oldRow][oldCol] = null;
            
            this.updateDOM(oldRow, oldCol);
            this.updateDOM(newRow, newCol);

            const furtherCaptures = [];
            this.checkCapture(newRow, newCol, furtherCaptures);

            // Фільтруємо ходи, щоб виключити повернення на позиції, де вже було биття
            const validCaptures = furtherCaptures.filter(move => {
                const middleOfMove = {
                    row: (newRow + move.row) / 2,
                    col: (newCol + move.col) / 2
                };
                return !this.capturedPositions.some(pos => 
                    pos.row === middleOfMove.row && pos.col === middleOfMove.col
                );
            });

            if (validCaptures.length > 0) {
                this.isMultipleCapture = true;
                this.selectedPiece = { row: newRow, col: newCol };
                this.possibleMoves = validCaptures;
                this.clearHighlights();
                this.highlightCell(newRow, newCol);
                this.highlightPossibleMoves();
                return;
            }
        }

        // Якщо хід завершено, очищаємо масив позицій биття
        this.capturedPositions = [];

        // Якщо немає більше биттів або це звичайний хід
        this.board[newRow][newCol] = this.currentPlayer;
        this.board[oldRow][oldCol] = null;
        
        this.updateDOM(oldRow, oldCol);
        this.updateDOM(newRow, newCol);

        // Перевіряємо на дамку
        if (this.board[newRow][newCol] === 'black' && newRow === 7) {
            this.board[newRow][newCol] = 'blackKing';
            this.updateDOM(newRow, newCol);
        } else if (this.board[newRow][newCol] === 'white' && newRow === 0) {
            this.board[newRow][newCol] = 'whiteKing';
            this.updateDOM(newRow, newCol);
        }

        // Перевіряємо умови перемоги
        if (this.whiteScore === 0) {
            this.showWinner('Чорні перемогли!');
            return;
        } else if (this.blackScore === 0) {
            this.showWinner('Білі перемогли!');
            return;
        }

        // Змінюємо гравця
        this.isMultipleCapture = false;
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

        // Перевіряємо, чи є можливі ходи у наступного гравця
        if (!this.hasAvailableMoves(this.currentPlayer)) {
            const winner = this.currentPlayer === 'white' ? 'Чорні' : 'Білі';
            this.showWinner(`${winner} перемогли! У суперника немає можливих ходів.`);
            return;
        }

        document.getElementById('turn-indicator').textContent = 
            `Хід: ${this.currentPlayer === 'white' ? 'Білих' : 'Чорних'}`;
    }

    updateDOM(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.innerHTML = '';
        
        if (this.board[row][col]) {
            const piece = document.createElement('div');
            const isKing = this.board[row][col].includes('King');
            piece.className = `piece ${this.board[row][col].replace('King', '')}-piece`;
            
            if (isKing) {
                piece.classList.add('king');
            }
            
            cell.appendChild(piece);
        }
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isPossibleMove(row, col) {
        return this.possibleMoves.some(move => move.row === row && move.col === col);
    }

    highlightCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
    }

    highlightPossibleMoves() {
        this.possibleMoves.forEach(move => {
            const cell = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            cell.classList.add('possible-move');
        });
    }

    clearHighlights() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'possible-move');
        });
    }

    // Добавляем новый метод для проверки наличия обязательных взятий на доске
    hasCaptureMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === this.currentPlayer) {
                    const moves = [];
                    this.checkCapture(row, col, moves);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Додаємо метод оновлення рахунку
    updateScores() {
        document.getElementById('white-score').textContent = this.whiteScore;
        document.getElementById('black-score').textContent = this.blackScore;
    }

    // Додаємо метод перевірки наявності можливих ходів
    hasAvailableMoves(player) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === player || 
                    this.board[row][col] === player + 'King') {
                    const moves = this.calculatePossibleMoves(row, col);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

// Запускаємо гру
new Checkers(); 