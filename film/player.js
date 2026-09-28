// 证明之战 — player
(function () {
  'use strict';
  const PF = window.PF;
  const { F, DURATION, W, H } = PF;

  // ---------- readiness: fonts, then particle targets ----------
  let readyP = null;
  PF.ready = function () {
    if (readyP) return readyP;
    readyP = (async () => {
      const extra = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;/·×→↑—“”…()=+-_*#$@?!%\'"<>';
      const text = Array.from(new Set(Array.from(PF.strings.join('') + extra))).join('');
      const faces = [F.serif(100), F.sans(100, 400), F.sans(100, 700), F.mono(100, 400), F.mono(100, 700), F.display(100, 900)];
      const loads = Promise.all(faces.map((f) => document.fonts.load(f, text).catch(() => null)));
      await Promise.race([loads, new Promise((r) => setTimeout(r, 12000))]);
      PF.prepare.forEach((fn) => fn());
    })();
    return readyP;
  };
  // Full-resolution frame for export: same render(t), fixed 1920×1080.
  let exportCanvas = null;
  PF.exportFrame = function (t, type = 'image/jpeg', q = 0.95) {
    if (!exportCanvas) {
      exportCanvas = document.createElement('canvas');
      exportCanvas.width = W;
      exportCanvas.height = H;
    }
    const c = exportCanvas.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    PF.render(c, t);
    return exportCanvas.toDataURL(type, q);
  };

  // ---------- UI ----------
  const $ = (id) => document.getElementById(id);
  const cv = $('film');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const stage = $('stage'), big = $('bigplay'), status = $('status'), seek = $('seek');
  const tc = $('tc'), icon = $('icon'), muteBtn = $('mute'), muteState = $('muteState');
  const POSTER_T = 29.2;

  let t = 0, playing = false, poster = true, muted = false, ready = false;
  let live = null, perf0 = 0, perfT0 = 0;

  const CHAPTERS = [
    ['序章', '一个空仓库'], ['序章', '你出的题'], ['片名', '证明之战'], ['01 读', '先读懂，再动手'],
    ['02 想', '动画的灵魂是时间'], ['03 做', '一次一个提交'], ['04 验', '证据胜于宣称'], ['终证', '用数字证明'], ['片尾', '下一题？'],
  ];
  const fmt = (s) => {
    s = Math.max(0, Math.floor(s + 1e-6));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const list = $('chapters'), ticks = $('ticks');
  PF.scenes.forEach((s, i) => {
    const li = document.createElement('li');
    li.className = 'chap';
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<time>${fmt(s.t0)}</time><strong></strong><span></span>`;
    b.querySelector('strong').textContent = CHAPTERS[i][0];
    b.querySelector('span').textContent = CHAPTERS[i][1];
    b.addEventListener('click', () => { goTo(s.t0 + 0.001); if (!playing) play(); });
    li.appendChild(b);
    list.appendChild(li);
    if (i) {
      const k = document.createElement('i');
      k.style.left = `calc(6px + (100% - 12px) * ${s.t0 / DURATION})`;
      ticks.appendChild(k);
    }
  });
  const chapEls = [...list.children];

  function resize() {
    const r = cv.getBoundingClientRect();
    const w = Math.max(320, Math.min(W, Math.round(r.width * (window.devicePixelRatio || 1))));
    if (cv.width !== w) {
      cv.width = w;
      cv.height = Math.round((w * 9) / 16);
    }
    draw();
  }
  function draw() {
    if (!ready) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0a0b12';
      ctx.fillRect(0, 0, cv.width, cv.height);
      return;
    }
    const k = cv.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    PF.render(ctx, poster ? POSTER_T : t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function syncUI() {
    tc.innerHTML = `<b>${fmt(t)}</b> / ${fmt(DURATION)}`;
    seek.value = t.toFixed(3);
    seek.style.setProperty('--p', (t / DURATION) * 100 + '%');
    const i = PF.sceneAt(t);
    chapEls.forEach((el, k) => el.classList.toggle('on', k === i && !poster));
    icon.innerHTML = playing ? '<path d="M3 2h4v12H3zm6 0h4v12H9z"/>' : '<path d="M3 1.5v13L14 8z"/>';
    $('play').setAttribute('aria-label', playing ? '暂停' : '播放');
    big.hidden = playing || !ready;
  }

  function ensureAudio() {
    if (live) return live;
    try {
      live = PF.audio.createLive();
      live.master.gain.value = muted ? 0 : PF.audio.GAIN;
    } catch (e) {
      live = null;
    }
    return live;
  }
  function play() {
    if (!ready) return;
    if (poster || t >= DURATION - 0.05) { poster = false; t = 0; }
    playing = true;
    const a = ensureAudio();
    if (a) {
      a.ctx.resume().catch(() => {});
      a.start(t);
    }
    perf0 = performance.now();
    perfT0 = t;
    syncUI();
  }
  function pause() {
    playing = false;
    if (live) live.stop();
    syncUI();
    draw();
  }
  function goTo(nt) {
    poster = false;
    t = Math.max(0, Math.min(DURATION - 0.001, nt));
    if (playing) {
      if (live) live.start(t);
      perf0 = performance.now();
      perfT0 = t;
    }
    syncUI();
    draw();
  }
  const toggle = () => (playing ? pause() : play());

  function frame() {
    if (playing) {
      const audioOk = live && live.ctx.state === 'running';
      t = audioOk ? live.time() : perfT0 + (performance.now() - perf0) / 1000;
      if (audioOk) live.pump();
      if (t >= DURATION) {
        t = DURATION - 0.001;
        pause();
      }
      draw();
      syncUI();
    }
    requestAnimationFrame(frame);
  }
  setInterval(() => { if (playing && live) live.pump(1.0); }, 200);

  big.addEventListener('click', play);
  $('play').addEventListener('click', toggle);
  cv.addEventListener('click', () => { if (ready) toggle(); });
  seek.addEventListener('input', () => goTo(parseFloat(seek.value)));
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteState.textContent = muted ? '关' : '开';
    if (live) live.master.gain.value = muted ? 0 : PF.audio.GAIN;
  });
  $('fs').addEventListener('click', () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else stage.requestFullscreen().catch(() => {});
    } catch (e) { /* fullscreen is optional */ }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') goTo(t + 5);
    else if (e.key === 'ArrowLeft') goTo(t - 5);
    else if (e.key === 'm' || e.key === 'M') muteBtn.click();
    else if (e.key === 'f' || e.key === 'F') $('fs').click();
  });
  document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));
  new ResizeObserver(resize).observe(cv);

  syncUI();
  draw();
  PF.ready().then(() => {
    ready = true;
    status.hidden = true;
    syncUI();
    resize();
  });
  requestAnimationFrame(frame);
})();
