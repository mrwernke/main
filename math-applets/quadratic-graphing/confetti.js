const confettiCanvas = document.createElement('canvas');
confettiCanvas.className = 'confetti';
confettiCanvas.setAttribute('aria-hidden', 'true');
confettiCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999';
let confettiBits = [], confettiTimer = null;

export function clearConfetti() {
  if (confettiTimer !== null) cancelAnimationFrame(confettiTimer);
  confettiTimer = null;
  confettiBits = [];
  confettiCanvas.remove();
}

export function fireConfetti(count) {
  clearConfetti();
  confettiCanvas.width = innerWidth;
  confettiCanvas.height = innerHeight;
  document.body.appendChild(confettiCanvas);
  const colors = ['#edb64d', '#1677c8', '#d44a4a', '#267a5e', '#8e5bd1'];
  for (let i = 0; i < count; i++) {
    confettiBits.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * innerHeight * .25,
      vx: (Math.random() - .5) * 2.4,
      vy: 2 + Math.random() * 3.5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: colors[i % colors.length],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - .5) * .25,
    });
  }
  confettiTimer = requestAnimationFrame(confettiTick);
}

function confettiTick() {
  const ctx = confettiCanvas.getContext('2d');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiBits = confettiBits.filter(bit => bit.y < confettiCanvas.height + 30);
  confettiBits.forEach(bit => {
    bit.x += bit.vx;
    bit.y += bit.vy;
    bit.vy += .06;
    bit.rot += bit.vr;
    ctx.save();
    ctx.translate(bit.x, bit.y);
    ctx.rotate(bit.rot);
    ctx.fillStyle = bit.color;
    ctx.fillRect(-bit.w / 2, -bit.h / 2, bit.w, bit.h);
    ctx.restore();
  });
  if (confettiBits.length) confettiTimer = requestAnimationFrame(confettiTick);
  else clearConfetti();
}
