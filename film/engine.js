// 证明之战 — engine
// Everything on screen is a pure function of time: PF.render(ctx, t) always
// draws the same frame for the same t. Playback, seeking and export rely on it.
(function () {
  'use strict';
  const PF = (window.PF = window.PF || {});

  const W = 1920, H = 1080, FPS = 30, DURATION = 120;
  const BPM = 120, BEAT = 60 / BPM, BAR = BEAT * 4;
  Object.assign(PF, { W, H, FPS, DURATION, BPM, BEAT, BAR });

  PF.C = {
    ink: '#0A0B12',
    paper: '#E6E8EC',
    blue: '#1F2DE6',
    yellow: '#FFD21F',
    red: '#FF3B30',
    grey: '#7C8196',
  };

  PF.F = {
    serif: (s, w = 900) => `${w} ${s}px "Noto Serif SC", "Songti SC", serif`,
    sans: (s, w = 400) => `${w} ${s}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`,
    mono: (s, w = 400) => `${w} ${s}px "Martian Mono", "Noto Sans SC", ui-monospace, monospace`,
    display: (s, w = 900) => `${w} ${s}px "Big Shoulders Display", "Noto Sans SC", Impact, sans-serif`,
  };

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  Object.assign(PF, { clamp, lerp, prog });

  const E = {
    linear: (t) => t,
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  };
  PF.E = E;

  PF.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // Stateless hash noise in [0,1) for per-frame jitter that must not depend on history.
  PF.hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  // ---------- beat grid (shared with the soundtrack) ----------
  // Kick drum pattern by beat index. The soundtrack schedules from this
  // function and the visuals pulse from it, so they cannot drift apart.
  PF.kickAt = function (b) {
    const t = b * BEAT;
    if (t >= 16 && t < 22) return b % 2 === 0; // heartbeat under the challenge
    if (t >= 48 && t < 64) return b % 4 === 0 || b % 4 === 2; // half-time while thinking
    if (t >= 24 && t < 110) return true; // four on the floor
    return false;
  };
  PF.lastKick = function (t) {
    const b = Math.floor(t / BEAT + 1e-6);
    for (let k = b; k > b - 8; k--) if (k >= 0 && PF.kickAt(k)) return k * BEAT;
    return -99;
  };
  PF.pulse = (t, k = 7) => Math.exp(-(t - PF.lastKick(t)) * k);

  // ---------- text ----------
  PF.chars = (s) => Array.from(s);
  PF.typed = function (str, t, t0, cps) {
    const cs = Array.from(str);
    const n = clamp(Math.floor((t - t0) * cps), 0, cs.length);
    return cs.slice(0, n).join('');
  };
  // Times at which each visible character of a typed string appears (for key ticks).
  PF.typeTimes = function (str, t0, cps) {
    const out = [];
    Array.from(str).forEach((ch, i) => {
      if (ch.trim()) out.push(t0 + (i + 1) / cps);
    });
    return out;
  };
  PF.text = function (ctx, str, x, y, font, color, align = 'left', base = 'alphabetic', spacing = 0) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    if ('letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
    ctx.fillText(str, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  };
  PF.measure = function (ctx, str, font, spacing = 0) {
    ctx.font = font;
    if ('letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
    const w = ctx.measureText(str).width;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    return w;
  };
  // Blinking block cursor, locked to the beat so it blinks in tempo.
  PF.cursor = function (ctx, x, y, w, h, t, color, solid) {
    const on = solid || Math.floor(t / BEAT) % 2 === 0;
    if (!on) return;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - h, w, h);
  };

  // ---------- particle targets ----------
  const sampleCache = new Map();
  let scratch = null;
  PF.sample = function (key, draw, step = 5) {
    if (sampleCache.has(key)) return sampleCache.get(key);
    if (!scratch) {
      scratch = document.createElement('canvas');
      scratch.width = W;
      scratch.height = H;
    }
    const g = scratch.getContext('2d', { willReadFrequently: true });
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#fff';
    draw(g);
    const d = g.getImageData(0, 0, W, H).data;
    const pts = [];
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 140) pts.push(x, y);
    sampleCache.set(key, pts);
    return pts;
  };
  // Resample a point cloud to exactly n points, shuffled so that morphs between
  // two clouds send each particle on its own path.
  PF.fit = function (pts, n, seed) {
    const m = pts.length / 2;
    const r = PF.rng(seed);
    const idx = new Uint32Array(m);
    for (let i = 0; i < m; i++) idx[i] = i;
    for (let i = m - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
    }
    const out = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const j = idx[i % m];
      const dup = i >= m ? 1 : 0;
      out[2 * i] = pts[2 * j] + (dup ? (r() - 0.5) * 3 : 0);
      out[2 * i + 1] = pts[2 * j + 1] + (dup ? (r() - 0.5) * 3 : 0);
    }
    return out;
  };

  // ---------- transitions ----------
  // Each returns a clip path for the incoming scene at progress p (0..1).
  PF.clips = {
    slices(ctx, p, o) {
      const n = o.n || 9, h = H / n;
      for (let i = 0; i < n; i++) {
        const k = E.inOutExpo(clamp(p * 1.6 - (i / n) * 0.6));
        const w = W * k;
        if (i % 2 === 0) ctx.rect(0, i * h - 0.5, w, h + 1);
        else ctx.rect(W - w, i * h - 0.5, w, h + 1);
      }
    },
    iris(ctx, p, o) {
      const r = Math.hypot(W, H) * E.inExpo(p) + 0.01;
      ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
    },
    square(ctx, p, o) {
      const s = Math.hypot(W, H) * 1.5 * E.inOutExpo(p) + 0.01;
      const a = (1 - E.outCubic(p)) * Math.PI * 0.75;
      for (let k = 0; k < 4; k++) {
        const ang = a + Math.PI / 4 + (k * Math.PI) / 2;
        const x = o.x + Math.cos(ang) * s * 0.7071, y = o.y + Math.sin(ang) * s * 0.7071;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
    },
  };

  // ---------- finishing: grain + vignette ----------
  let grainTiles = null, vignette = null;
  function buildFinish(ctx) {
    grainTiles = [];
    const r = PF.rng(7);
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      const img = g.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = r() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      grainTiles.push(c);
    }
    vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.16)');
  }
  PF.finish = function (ctx, t) {
    if (!grainTiles) buildFinish(ctx);
    const f = Math.floor(t * FPS);
    ctx.save();
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.045;
    ctx.globalCompositeOperation = 'overlay';
    const tile = grainTiles[Math.floor(f / 2) % 4];
    const pat = ctx.createPattern(tile, 'repeat');
    const ox = Math.floor(PF.hash(f) * 256), oy = Math.floor(PF.hash(f + 0.5) * 256);
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
  };

  // ---------- HUD ----------
  const pad2 = (n) => String(n).padStart(2, '0');
  PF.timecode = function (t) {
    const f = Math.floor(t * FPS + 1e-6);
    const s = Math.floor(f / FPS);
    return `00:${pad2(Math.floor(s / 60))}:${pad2(s % 60)}:${pad2(f % FPS)}`;
  };
  PF.hud = function (ctx, t, scene, alpha) {
    if (alpha <= 0) return;
    const fg = scene.fgAt ? scene.fgAt(t) : scene.fg;
    ctx.save();
    ctx.globalAlpha = 0.62 * alpha;
    const m = PF.F.mono(15, 400);
    PF.text(ctx, '证明之战 · THE PROVING', 96, 78, m, fg, 'left', 'alphabetic', 1);
    PF.text(ctx, scene.chapter, W - 96, 78, m, fg, 'right', 'alphabetic', 1);
    PF.text(ctx, '分支 claude/confident-franklin-rhs0f4', 96, H - 60, m, fg, 'left', 'alphabetic', 0);
    const f = Math.floor(t * FPS + 1e-6);
    PF.text(ctx, `${PF.timecode(t)}   F ${String(f).padStart(4, '0')}`, W - 96, H - 60, m, fg, 'right', 'alphabetic', 0);
    // baked-in progress hairline with a tick for every chapter boundary
    const x0 = 96, x1 = W - 96, y = H - 40;
    ctx.globalAlpha = 0.22 * alpha;
    ctx.fillStyle = fg;
    ctx.fillRect(x0, y, x1 - x0, 1);
    PF.scenes.forEach((s) => ctx.fillRect(lerp(x0, x1, s.t0 / DURATION), y - 4, 1, 9));
    ctx.globalAlpha = 0.8 * alpha;
    ctx.fillRect(x0, y - 1, (x1 - x0) * (t / DURATION), 3);
    ctx.restore();
  };

  // ---------- composition ----------
  PF.scenes = [];
  PF.sceneAt = function (t) {
    const s = PF.scenes;
    for (let i = s.length - 1; i >= 0; i--) if (t >= s[i].t0) return i;
    return 0;
  };
  function drawScene(ctx, s, t) {
    ctx.save();
    ctx.fillStyle = s.ground;
    ctx.fillRect(0, 0, W, H);
    s.draw(ctx, t - s.t0, t);
    ctx.restore();
  }
  PF.render = function (ctx, t) {
    t = clamp(t, 0, DURATION - 1e-4);
    const list = PF.scenes;
    let i = PF.sceneAt(t);
    // An incoming scene may start its transition a little before its own t0.
    const next = list[i + 1];
    let shown = list[i];
    if (next && next.tin && t >= next.t0 - next.tin.lead) {
      const tr = next.tin;
      const p = prog(t, next.t0 - tr.lead, next.t0 - tr.lead + tr.dur);
      drawScene(ctx, list[i], t);
      ctx.save();
      ctx.beginPath();
      PF.clips[tr.type](ctx, p, tr);
      ctx.clip();
      drawScene(ctx, next, t);
      ctx.restore();
      if (p > 0.5) shown = next;
    } else {
      const cur = list[i];
      if (cur.tin && t < cur.t0 - cur.tin.lead + cur.tin.dur && i > 0) {
        const tr = cur.tin;
        const p = prog(t, cur.t0 - tr.lead, cur.t0 - tr.lead + tr.dur);
        drawScene(ctx, list[i - 1], t);
        ctx.save();
        ctx.beginPath();
        PF.clips[tr.type](ctx, p, tr);
        ctx.clip();
        drawScene(ctx, cur, t);
        ctx.restore();
      } else {
        drawScene(ctx, cur, t);
      }
    }
    PF.finish(ctx, t);
    const hudA = Math.min(prog(t, 0.2, 1.2), 1 - prog(t, 118.6, 119.6)) * (shown.hud === false ? 0 : 1);
    PF.hud(ctx, t, shown, hudA);
  };
})();
