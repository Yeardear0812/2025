const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreText = document.getElementById('scoreText');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Налаштування гри
canvas.width = 300;
canvas.height = 300;
const gridSize = 15;
const tileCount = canvas.width / gridSize;
let speed = 7;

// Змійка
let snake = [
    { x: 10, y: 10 }
];
let dx = 0;
let dy = 0;

// Їжа
let food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
};

// Рахунок і стан гри
let score = 0;
let gameRunning = false;
let isPaused = false;

function drawGame() {
    if (!gameRunning || isPaused) return;

    moveSnake();
    
    if (checkGameOver()) {
        gameRunning = false;
        alert(`Гра закінчена! Ваш рахунок: ${score}`);
        return;
    }

    clearCanvas();
    checkFoodCollision();
    drawFood();
    drawSnake();

    setTimeout(drawGame, 1000 / speed);
}

function moveSnake() {
    let head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Прохід крізь стіни
    if (head.x < 0) {
        head.x = tileCount - 1;
    } else if (head.x >= tileCount) {
        head.x = 0;
    }
    
    if (head.y < 0) {
        head.y = tileCount - 1;
    } else if (head.y >= tileCount) {
        head.y = 0;
    }
    
    snake.unshift(head);
    if (!checkFoodCollision()) {
        snake.pop();
    }
}

function clearCanvas() {
    ctx.fillStyle = '#A7AF7C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
            segment.x * gridSize + gridSize/2,
            segment.y * gridSize + gridSize/2,
            0,
            segment.x * gridSize + gridSize/2,
            segment.y * gridSize + gridSize/2,
            gridSize/2
        );
        
        if (index === 0) {
            // Голова змійки
            gradient.addColorStop(0, '#4a5d23');
            gradient.addColorStop(1, '#2D3514');
        } else {
            // Тіло змійки
            gradient.addColorStop(0, '#3a4d13');
            gradient.addColorStop(1, '#2D3514');
        }
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.roundRect(
            segment.x * gridSize, 
            segment.y * gridSize, 
            gridSize - 2, 
            gridSize - 2,
            4
        );
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function drawFood() {
    ctx.fillStyle = '#AA3939';
    ctx.shadowColor = 'rgba(170, 57, 57, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
}

function isPointInSnake(x, y) {
    return snake.some(segment => segment.x === x && segment.y === y);
}

function generateNewFood() {
    let newX, newY;
    do {
        newX = Math.floor(Math.random() * tileCount);
        newY = Math.floor(Math.random() * tileCount);
    } while (isPointInSnake(newX, newY));

    food.x = newX;
    food.y = newY;
}

function checkFoodCollision() {
    if (snake[0].x === food.x && snake[0].y === food.y) {
        generateNewFood();
        score += 10;
        scoreText.textContent = score;
        speed += 0.5;
        
        // Анімація рахунку
        scoreText.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreText.style.transform = 'scale(1)';
        }, 200);
        
        return true;
    }
    return false;
}

function checkGameOver() {
    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
            gameOver();
            return true;
        }
    }
    return false;
}

function gameOver() {
    gameRunning = false;
    document.querySelector('.game-container').classList.add('game-over');
    setTimeout(() => {
        document.querySelector('.game-container').classList.remove('game-over');
        alert(`Гра закінчена! Ваш рахунок: ${score}`);
    }, 500);
}

// Керування з клавіатури
document.addEventListener('keydown', (event) => {
    if (!isPaused) {
        switch (event.key) {
            case 'ArrowUp':
                if (dy !== 1) { dx = 0; dy = -1; }
                break;
            case 'ArrowDown':
                if (dy !== -1) { dx = 0; dy = 1; }
                break;
            case 'ArrowLeft':
                if (dx !== 1) { dx = -1; dy = 0; }
                break;
            case 'ArrowRight':
                if (dx !== -1) { dx = 1; dy = 0; }
                break;
            case ' ':
                togglePause();
                break;
        }
    }
});



// Функція паузи
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Продовжити' : 'Пауза';
    if (!isPaused) {
        drawGame();
    }
}

pauseBtn.addEventListener('click', togglePause);

// Початок гри
startBtn.addEventListener('click', () => {
    if (!gameRunning || isPaused) {
        snake = [{ x: 10, y: 10 }];
        dx = 0;
        dy = 0;
        score = 0;
        speed = 7;
        scoreText.textContent = '0';
        gameRunning = true;
        isPaused = false;
        pauseBtn.textContent = 'Пауза';
        generateNewFood();
        drawGame();
    }
}); 