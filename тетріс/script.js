const canvas = document.getElementById('game');
const nextCanvas = document.getElementById('nextPiece');
const ctx = canvas.getContext('2d');
const nextCtx = nextCanvas.getContext('2d');

const BLOCK_SIZE = 20;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const NEXT_SIZE = 4;

let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let score = 0;
let level = 1;
let currentPiece = null;
let nextPiece = null;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;

const PIECES = [
    {
        shape: [[1, 1, 1, 1]], // I
        color: '#00f0f0',
        glow: '#00ffff'
    },
    {
        shape: [[1, 1], [1, 1]], // O
        color: '#f0f000',
        glow: '#ffff00'
    },
    {
        shape: [[1, 1, 1], [0, 1, 0]], // T
        color: '#a000f0',
        glow: '#bf40ff'
    },
    {
        shape: [[1, 1, 1], [1, 0, 0]], // L
        color: '#f0a000',
        glow: '#ffc000'
    },
    {
        shape: [[1, 1, 1], [0, 0, 1]], // J
        color: '#0000f0',
        glow: '#4040ff'
    },
    {
        shape: [[1, 1, 0], [0, 1, 1]], // S
        color: '#00f000',
        glow: '#40ff40'
    },
    {
        shape: [[0, 1, 1], [1, 1, 0]], // Z
        color: '#f00000',
        glow: '#ff4040'
    }
];

function createPiece() {
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
        shape: JSON.parse(JSON.stringify(piece.shape)),
        color: piece.color,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
        y: 0
    };
}

function drawBlock(ctx, x, y, color, isActive = false) {
    if (isActive) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = color;
        ctx.fillRect(
            x * BLOCK_SIZE + 2, 
            y * BLOCK_SIZE + 2, 
            BLOCK_SIZE - 4, 
            BLOCK_SIZE - 4
        );
        
        const gradient = ctx.createRadialGradient(
            x * BLOCK_SIZE + BLOCK_SIZE/2,
            y * BLOCK_SIZE + BLOCK_SIZE/2,
            0,
            x * BLOCK_SIZE + BLOCK_SIZE/2,
            y * BLOCK_SIZE + BLOCK_SIZE/2,
            BLOCK_SIZE/2
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            x * BLOCK_SIZE + 2, 
            y * BLOCK_SIZE + 2, 
            BLOCK_SIZE - 4, 
            BLOCK_SIZE - 4
        );
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            x * BLOCK_SIZE + 2, 
            y * BLOCK_SIZE + 2, 
            BLOCK_SIZE - 4, 
            BLOCK_SIZE - 4
        );
        
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = '#808080';
        ctx.fillRect(
            x * BLOCK_SIZE + 1, 
            y * BLOCK_SIZE + 1, 
            BLOCK_SIZE - 2, 
            BLOCK_SIZE - 2
        );
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            x * BLOCK_SIZE + 1, 
            y * BLOCK_SIZE + 1, 
            BLOCK_SIZE - 2, 
            BLOCK_SIZE - 2
        );
    }
}

function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Малюємо сітку
    ctx.strokeStyle = '#333';
    for(let i = 0; i <= BOARD_WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for(let i = 0; i <= BOARD_HEIGHT; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }

    // Малюємо зафіксовані блоки
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, board[y][x], false);
            }
        }
    }

    // Малюємо поточну фігуру
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color, true);
                }
            });
        });
    }
}

function drawNextPiece() {
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (nextPiece) {
        const offsetX = (NEXT_SIZE - nextPiece.shape[0].length) / 2;
        const offsetY = (NEXT_SIZE - nextPiece.shape.length) / 2;

        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(nextCtx, x + offsetX, y + offsetY, nextPiece.color);
                }
            });
        });
    }
}

function collides(piece, board) {
    return piece.shape.some((row, dy) => {
        return row.some((value, dx) => {
            let newX = piece.x + dx;
            let newY = piece.y + dy;
            return (
                value &&
                (newX < 0 ||
                newX >= BOARD_WIDTH ||
                newY >= BOARD_HEIGHT ||
                (newY >= 0 && board[newY][newX]))
            );
        });
    });
}

