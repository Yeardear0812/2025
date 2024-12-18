const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");

document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        jump();
    }
});

function jump() {
    if (!dino.classList.contains("jump")) {
        dino.classList.add("jump");
        
        setTimeout(function() {
            dino.classList.remove("jump");
        }, 500);
    }
}

let isAlive = setInterval(function() {
    let dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("bottom"));
    let cactusLeft = parseInt(window.getComputedStyle(cactus).getPropertyValue("right"));
    
    if (cactusLeft < 50 && cactusLeft > 0 && dinoTop <= 50) {
        alert("Game Over!");
    }
}, 10); 