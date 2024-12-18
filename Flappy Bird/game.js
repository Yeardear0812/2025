const game = document.getElementById('game');
const spaceship = document.getElementById('spaceship');
const scoreElement = document.getElementById('score');
const healthBar = document.querySelector('.health-bar');
const startMessage = document.getElementById('start-message');
const gameOverMessage = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const shootBtn = document.getElementById('shoot-btn');
const ammoCount = document.querySelector('.ammo-count');
const reloadProgress = document.querySelector('.reload-progress');
const levelElement = document.getElementById('level');

let isGameStarted = false;
let score = 0;
let health = 100;
let spaceshipX = 180;
let meteors = [];
let gameLoop;
let stars = [];
let moveLeft = false;
let moveRight = false;
let ammo = 5;
let isReloading = false;
let bullets = [];
let level = 1;
let meteorSpeed = 3;
let meteorSpawnRate = 2000;
let enemyShips = [];
let enemyBullets = [];
let isPaused = false;
let lastEnemySpawn = 0;
const ENEMY_SPAWN_INTERVAL = 15000; // Кожні 15 секунд
const BASE_METEOR_RATE = 1500;
const MIN_METEOR_RATE = 300;
const BASE_ENEMY_RATE = 10000;
const MIN_ENEMY_RATE = 5000;
const DIFFICULTY_INCREASE_SCORE = 300; // Кожні 300 очків збільшуємо складність

function createStars() {
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 400 + 'px';
        star.style.top = Math.random() * 600 + 'px';
        star.style.animation = `starTwinkle ${Math.random() * 3 + 1}s infinite`;
        game.appendChild(star);
        stars.push(star);
    }
}

function startGame() {
    if (!isGameStarted) {
        isGameStarted = true;
        score = 0;
        level = 1;
        health = 100;
        ammo = 5;
        meteorSpeed = 3;
        meteorSpawnRate = 2000;
        spaceshipX = 180;
        meteors.forEach(meteor => meteor.remove());
        meteors = [];
        bullets.forEach(bullet => bullet.remove());
        bullets = [];
        scoreElement.textContent = score;
        levelElement.textContent = `Рівень: ${level}`;
        ammoCount.textContent = ammo;
        healthBar.style.width = '100%';
        startMessage.style.display = 'none';
        gameOverMessage.style.display = 'none';
        spaceship.style.left = spaceshipX + 'px';
        reloadProgress.classList.remove('active');
        createStars();
        gameLoop = setInterval(update, 16);
        generateMeteor();
        createSnowflakes();
    }
}

function update() {
    if (isPaused) return;
    
    // Рух корабля
    if (moveLeft && spaceshipX > 0) {
        spaceshipX -= 5;
    }
    if (moveRight && spaceshipX < 360) {
        spaceshipX += 5;
    }
    spaceship.style.left = spaceshipX + 'px';

    // Рух куль
    bullets.forEach((bullet, bulletIndex) => {
        const y = parseInt(bullet.style.top);
        bullet.style.top = (y - 10) + 'px';
        
        if (y < -20) {
            bullet.remove();
            bullets.splice(bulletIndex, 1);
        }
        
        // Перевірка попадання
        meteors.forEach((meteor, meteorIndex) => {
            if (checkBulletCollision(bullet, meteor)) {
                createExplosion(meteor);
                meteor.remove();
                meteors.splice(meteorIndex, 1);
                bullet.remove();
                bullets.splice(bulletIndex, 1);
                score += 50;
                scoreElement.textContent = Math.floor(score / 10);
            }
        });
    });

    // Рух метеоритів
    meteors.forEach((meteor, index) => {
        const y = parseInt(meteor.style.top);
        const x = parseInt(meteor.style.left);
        
        if (meteor.dataset.homing === 'true') {
            // Рух переслідувача до корабля
            const targetX = spaceshipX + 20 - meteor.offsetWidth/2; // Центр корабля
            const dx = targetX - x;
            const newX = x + Math.sign(dx) * 2; // Горизонтальний рух
            meteor.style.left = newX + 'px';
            meteor.style.top = (y + parseFloat(meteor.dataset.speed)) + 'px';
            
            // Додаємо ефект світіння для переслідувачів
            meteor.style.filter = `hue-rotate(${Date.now() % 360}deg)`;
        } else {
            meteor.style.top = (y + parseFloat(meteor.dataset.speed)) + 'px';
        }
        
        if (y > 600) {
            meteor.remove();
            meteors.splice(index, 1);
        } else if (checkCollision(meteor)) {
            createExplosion(meteor);
            meteor.remove();
            meteors.splice(index, 1);
            health -= 20;
            healthBar.style.width = health + '%';
            if (health <= 0) {
                gameOver();
            }
        }
    });

    // Додайте перевірку часу для створення ворожого корабля
    const currentTime = Date.now();
    if (currentTime - lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
        createEnemyShip();
        lastEnemySpawn = currentTime;
    }

    // Рух ворожих куль
    enemyBullets.forEach((bullet, index) => {
        const y = parseInt(bullet.style.top);
        bullet.style.top = (y + 5) + 'px';
        
        if (y > 600) {
            bullet.remove();
            enemyBullets.splice(index, 1);
        } else if (checkBulletCollision(bullet, spaceship)) {
            bullet.remove();
            enemyBullets.splice(index, 1);
            health -= 10;
            healthBar.style.width = health + '%';
            if (health <= 0) {
                gameOver();
            }
        }
    });

    // Рух ворожих кораблів
    enemyShips.forEach((enemy, index) => {
        const y = parseInt(enemy.style.top);
        enemy.style.top = (y + 1) + 'px';
        
        // Перевірка попадання наших куль у ворожий корабель
        bullets.forEach((bullet, bulletIndex) => {
            if (checkBulletCollision(bullet, enemy)) {
                bullet.remove();
                bullets.splice(bulletIndex, 1);
                enemy.health--;
                enemy.classList.add('hit');
                setTimeout(() => enemy.classList.remove('hit'), 200);
                
                if (enemy.health <= 0) {
                    createExplosion(enemy);
                    enemy.remove();
                    enemyShips.splice(index, 1);
                    score += 200;
                    scoreElement.textContent = Math.floor(score / 10);
                }
            }
        });
    });

    score++;
    scoreElement.textContent = Math.floor(score / 10);

    // Оновлення рівня складності
    const newLevel = Math.floor(score / DIFFICULTY_INCREASE_SCORE) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelElement.textContent = `Рівень: ${level}`;
        // Збільшуємо швидкість і частоту появи перешкод
        meteorSpeed = Math.min(3 + level * 0.5, 12);
        meteorSpawnRate = Math.max(BASE_METEOR_RATE - level * 150, MIN_METEOR_RATE);
        ENEMY_SPAWN_INTERVAL = Math.max(BASE_ENEMY_RATE - level * 1000, MIN_ENEMY_RATE);
        
        // Ефект підвищення рівня
        showLevelUpEffect();
    }
}

