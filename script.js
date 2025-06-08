const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let paused = false;
let gameOver = false;
let timer;

// Basket object
const basket = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 30,
  width: 100,
  height: 20,
  speed: 7
};

// Game state
const keys = { left: false, right: false };
const stars = [];
const dangers = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let fallSpeed = 2;
let gameTime = 60;
let dangerHits = 0;
const maxDangerHits = 5;

// Button area in canvas
const stopBtn = {
  x: canvas.width - 160,
  y: 60,
  width: 140,
  height: 30,
  text: "⏸ Stop"
};

// Input events
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (
    mouseX >= stopBtn.x &&
    mouseX <= stopBtn.x + stopBtn.width &&
    mouseY >= stopBtn.y &&
    mouseY <= stopBtn.y + stopBtn.height
  ) {
    if (gameOver) return;
    paused = !paused;
    stopBtn.text = paused ? "▶ Resume" : "⏸ Stop";
  }
});

// Star shape
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

// Red danger ball
function drawDangerBall(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}

// Spawn item
function spawnItem() {
  const x = Math.random() * (canvas.width - 20) + 10;
  const isDanger = Math.random() < 0.25;
  isDanger ? dangers.push({ x, y: -20 }) : stars.push({ x, y: -20 });
}

// Update logic
function update() {
  if (gameOver || paused) return;

  if (keys.left) basket.x -= basket.speed;
  if (keys.right) basket.x += basket.speed;
  basket.x = Math.max(0, Math.min(basket.x, canvas.width - basket.width));

  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].y += fallSpeed;
    const s = stars[i];
    if (s.y + 10 >= basket.y && s.x >= basket.x && s.x <= basket.x + basket.width) {
      score++;
      stars.splice(i, 1);
    } else if (s.y > canvas.height) {
      stars.splice(i, 1);
    }
  }

  for (let i = dangers.length - 1; i >= 0; i--) {
    dangers[i].y += fallSpeed + 2;
    const d = dangers[i];
    if (d.y + 10 >= basket.y && d.x >= basket.x && d.x <= basket.x + basket.width) {
      score = Math.max(0, score - 1);
      dangerHits++;
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

// Draw button in canvas
function drawStopButton() {
  ctx.fillStyle = "red";
  ctx.fillRect(stopBtn.x, stopBtn.y, stopBtn.width, stopBtn.height);
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText(stopBtn.text, stopBtn.x + 20, stopBtn.y + 20);
}

// Draw all
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
  ctx.fillText("Time: " + gameTime, canvas.width / 2 - 40, 30);
  ctx.fillText("Hits: " + dangerHits + " / " + maxDangerHits, 10, 60);

  drawStopButton();

  if (paused) {
    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.fillText("Paused", canvas.width / 2 - 70, canvas.height / 2);
  }

  if (gameOver) {
    ctx.font = "40px sans-serif";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
  }
}

// End game
function endGame() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  clearInterval(timer);
  document.getElementById("restartBtn").style.display = "block";
}

// Reset game
function resetGame() {
  score = 0;
  fallSpeed = 2;
  gameTime = 60;
  dangerHits = 0;
  gameOver = false;
  paused = false;
  stars.length = 0;
  dangers.length = 0;
  document.getElementById("restartBtn").style.display = "none";
  stopBtn.text = "⏸ Stop";
  clearInterval(timer);
  startTimer();
  loop();
}

// Game loop
function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// Timer
function startTimer() {
  timer = setInterval(() => {
    if (!paused && !gameOver) {
      gameTime--;
      if (gameTime <= 0) {
        gameOver = true;
        endGame();
      }
    }
  }, 1000);
}

document.getElementById("restartBtn").addEventListener("click", resetGame);

// Item spawn and difficulty
setInterval(() => { if (!gameOver) spawnItem(); }, 500);
setInterval(() => { if (!gameOver) fallSpeed += 1; }, 15000);

// Start
startTimer();
loop();
