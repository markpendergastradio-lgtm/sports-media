/* Shared helpers for the GA Sports Media simulators */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
function bindRange(id, fmt, onInput){
  const el = document.getElementById(id), out = document.getElementById(id + 'Out');
  const show = () => { if(out) out.textContent = fmt ? fmt(+el.value) : el.value; };
  el.addEventListener('input', () => { show(); onInput && onInput(); });
  show(); return el;
}
function setChecks(ul, items){
  ul.innerHTML = items.map(([ok, txt]) => `<li class="${ok === null ? '' : ok ? 'ok' : 'no'}">${txt}</li>`).join('');
  return items.filter(i => i[0]).length;
}
function canvasPointer(cv, e){
  const r = cv.getBoundingClientRect();
  return {x:(e.clientX - r.left) * cv.width / r.width, y:(e.clientY - r.top) * cv.height / r.height};
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const db = g => 20 * Math.log10(Math.max(g, 1e-6));
const undb = d => Math.pow(10, d / 20);
function rnd(seed){ let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
/* Simple stadium backdrop used by several camera sims */
function drawStadium(ctx, W, H, horizon){
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, '#1b2b45'); g.addColorStop(1, '#33476a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon);
  const r = rnd(7);
  for(let row = 0; row < 14; row++){
    const y = horizon * 0.25 + row * horizon * 0.055;
    for(let x = 0; x < W; x += 9){
      const c = ['#c8382f','#e8e8e8','#2d6ea6','#f2c14e','#555'][Math.floor(r() * 5)];
      ctx.fillStyle = c; ctx.globalAlpha = 0.5 + r() * 0.4;
      ctx.fillRect(x + r() * 3, y + r() * 4, 4, 5);
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0f6b2f'; ctx.fillRect(0, horizon, W, H - horizon);
  for(let i = 0; i < 10; i++){ ctx.fillStyle = i % 2 ? '#127a37' : '#0f6b2f'; ctx.fillRect(i * W / 10, horizon, W / 10, H - horizon); }
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, horizon - 8, W, 8);
}
/* A player figure standing on the ground at (x, footY) with given height in px */
function drawPlayer(ctx, x, footY, h, kit = '#c8382f', shorts = '#fff', skin = '#b07a55', facing = 1){
  const u = h / 8;
  ctx.save();
  ctx.fillStyle = '#111';
  ctx.fillRect(x - u * 0.9, footY - u * 0.25, u * 0.8, u * 0.25); ctx.fillRect(x + u * 0.1, footY - u * 0.25, u * 0.8, u * 0.25);
  ctx.fillStyle = skin; ctx.fillRect(x - u * 0.75, footY - u * 3.2, u * 0.55, u * 3); ctx.fillRect(x + u * 0.2, footY - u * 3.2, u * 0.55, u * 3);
  ctx.fillStyle = shorts; ctx.fillRect(x - u * 0.95, footY - u * 4.1, u * 1.9, u * 1.2);
  ctx.fillStyle = kit; ctx.fillRect(x - u * 1.05, footY - u * 6.7, u * 2.1, u * 2.7);
  ctx.fillRect(x - u * 1.55, footY - u * 6.6, u * 0.55, u * 1.3); ctx.fillRect(x + u * 1.0, footY - u * 6.6, u * 0.55, u * 1.3);
  ctx.fillStyle = skin; ctx.fillRect(x - u * 1.5, footY - u * 5.3, u * 0.45, u * 1.6); ctx.fillRect(x + u * 1.05, footY - u * 5.3, u * 0.45, u * 1.6);
  ctx.fillRect(x - u * 0.25, footY - u * 7.0, u * 0.5, u * 0.4);
  ctx.beginPath(); ctx.ellipse(x, footY - u * 7.5, u * 0.55, u * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(x, footY - u * 7.85, u * 0.56, u * 0.32, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(x + facing * u * 0.22 - u * 0.06, footY - u * 7.6, u * 0.12, u * 0.1);
  ctx.restore();
}