function generateMeteor() {
    if (!isGameStarted) return;
    
    const meteor = document.createElement('div');
    const isHoming = Math.random() < 0.25;
    meteor.className = isHoming ? 'meteor homing' : 'meteor';
    const size = Math.random() * 30 + 20;
    meteor.style.width = size + 'px';
    meteor.style.height = size + 'px';
    meteor.style.top = '-50px';
    meteor.style.left = Math.random() * (400 - size) + 'px';
    meteor.dataset.homing = isHoming;
    meteor.dataset.speed = isHoming ? 3.5 : meteorSpeed;
    
    game.appendChild(meteor);
    meteors.push(meteor);
    
    setTimeout(generateMeteor, meteorSpawnRate);
}

function checkCollision(meteor) {
    const shipRect = spaceship.getBoundingClientRect();
    const meteorRect = meteor.getBoundingClientRect();
    
    return !(shipRect.right < meteorRect.left || 
             shipRect.left > meteorRect.right || 
             shipRect.bottom < meteorRect.top || 
             shipRect.top > meteorRect.bottom);
}

function createExplosion(meteor) {
    const meteorRect = meteor.getBoundingClientRect();
    
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        particle.style.left = meteorRect.left + meteorRect.width/2 + 'px';
        particle.style.top = meteorRect.top + meteorRect.height/2 + 'px';
        
        game.appendChild(particle);
        setTimeout(() => particle.remove(), 500);
    }
}

function gameOver() {
    isGameStarted = false;
    clearInterval(gameLoop);
    gameOverMessage.style.display = 'block';
    finalScoreElement.textContent = Math.floor(score / 10);
    document.getElementById('final-level').textContent = level;
    stars.forEach(star => star.remove());
    stars = [];
}

function shoot() {
    if (!isGameStarted || ammo <= 0 || isReloading) return;
    
    spaceship.classList.add('shooting');
    setTimeout(() => spaceship.classList.remove('shooting'), 200);
    
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    bullet.style.left = (spaceshipX + 17) + 'px';
    bullet.style.top = (game.offsetHeight - 80) + 'px';
    game.appendChild(bullet);
    bullets.push(bullet);
    
    // Звуковий ефект пострілу
    playSound('shoot');
    
    ammo--;
    ammoCount.textContent = ammo;
    
    if (ammo === 0) {
        startReload();
    }
}

function startReload() {
    isReloading = true;
    reloadProgress.classList.add('active');
    
    setTimeout(() => {
        ammo = 5;
        ammoCount.textContent = ammo;
        isReloading = false;
        reloadProgress.classList.remove('active');
    }, 15000);
}

function checkBulletCollision(bullet, meteor) {
    const bulletRect = bullet.getBoundingClientRect();
    const meteorRect = meteor.getBoundingClientRect();
    
    return !(bulletRect.right < meteorRect.left || 
             bulletRect.left > meteorRect.right || 
             bulletRect.bottom < meteorRect.top || 
             bulletRect.top > meteorRect.bottom);
}

