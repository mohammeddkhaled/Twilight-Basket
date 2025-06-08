// Canvas and context setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Basket object
const basket = {
  x: canvas.width / 2 - 50,
  y: canvas.height - 30,
  width: 100,
  height: 20,
  speed: 7
};

// Keyboard input tracking
const keys = {
  left: false,
  right: false
};

// Stars array and game variables
const stars = [];
let score = 0;

// Load high score from localStorage
let highScore = localStorage.getItem("highScore") || 0;
highScore = parseInt(highScore);

let fallSpeed = 2;
let gameTime = 60;
let gameOver = false;

// Handle key press
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// Draw a star shape
function drawStar(cx, cy, spikes, outerR, innerR) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerR;
    y = cy + Math.sin(rot) * outerR;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fillStyle = "yellow";
  ctx.fill();
}

// Spawn a new falling star
function spawnStar() {
  const x = Math.random() * (canvas.width - 20) + 10;
  stars.push({ x, y: -20 });
}

// Update game objects
function update() {
  if (gameOver) return;

  // Move basket
  if (keys.left) basket.x -= basket.speed;
  if (keys.right) basket.x += basket.speed;

  // Clamp basket within canvas
  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width)
    basket.x = canvas.width - basket.width;

  // Move stars and detect collisions
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].y += fallSpeed;

    // Collision with basket
    if (
      stars[i].y + 10 >= basket.y &&
      stars[i].x >= basket.x &&
      stars[i].x <= basket.x + basket.width
    ) {
      score++;
      stars.splice(i, 1);
    } else if (stars[i].y > canvas.height) {
      // Remove stars that fall off screen
      stars.splice(i, 1);
    }
  }
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw basket
  ctx.fillStyle = "brown";
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

  // Draw stars
  for (let s of stars) {
    drawStar(s.x, s.y, 5, 10, 5);
  }

  // Draw UI: score, high score, timer
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("High Score: " + highScore, canvas.width - 160, 30);
  ctx.fillText("Time: " + gameTime, canvas.width / 2 - 40, 30);

  // If game over, show message
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "40px sans-serif";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    ctx.font = "20px sans-serif";
    ctx.fillText("Refresh to play again", canvas.width / 2 - 90, canvas.height / 2 + 30);
  }
}

// Main game loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Start spawning stars regularly
setInterval(() => {
  if (!gameOver) spawnStar();
}, 500);

// Increase difficulty every 15 seconds
setInterval(() => {
  if (!gameOver) fallSpeed += 1;
}, 15000);

// Countdown timer
const timer = setInterval(() => {
  if (!gameOver) {
    gameTime--;
    if (gameTime <= 0) {
      gameOver = true;

      // Save high score if beaten
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
      }

      clearInterval(timer);
    }
  }
}, 1000);

// Start the game
loop();
