// 证明之战 — scenes 6–8: 验 (verify), the proof, the end
(function () {
  'use strict';
  const PF = window.PF;
  const { W, H, C, F, E, clamp, lerp, prog } = PF;
  const S = (s) => (PF.strings.push(s), s);

  // ---------------------------------------------------------------- S6 验
  const Vf = {
    ch: S('验'), name: S('验 · VERIFY'), line: S('证据胜于宣称。'),
    frame: S('FRAME'), of: S('/ 3600'),
    rows: [
      [S('时长'), S('120.00 秒')], [S('帧率'), S('30 fps · 3600 帧')], [S('画幅'), S('1920 × 1080')],
      [S('节拍'), S('120 BPM · 60 小节')], [S('外部素材'), S('0 个')], [S('字体'), S('4 款 Google Fonts')],
      [S('声音'), S('Web Audio 实时合成')], [S('可复现'), S('同一个 t → 同一帧')],
    ],
  };
  PF.checkTimes = Vf.rows.map((_, k) => 82 + k);
  // [ground, text, text colour, caption, serif?]
  const SHOTS = [
    [C.paper, S('读'), C.ink, S('READ'), 1], [C.blue, S('想'), C.paper, S('THINK'), 1],
    [C.yellow, S('做'), C.ink, S('MAKE'), 1], [C.ink, S('验'), C.paper, S('VERIFY'), 1],
    [C.blue, '120', C.paper, S('秒'), 0], [C.yellow, '3600', C.ink, S('帧'), 0],
    [C.paper, '60', C.ink, S('小节'), 0], [C.ink, '0', C.yellow, S('外部素材'), 0],
    [C.yellow, '7000', C.ink, S('粒子'), 0], [C.paper, '9', C.ink, S('场景'), 0],
    [C.blue, '4', C.paper, S('章'), 0], [C.ink, '1', C.paper, S('次挑战'), 0],
  ];
  const shotAt = (t) => (t >= 90 && t < 96 ? SHOTS[Math.floor((t - 90) / 0.5)] : null);

  PF.scenes.push({
    id: 'verify', t0: 80, t1: 96, ground: C.ink, fg: C.paper, chapter: '04 验 VERIFY',
    tin: { type: 'iris', x: PF.makeIris.x, y: PF.makeIris.y, lead: 0.8, dur: 0.8 },
    fgAt: (t) => {
      const s = shotAt(t);
      return s ? (s[0] === C.ink || s[0] === C.blue ? C.paper : C.ink) : C.paper;
    },
    types: [[Vf.line, 80.8, 16]],
    draw(ctx, lt, t) {
      const shot = shotAt(t);
      if (shot) {
        const k = Math.floor((t - 90) / 0.5), u = (t - 90 - k * 0.5) / 0.5;
        ctx.fillStyle = shot[0];
        ctx.fillRect(0, 0, W, H);
        const s = lerp(1.12, 1, E.outExpo(clamp(u * 1.4)));
        ctx.save();
        ctx.translate(W / 2, 500);
        ctx.scale(s, s);
        PF.text(ctx, shot[1], 0, 0, shot[4] ? F.serif(560) : F.display(560), shot[2], 'center', 'middle');
        ctx.restore();
        PF.text(ctx, shot[3], W / 2, 900, shot[4] ? F.mono(30, 700) : F.sans(40, 700), shot[2], 'center', 'alphabetic', shot[4] ? 12 : 4);
        return;
      }

      // 验 arrives with a decaying glitch, then retreats behind the counter
      const gl = 1 - prog(t, 80.0, 80.9);
      const mv = E.inOutCubic(prog(t, 81.2, 81.9));
      const gx = lerp(960, 1400, mv), gy = lerp(540, 600, mv), gs = lerp(1, 0.9, mv);
      ctx.save();
      ctx.globalAlpha = lerp(1, 0.07, mv);
      ctx.translate(gx, gy);
      ctx.scale(gs, gs);
      const f = Math.floor(t * PF.FPS);
      const bands = 12, bh = 700 / bands;
      for (let j = 0; j < bands; j++) {
        const off = gl > 0 ? (PF.hash(f * 13 + j) - 0.5) * 160 * gl : 0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(-400, -350 + j * bh, 800, bh + 0.5);
        ctx.clip();
        if (gl > 0.05) {
          PF.text(ctx, Vf.ch, off - 14 * gl, 0, F.serif(600), C.blue, 'center', 'middle');
          PF.text(ctx, Vf.ch, off + 14 * gl, 0, F.serif(600), C.yellow, 'center', 'middle');
        }
        PF.text(ctx, Vf.ch, off, 0, F.serif(600), C.paper, 'center', 'middle');
        ctx.restore();
      }
      ctx.restore();

      PF.card(ctx, t, 80.4, '04', Vf.name, Vf.line, C.yellow, C.paper);

      // checklist, one row every two beats
      Vf.rows.forEach(([label, value], k) => {
        const tk = PF.checkTimes[k];
        const p = E.outExpo(prog(t, tk, tk + 0.4));
        if (p <= 0) return;
        const y = 370 + k * 72, x = 120 - 30 * (1 - p);
        ctx.globalAlpha = p;
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y - 30, 36, 36);
        PF.text(ctx, label, x + 64, y, F.sans(30, 700), C.paper);
        PF.text(ctx, value, x + 250, y - 2, F.mono(22), C.yellow);
        const c = prog(t, tk + 0.2, tk + 0.45);
        if (c > 0) {
          const pts = [[x + 7, y - 13], [x + 16, y - 3], [x + 38, y - 34]];
          const L1 = Math.hypot(9, 10), L2 = Math.hypot(22, 31), L = (L1 + L2) * c;
          ctx.strokeStyle = C.yellow;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          if (L <= L1) ctx.lineTo(lerp(pts[0][0], pts[1][0], L / L1), lerp(pts[0][1], pts[1][1], L / L1));
          else {
            ctx.lineTo(pts[1][0], pts[1][1]);
            const q = (L - L1) / L2;
            ctx.lineTo(lerp(pts[1][0], pts[2][0], q), lerp(pts[1][1], pts[2][1], q));
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      // the film counting its own frames
      const ra = E.outCubic(prog(t, 81.4, 82.0));
      if (ra > 0) {
        const cx = 1400, cy = 600, r = 250;
        ctx.globalAlpha = ra;
        ctx.strokeStyle = C.paper;
        ctx.globalAlpha = 0.15 * ra;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = ra;
        ctx.strokeStyle = C.yellow;
        ctx.lineWidth = 8;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (t / PF.DURATION) * ra);
        ctx.stroke();
        PF.dial(ctx, t, cx, cy, r + 22, C.paper, ra);
        ctx.globalAlpha = 0.6 * ra;
        PF.text(ctx, Vf.frame, cx, cy - 92, F.mono(18, 700), C.paper, 'center', 'alphabetic', 6);
        ctx.globalAlpha = ra;
        PF.text(ctx, String(Math.floor(t * PF.FPS + 1e-6)), cx, cy + 58, F.display(180), C.paper, 'center');
        ctx.globalAlpha = 0.6 * ra;
        PF.text(ctx, Vf.of, cx, cy + 110, F.mono(22), C.paper, 'center');
        // scope: the kick envelope drawn as a signal
        ctx.globalAlpha = 0.7 * ra;
        ctx.strokeStyle = C.paper;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const amp = 8 + 34 * PF.pulse(t, 6);
        for (let i = 0; i <= 120; i++) {
          const x = 1150 + (500 * i) / 120;
          const win = Math.sin((Math.PI * i) / 120);
          const y = 942 + Math.sin(i * 0.55 - t * 24) * amp * win * (0.6 + 0.4 * Math.sin(i * 0.13 + t * 3));
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
  });

  // ---------------------------------------------------------------- S7 证
  const P7 = {
    caps: [S('秒 · 片长'), S('帧 · 每一帧都由 render(t) 画出'), S('小节 · 120 BPM'), S('外部素材 · 画面与声音全部由代码生成')],
    qed: S('Q.E.D.'), mark: S('证毕符号'),
    orbit: [S('读'), S('想'), S('做'), S('验')],
  };
  const SH = ['scatter', '120', '3600', '60', '0', S('证毕'), 'square'];
  const MT = [96, 96, 98, 100, 102, 104, 108]; // MT[k]: time shape k is formed toward
  let targets = null, sgn = null;
  PF.prepare.push(() => {
    const N = PF.N, r = PF.rng(97);
    const scatter = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      scatter[2 * i] = r() * W;
      scatter[2 * i + 1] = r() * H;
    }
    const txt = (key, font, str) =>
      PF.fit(PF.sample(key, (g) => {
        g.font = font;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(str, W / 2, 490);
      }, 4), N, key.length * 31 + 5);
    targets = [
      scatter,
      txt('n120', F.display(560), '120'),
      txt('n3600', F.display(480), '3600'),
      txt('n60', F.display(560), '60'),
      txt('n0', F.display(600), '0'),
      txt('qed', F.serif(400), SH[5]),
      PF.fit(PF.sample('sq', (g) => g.fillRect(W / 2 - 100, 400, 200, 200), 4), N, 3),
    ];
    sgn = new Float32Array(N);
    for (let i = 0; i < N; i++) sgn[i] = r() < 0.5 ? -1 : 1;
  });

  const CURSOR8 = { x: 200, y: 540, w: 38, h: 76 };

  PF.scenes.push({
    id: 'proof', t0: 96, t1: 112, ground: C.blue, fg: C.paper, chapter: '终证 PROOF',
    draw(ctx, lt, t) {
      const dark = E.inOutCubic(prog(t, 110.0, 111.6));
      PF.rings(ctx, t, W / 2, 490, C.paper, 96);

      const orb = Math.min(prog(t, 96.3, 97.0), 1 - prog(t, 103.4, 104.2));
      const orbit = (front) => {
        if (orb <= 0) return;
        P7.orbit.forEach((ch, k) => {
          const a = ((t - 96) * Math.PI * 2) / 8 + (k * Math.PI) / 2;
          const z = Math.sin(a);
          if (front !== z >= 0) return;
          const d = (z + 1) / 2;
          ctx.globalAlpha = orb * (0.25 + 0.75 * d);
          PF.text(ctx, ch, W / 2 + Math.cos(a) * 820, 490 + z * 180, F.serif(Math.round(60 + 64 * d)), C.paper, 'center', 'middle');
        });
        ctx.globalAlpha = 1;
      };
      orbit(false);

      // particles morphing through the numbers that prove the claim
      const pa = 1 - prog(t, 109.0, 109.6);
      if (pa > 0 && targets) {
        let m = 1;
        for (let k = 1; k < MT.length; k++) if (t >= MT[k]) m = k;
        const A = targets[m === 1 ? 0 : m - 1], B = targets[m], tm = MT[m];
        const N = PF.N, gold = [];
        ctx.globalAlpha = pa;
        ctx.fillStyle = C.paper;
        for (let i = 0; i < N; i++) {
          const bx = B[2 * i], by = B[2 * i + 1], ax = A[2 * i], ay = A[2 * i + 1];
          const d = 0.3 * (bx / W);
          const p = E.inOutCubic(prog(t, tm + d, tm + d + (m === 1 ? 1.0 : 0.8)));
          const sw = Math.sin(Math.PI * p) * 0.3 * sgn[i];
          let x = lerp(ax, bx, p) - (by - ay) * sw;
          let y = lerp(ay, by, p) + (bx - ax) * sw;
          x += Math.sin(t * 2.3 + i * 0.7) * 1.2;
          y += Math.cos(t * 1.9 + i * 1.3) * 1.2;
          if (i % 13 === 0) gold.push(x, y);
          else ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
        ctx.fillStyle = C.yellow;
        for (let k = 0; k < gold.length; k += 2) ctx.fillRect(gold[k] - 1.5, gold[k + 1] - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      }
      orbit(true);

      // captions under each figure
      for (let k = 0; k < 4; k++) {
        const t0 = MT[k + 1] + 0.5, t1 = MT[k + 2];
        const p = E.outExpo(prog(t, t0, t0 + 0.5)) * (1 - prog(t, t1 - 0.25, t1));
        if (p <= 0) continue;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 830, W, 80);
        ctx.clip();
        PF.text(ctx, P7.caps[k], W / 2, 885 + 60 * (1 - p), F.sans(40, 700), C.paper, 'center');
        ctx.restore();
      }
      const qp = E.outExpo(prog(t, 105.0, 105.7)) * (1 - prog(t, 107.6, 108.0));
      if (qp > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 780, W, 130);
        ctx.clip();
        PF.text(ctx, P7.qed, W / 2, 890 + 110 * (1 - qp), F.display(110), C.yellow, 'center', 'alphabetic', 18);
        ctx.restore();
      }

      if (dark > 0) {
        ctx.globalAlpha = dark;
        ctx.fillStyle = C.ink;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      // the tombstone: solid, then shrinking into the terminal cursor
      const sq = prog(t, 109.0, 109.6);
      if (sq > 0) {
        const m = E.inOutExpo(prog(t, 110.2, 111.6));
        const cx = lerp(W / 2, CURSOR8.x + CURSOR8.w / 2, m), cy = lerp(500, CURSOR8.y - CURSOR8.h / 2, m);
        const w = lerp(200, CURSOR8.w, m), h = lerp(200, CURSOR8.h, m);
        const blink = t > 111.6 && Math.floor(t / PF.BEAT) % 2 === 1;
        if (!blink) {
          ctx.globalAlpha = sq;
          ctx.fillStyle = C.paper;
          ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
        }
        const lp = Math.min(prog(t, 109.3, 109.8), 1 - prog(t, 110.1, 110.4));
        if (lp > 0) {
          ctx.globalAlpha = lp * 0.8;
          ctx.fillStyle = C.yellow;
          ctx.fillRect(W / 2 - 64, 671, 14, 14);
          PF.text(ctx, P7.mark, W / 2 - 38, 686, F.mono(20, 700), C.paper, 'left', 'alphabetic', 2);
        }
        ctx.globalAlpha = 1;
      }
    },
  });

  // ---------------------------------------------------------------- S8 终
  const O = {
    push: S('$ git push -u origin claude/confident-franklin-rhs0f4'),
    done: S('→ 已推送到 origin/claude/confident-franklin-rhs0f4'),
    title: S('证明之战'),
    credit: S('导演 · 设计 · 编码 · 作曲 —— Claude'),
    asked: S('出题 —— 你'),
    next: S('下一题？'),
  };
  PF.scenes.push({
    id: 'end', t0: 112, t1: 120, ground: C.ink, fg: C.paper, chapter: '片尾 END',
    types: [[O.push, 112.6, 30], [O.credit, 116.2, 40], [O.asked, 117.0, 30], [O.next, 117.6, 8]],
    draw(ctx, lt, t) {
      const fade = 1 - prog(t, 119.0, 119.7);
      const mono = F.mono(30);
      const X = CURSOR8.x;
      const cmd = PF.typed(O.push, t, 112.6, 30);
      ctx.globalAlpha = fade;
      PF.text(ctx, cmd, X, 530, mono, C.paper);
      const dp = E.outCubic(prog(t, 114.8, 115.1));
      ctx.globalAlpha = dp * fade;
      PF.text(ctx, O.done, X + 12 * (1 - dp), 584, F.mono(24), C.yellow);

      const tp = E.outExpo(prog(t, 115.4, 116.1));
      if (tp > 0) {
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.rect(X - 10, 660, 1000, 150);
        ctx.clip();
        PF.text(ctx, O.title, X, 790 + 140 * (1 - tp), F.serif(120), C.paper);
        ctx.restore();
      }
      ctx.globalAlpha = 0.75 * fade;
      PF.text(ctx, PF.typed(O.credit, t, 116.2, 40), X, 862, F.mono(20), C.paper, 'left', 'alphabetic', 1);
      PF.text(ctx, PF.typed(O.asked, t, 117.0, 30), X, 900, F.mono(20), C.paper, 'left', 'alphabetic', 1);
      ctx.globalAlpha = fade;
      const nx = PF.typed(O.next, t, 117.6, 8);
      PF.text(ctx, nx, 1720, 790, F.sans(72, 700), C.yellow, 'right');
      ctx.globalAlpha = 1;

      // one cursor carries the whole ending
      let cx, cy, cw, ch, solid;
      if (t < 112.6) [cx, cy, cw, ch, solid] = [X, CURSOR8.y, CURSOR8.w, CURSOR8.h, false];
      else if (t < 117.6) {
        const g = E.outCubic(prog(t, 112.6, 112.8));
        [cx, cy, cw, ch] = [X + PF.measure(ctx, cmd, mono) + 8, lerp(CURSOR8.y, 538, g), lerp(CURSOR8.w, 18, g), lerp(CURSOR8.h, 36, g)];
        solid = t < 114.4;
      } else {
        [cx, cy, cw, ch] = [1730, 804, 36, 74];
        solid = t < 118.2;
      }
      if (t >= 119.92) return;
      PF.cursor(ctx, cx, cy, cw, ch, t, t >= 117.6 ? C.yellow : C.paper, solid);
    },
  });
})();
