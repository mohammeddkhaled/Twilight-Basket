const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameDuration = 60;
let isUnlimited = false;
let paused = false;
let gameOver = false;
let isNewHighScore = false;
let timer;

const basket = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 30,
  width: 100,
  height: 20,
  speed: 7
};

const keys = { left: false, right: false };
const stars = [];
const dangers = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let fallSpeed = 2;
let gameTime = 60;
let dangerHits = 0;
const maxDangerHits = 5;

// Audio
const starSound = new Audio("sounds/star.mp3");
const dangerSound = new Audio("sounds/danger.mp3");
const congratsSound = new Audio("sounds/congrats.mp3");

// Dots for new high score
const highScoreDots = [];

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// Mouse
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  basket.x = Math.max(0, Math.min(mouseX - basket.width / 2, canvas.width - basket.width));
});

// Touch
let touchStartX = null;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, false);
canvas.addEventListener('touchmove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  basket.x = Math.max(0, Math.min(touchX - basket.width / 2, canvas.width - basket.width));
  touchStartX = e.touches[0].clientX;
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', () => {
  touchStartX = null;
}, false);

// Pause
document.getElementById("pauseBtn").addEventListener("click", () => {
  if (gameOver) return;
  paused = !paused;
  document.getElementById("pauseBtn").innerText = paused ? "▶ Resume" : "⏸ Stop";
});

// Drawing
function drawStar(cx, cy, spikes, outerR, innerR) {
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
  ctx.fillStyle = "yellow";
  ctx.fill();
}

function drawDangerBall(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}

function spawnItem() {
  const x = Math.random() * (canvas.width - 20) + 10;
  Math.random() < 0.25 ? dangers.push({ x, y: -20 }) : stars.push({ x, y: -20 });
}

function update() {
  if (gameOver || paused) return;

  if (keys.left) basket.x -= basket.speed;
  if (keys.right) basket.x += basket.speed;
  basket.x = Math.max(0, Math.min(basket.x, canvas.width - basket.width));

  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].y += fallSpeed + 2;
    const s = stars[i];
    if (s.y + 10 >= basket.y && s.x >= basket.x && s.x <= basket.x + basket.width) {
      score++;
      starSound.currentTime = 0;
      if (!paused) starSound.play();
      stars.splice(i, 1);
    } else if (s.y > canvas.height) {
      stars.splice(i, 1);
    }
  }

  for (let i = dangers.length - 1; i >= 0; i--) {
    dangers[i].y += fallSpeed + 3;
    const d = dangers[i];
    if (d.y + 10 >= basket.y && d.x >= basket.x && d.x <= basket.x + basket.width) {
      score = Math.max(0, score - 1);
      dangerHits++;
      dangerSound.currentTime = 0;
      if (!paused) dangerSound.play();
      dangers.splice(i, 1);
    } else if (d.y > canvas.height) {
      dangers.splice(i, 1);
    }
  }

  if (dangerHits >= maxDangerHits) {
    gameOver = true;
    endGame();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "brown";
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

  stars.forEach(s => drawStar(s.x, s.y, 5, 10, 5));
  dangers.forEach(d => drawDangerBall(d.x, d.y));

  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("High Score: " + highScore, canvas.width - 160, 30);
  ctx.fillText("Time: " + (isUnlimited ? "∞" : gameTime), canvas.width / 2 - 40, 30);
  ctx.fillText("Hits: " + dangerHits + " / " + maxDangerHits, 10, 60);

  if (paused) {
    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.fillText("Paused", canvas.width / 2 - 70, canvas.height / 2);
  }

  if (gameOver) {
    let yOffset = canvas.height / 2;
    ctx.font = "36px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("Game Over", canvas.width / 2 - 100, yOffset);
    document.getElementById("restartBtn").style.display = "block";

    if (isNewHighScore) {
      ctx.font = "28px sans-serif";
      ctx.fillStyle = "lightgreen";
      ctx.fillText("🎉 Congratulations! New High Score! 🎉", canvas.width / 2 - 220, yOffset + 80);

      // draw static colorful dots
      highScoreDots.forEach(dot => {
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }
}

function endGame() {
  clearInterval(timer);
  isNewHighScore = false;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    isNewHighScore = true;
    congratsSound.currentTime = 0;
    congratsSound.play();
    createStaticDots();
  }

  gameOver = true;
}

function resetGame() {
  score = 0;
  fallSpeed = 2;
  gameTime = isUnlimited ? Infinity : gameDuration;
  dangerHits = 0;
  gameOver = false;
  paused = false;
  isNewHighScore = false;
  stars.length = 0;
  dangers.length = 0;
  highScoreDots.length = 0;
  document.getElementById("restartBtn").style.display = "none";
  document.getElementById("pauseBtn").innerText = "⏸ Stop";
  clearInterval(timer);
  startTimer();
  loop();
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

function startTimer() {
  timer = setInterval(() => {
    if (!paused && !gameOver && !isUnlimited) {
      gameTime--;
      if (gameTime <= 0) {
        gameOver = true;
        endGame();
      }
    }
  }, 1000);
}

// Increase falling speed every 10s
let speedUpCount = 0;
const speedInterval = setInterval(() => {
  if (!gameOver && speedUpCount < 5) {
    fallSpeed += 2;
    speedUpCount++;
  }
}, 10000);

// Static Colorful Dots
function createStaticDots() {
  highScoreDots.length = 0;
  for (let i = 0; i < 100; i++) {
    highScoreDots.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`
    });
  }
}

// Start Game
document.getElementById("startBtn").addEventListener("click", () => {
  const selected = document.getElementById("timeSelect").value;
  isUnlimited = selected === "unlimited";
  gameDuration = isUnlimited ? Infinity : parseInt(selected);
  gameTime = isUnlimited ? Infinity : gameDuration;

  document.querySelector(".start-menu").style.display = "none";
  document.querySelector(".game-wrapper").classList.remove("hidden");
  document.getElementById("pauseBtn").style.display = "block";
  document.getElementById("gameCanvas").style.display = "block";

  startTimer();
  loop();

  setInterval(() => { if (!gameOver) spawnItem(); }, 500);
});

document.getElementById("restartBtn").addEventListener("click", resetGame);
