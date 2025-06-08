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

const keys = { left: false, right: false };
const stars = [];
const dangers = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let fallSpeed = 2;
let gameTime = 60;
let dangerHits = 0;
const maxDangerHits = 5;

// Input events
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  if (gameOver) return;
  paused = !paused;
  document.getElementById("pauseBtn").innerText = paused ? "▶ Resume" : "⏸ Stop";
});

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
  const isDanger = Math.random() < 0.25;
  isDanger ? dangers.push({ x, y: -20 }) : stars.push({ x, y: -20 });
}

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

function endGame() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  clearInterval(timer);
  document.getElementById("restartBtn").style.display = "block";
}

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

setInterval(() => { if (!gameOver) spawnItem(); }, 500);
setInterval(() => { if (!gameOver) fallSpeed += 1; }, 15000);

startTimer();
loop();
