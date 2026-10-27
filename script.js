const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Scroll reveal ----------
   IntersectionObserver calls us when an element enters the viewport,
   cheaper than listening to every scroll event. */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Scroll-spy ----------
   The rootMargin shrinks the "viewport" to a thin band around the screen's
   middle. A section counts as current when it crosses that band. */
const navLinks = [...document.querySelectorAll(".nav nav a")];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
  });
}, { rootMargin: "-40% 0px -55% 0px" });
navLinks.forEach((a) => {
  const section = document.querySelector(a.getAttribute("href"));
  if (section) spy.observe(section);
});

/* ---------- Typing effect ----------
   Types a phrase, pauses, deletes it, moves to the next. */
const phrases = [
  "production-grade AI systems",
  "RAG & text-to-SQL platforms",
  "voice AI automation",
  "LLM-powered analytics",
];
const typedEl = document.getElementById("typed");
if (!reduceMotion) {
  let p = 0, i = phrases[0].length, deleting = true;
  const tick = () => {
    const word = phrases[p];
    typedEl.textContent = word.slice(0, i);
    let delay = deleting ? 35 : 70;
    if (deleting) {
      i--;
      if (i < 0) { deleting = false; i = 0; p = (p + 1) % phrases.length; delay = 300; }
    } else {
      i++;
      if (i > phrases[p].length) { deleting = true; i = phrases[p].length; delay = 1800; }
    }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2000); // let the first phrase show before cycling
}

/* ---------- Animated counters ----------
   Ease-out cubic: 1 - (1-t)^3 starts fast and slows into the final value. */
const counters = document.querySelectorAll("[data-count]");
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.count;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    countObserver.unobserve(el);
    if (reduceMotion) return; // the HTML already holds the final text
    const start = performance.now(), duration = 1400;
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
counters.forEach((el) => countObserver.observe(el));

/* ---------- "How it works" pipelines ----------
   Opening a panel lights each step in turn, like data flowing through. */
document.querySelectorAll(".flow-btn").forEach((btn) => {
  const panel = btn.nextElementSibling;
  const steps = [...panel.children];
  let timers = [];
  btn.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Hide diagram" : "See how it works";
    timers.forEach(clearTimeout);
    steps.forEach((s) => s.classList.remove("lit"));
    if (open) {
      steps.forEach((s, idx) => {
        timers.push(setTimeout(() => s.classList.add("lit"), reduceMotion ? 0 : 450 * (idx + 1)));
      });
    }
  });
});

/* ---------- Skills filter ----------
   Each job/card carries data-tags="python rag ...". Clicking a skill compares
   that skill against each tag list: matches stay bright, the rest dim. */
const skillButtons = [...document.querySelectorAll("[data-skill]")];
const items = [...document.querySelectorAll(".job, .card")];
const status = document.getElementById("filter-status");
let active = null;

skillButtons.forEach((btn) => {
  btn.setAttribute("aria-pressed", "false");
  btn.addEventListener("click", () => {
    active = active === btn.dataset.skill ? null : btn.dataset.skill;
    skillButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.skill === active)));
    let hits = 0;
    items.forEach((el) => {
      const match = active && el.dataset.tags.split(" ").includes(active);
      el.classList.toggle("match", !!match);
      el.classList.toggle("dim", !!active && !match);
      if (match) hits++;
    });
    status.hidden = !active;
    if (active) status.textContent = `→ ${hits} match${hits === 1 ? "" : "es"} in experience and projects (click again to clear)`;
  });
});

/* ---------- Animated background ----------
   Particles drift and bounce; any pair closer than LINK px is joined by a
   line whose opacity fades with distance (1 - d/LINK). The mouse acts as an
   extra node, so the network reaches toward your cursor. */
(() => {
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  const LINK = 130;
  const mouse = { x: -9999, y: -9999 };
  let w, h, dpr, pts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(80, Math.floor((w * h) / 18000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const all = [...pts, mouse];
    for (const p of pts) {
      if (!reduceMotion) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      ctx.fillStyle = "rgba(94,234,212,.8)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    for (let a = 0; a < all.length; a++) {
      for (let b = a + 1; b < all.length; b++) {
        const dx = all[a].x - all[b].x, dy = all[a].y - all[b].y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(94,234,212,${(1 - d / LINK) * 0.35})`;
          ctx.beginPath(); ctx.moveTo(all[a].x, all[a].y); ctx.lineTo(all[b].x, all[b].y); ctx.stroke();
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });
  resize();
  draw();
})();