// Керування кнопками
leftBtn.addEventListener('mousedown', () => moveLeft = true);
leftBtn.addEventListener('mouseup', () => moveLeft = false);
leftBtn.addEventListener('mouseleave', () => moveLeft = false);

rightBtn.addEventListener('mousedown', () => moveRight = true);
rightBtn.addEventListener('mouseup', () => moveRight = false);
rightBtn.addEventListener('mouseleave', () => moveRight = false);

// Керування клавіатурою
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') moveLeft = true;
    if (e.code === 'ArrowRight') moveRight = true;
    if (e.code === 'Space') {
        shoot();
        e.preventDefault();
    }
    if (e.code === 'Escape' && isGameStarted) {
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') moveLeft = false;
    if (e.code === 'ArrowRight') moveRight = false;
    if (e.code === 'Space') startGame();
});

// Підтримка тач-екранів
leftBtn.addEventListener('touchstart', () => moveLeft = true);
leftBtn.addEventListener('touchend', () => moveLeft = false);
rightBtn.addEventListener('touchstart', () => moveRight = true);
rightBtn.addEventListener('touchend', () => moveRight = false);

// Додайте обробники подій для стрільби
shootBtn.addEventListener('click', shoot);

// Початкове відображення зірок
createStars(); 

// Додайте ці функції для нових анімацій

function createSnowflakes() {
    if (!isGameStarted) return;
    
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.textContent = '❄';
    snowflake.style.left = Math.random() * 400 + 'px';
    snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
    game.appendChild(snowflake);
    
    setTimeout(() => snowflake.remove(), 5000);
    setTimeout(createSnowflakes, 200);
}

// Додайте звукові ефекти
const sounds = {
    shoot: new Audio('data:audio/wav;base64,UklGRl9vT19...'), // Тут має бути base64 звуку
    explosion: new Audio('data:audio/wav;base64,UklGRl9vT19...') // Тут має бути base64 звуку
};

function playSound(name) {
    const sound = sounds[name].cloneNode();
    sound.volume = 0.3;
    sound.play();
}

// Додайте функцію створення ворожого корабля
function createEnemyShip() {
    if (!isGameStarted || isPaused) return;
    
    const enemy = document.createElement('div');
    enemy.className = 'enemy-ship';
    enemy.style.left = Math.random() * 340 + 'px';
    enemy.style.top = '-50px';
    enemy.health = 3; // Кількість влучень для знищення
    game.appendChild(enemy);
    enemyShips.push(enemy);
    
    // Стрільба ворожого корабля
    const shootInterval = setInterval(() => {
        if (!isGameStarted || isPaused) {
            clearInterval(shootInterval);
            return;
        }
        enemyShoot(enemy);
    }, 2000);
    
    setTimeout(() => {
        if (enemy.parentNode) {
            enemy.remove();
            enemyShips = enemyShips.filter(ship => ship !== enemy);
            clearInterval(shootInterval);
        }
    }, 10000);
}

function enemyShoot(enemy) {
    const bullet = document.createElement('div');
    bullet.className = 'enemy-bullet';
    const enemyRect = enemy.getBoundingClientRect();
    
    // Позиціонуємо кулю в носі корабля (посередині нижньої частини)
    bullet.style.left = (enemyRect.left + enemyRect.width/2 - 2) + 'px'; // -2px для центрування кулі
    bullet.style.top = (enemyRect.bottom - 5) + 'px'; // -5px щоб куля з'являлась трохи вище низу корабля
    
    // Додаємо ефект спалаху при пострілі
    const flash = document.createElement('div');
    flash.className = 'enemy-shoot-flash';
    flash.style.left = bullet.style.left;
    flash.style.top = bullet.style.top;
    game.appendChild(flash);
    
    setTimeout(() => flash.remove(), 100);
    
    game.appendChild(bullet);
    enemyBullets.push(bullet);
}

// Додайте функцію паузи
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoop);
        showPauseMenu();
    } else {
        gameLoop = setInterval(update, 16);
        hidePauseMenu();
    }
}

function showPauseMenu() {
    const pauseMenu = document.createElement('div');
    pauseMenu.id = 'pause-menu';
    pauseMenu.innerHTML = `
        <h2>Пауза</h2>
        <button id="resume-btn">Продовжити</button>
        <button id="restart-btn">Почати заново</button>
    `;
    game.appendChild(pauseMenu);
    
    document.getElementById('resume-btn').onclick = togglePause;
    document.getElementById('restart-btn').onclick = () => {
        togglePause();
        startGame();
    };
}

function hidePauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) pauseMenu.remove();
}

// Додайте нову функцію для ефекту підвищення рівня
function showLevelUpEffect() {
    const levelUp = document.createElement('div');
    levelUp.className = 'level-up-effect';
    levelUp.textContent = `Рівень ${level}!`;
    game.appendChild(levelUp);
    
    setTimeout(() => levelUp.remove(), 2000);
}
  