function merge(piece, board) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[piece.y + y][piece.x + x] = piece.color;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(value => value)) {
            // Додаємо анімацію розпадання лінії
            const lineElements = document.createElement('div');
            lineElements.className = 'breaking-line';
            lineElements.style.position = 'absolute';
            lineElements.style.left = '0';
            lineElements.style.top = y * BLOCK_SIZE + 'px';
            lineElements.style.width = canvas.width + 'px';
            lineElements.style.height = BLOCK_SIZE + 'px';
            lineElements.style.background = 'white';
            canvas.parentElement.appendChild(lineElements);
            
            setTimeout(() => lineElements.remove(), 500);
            
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
            
            // Створюємо конфетті при очищенні лінії
            createConfetti();
        }
    }
    
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        document.getElementById('score').textContent = score;
        
        if (score >= level * 1000) {
            level++;
            document.getElementById('level').textContent = level;
            // Додаємо новорічний ефект при підвищенні рівня
            const newYearEffect = document.createElement('div');
            newYearEffect.className = 'new-year';
            document.body.appendChild(newYearEffect);
            setTimeout(() => newYearEffect.remove(), 1000);
            
            clearInterval(gameLoop);
            gameLoop = setInterval(update, 1000 - (level * 50));
        }
    }
}

function moveLeft() {
    if (isPaused || isGameOver) return;
    currentPiece.x--;
    if (collides(currentPiece, board)) {
        currentPiece.x++;
    }
    drawBoard();
}

function moveRight() {
    if (isPaused || isGameOver) return;
    currentPiece.x++;
    if (collides(currentPiece, board)) {
        currentPiece.x--;
    }
    drawBoard();
}

function moveDown() {
    if (isPaused || isGameOver) return;
    currentPiece.y++;
    if (collides(currentPiece, board)) {
        currentPiece.y--;
        merge(currentPiece, board);
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        if (collides(currentPiece, board)) {
            gameOver();
        }
    }
    drawBoard();
}

function hardDrop() {
    if (isPaused || isGameOver) return;
    while (!collides(currentPiece, board)) {
        currentPiece.y++;
    }
    currentPiece.y--;
    moveDown();
}

function rotate() {
    if (isPaused || isGameOver) return;
    const oldShape = currentPiece.shape;
    currentPiece.shape = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    if (collides(currentPiece, board)) {
        currentPiece.shape = oldShape;
    }
    drawBoard();
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ПАУЗА', canvas.width / 2, canvas.height / 2);
    } else {
        gameLoop = setInterval(update, 1000 - (level * 50));
        drawBoard();
    }
}

function toggleGame() {
    if (isGameOver || !gameLoop) {
        // Почати нову гру
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        score = 0;
        level = 1;
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        isGameOver = false;
        isPaused = false;
        currentPiece = createPiece();
        nextPiece = createPiece();
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(update, 1000 - (level * 50));
        drawBoard();
        drawNextPiece();
    }
}

function update() {
    moveDown();
}

// Керування клавіатурою
document.addEventListener('keydown', event => {
    switch (event.keyCode) {
        case 37: // Left
            moveLeft();
            break;
        case 39: // Right
            moveRight();
            break;
        case 40: // Down
            moveDown();
            break;
        case 38: // Up
            rotate();
            break;
        case 32: // Space
            hardDrop();
            break;
        case 80: // P
            togglePause();
            break;
    }
});

// Ініціалізація гри
drawBoard();
drawNextPiece();

function createConfetti() {
    const colors = [
        ['#ff0000', '#cc0000'], // червоний
        ['#00ff00', '#00cc00'], // зелений
        ['#ffffff', '#cccccc'], // білий
        ['#ff0000', '#990000'], // темно-червоний
        ['#00ff00', '#009900']  // темно-зелений
    ];
    
    for(let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        const colorPair = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.setProperty('--color1', colorPair[0]);
        confetti.style.setProperty('--color2', colorPair[1]);
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

function createSnowflakes() {
    const snowflakes = ['❄', '❅', '❆', '✻', '✼', '❉'];
    const container = document.body;
    
    setInterval(() => {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.innerHTML = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        container.appendChild(snowflake);
        
        setTimeout(() => snowflake.remove(), 5000);
    }, 200);
}

function createGarland() {
    const garland = document.createElement('div');
    garland.className = 'garland';
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    
    for(let i = 0; i < 10; i++) {
        const light = document.createElement('div');
        light.className = 'garland-light';
        light.style.backgroundColor = colors[i % colors.length];
        light.style.animationDelay = (i * 0.1) + 's';
        garland.appendChild(light);
    }
    
    document.querySelector('.game-container').appendChild(garland);
}

// Додаємо виклик функцій при завантаженні
window.addEventListener('load', () => {
    createSnowflakes();
    createGarland();
}); 