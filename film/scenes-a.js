// 证明之战 — scenes 0–2: prologue, the challenge, title drop
(function () {
  'use strict';
  const PF = window.PF;
  const { W, H, C, F, E, clamp, lerp, prog } = PF;
  PF.strings = PF.strings || [];
  const S = (s) => (PF.strings.push(s), s);
  // HUD copy lives in the engine; register it so its glyphs are preloaded
  S('证明之战 · THE PROVING'); S('分支 claude/confident-franklin-rhs0f4');
  S('序章 PROLOGUE 片名 TITLE 01 读 READ 02 想 THINK 03 做 MAKE 04 验 VERIFY 终证 PROOF 片尾 END');
  S('morph 顶点 0123456789/·');

  // ---------------------------------------------------------------- S0 序
  const V = {
    label: S('你说'),
    hello: S('哈喽哈喽。'),
    cmd1: S('$ git log --oneline'),
    out1a: S('e71e248'),
    out1b: S('Initial commit'),
    cmd2: S('$ ls -A'),
    out2: S('.gitignore    LICENSE'),
    stats: [
      [S('2'), S('个文件')],
      [S('1'), S('次提交')],
      [S('0'), S('行代码')],
    ],
    caption: S('一个空仓库。'),
  };
  // typing schedule, shared with the soundtrack for key clicks
  const T0 = {
    hello: [0.8, 5],
    cmd1: [2.6, 18],
    cmd2: [4.6, 18],
    caption: [8.4, 7],
  };

  PF.scenes.push({
    id: 'void', t0: 0, t1: 12, ground: C.ink, fg: C.paper, chapter: '序章 PROLOGUE',
    types: [
      [V.hello, ...T0.hello],
      [V.cmd1, ...T0.cmd1],
      [V.cmd2, ...T0.cmd2],
      [V.caption, ...T0.caption],
    ],
    draw(ctx, lt) {
      const X = 240;
      const exit = (k) => 1 - E.inCubic(prog(lt, 10.0 + k * 0.07, 10.55 + k * 0.07));
      const lift = (k) => -40 * E.inCubic(prog(lt, 10.0 + k * 0.07, 10.55 + k * 0.07));

      ctx.globalAlpha = prog(lt, 0.3, 0.7) * exit(0);
      PF.text(ctx, V.label, X, 300 + lift(0), F.mono(18), C.grey, 'left', 'alphabetic', 2);

      const hello = PF.typed(V.hello, lt, ...T0.hello);
      ctx.globalAlpha = exit(0);
      PF.text(ctx, hello, X, 410 + lift(0), F.sans(96, 700), C.paper);

      const mono = F.mono(28);
      const c1 = PF.typed(V.cmd1, lt, ...T0.cmd1);
      ctx.globalAlpha = exit(1);
      PF.text(ctx, c1, X, 520 + lift(1), mono, C.paper);
      const o1 = E.outCubic(prog(lt, 3.9, 4.2));
      ctx.globalAlpha = o1 * exit(1);
      PF.text(ctx, V.out1a, X + 12 * (1 - o1), 566 + lift(1), mono, C.yellow);
      PF.text(ctx, V.out1b, X + 12 * (1 - o1) + PF.measure(ctx, V.out1a + '  ', mono), 566 + lift(1), mono, C.paper);

      const c2 = PF.typed(V.cmd2, lt, ...T0.cmd2);
      ctx.globalAlpha = exit(2);
      PF.text(ctx, c2, X, 636 + lift(2), mono, C.paper);
      const o2 = E.outCubic(prog(lt, 5.2, 5.5));
      ctx.globalAlpha = o2 * exit(2);
      PF.text(ctx, V.out2, X + 12 * (1 - o2), 682 + lift(2), mono, C.paper);

      // three honest numbers
      V.stats.forEach(([n, label], k) => {
        const t0 = 6.5 + k * 0.5;
        const p = prog(lt, t0, t0 + 0.45);
        if (p <= 0) return;
        const x = 1160 + k * 230, y = 640 + lift(3 + k);
        const s = lerp(0.6, 1, E.outBack(p));
        ctx.save();
        ctx.globalAlpha = clamp(p * 3) * exit(3 + k);
        ctx.translate(x, y);
        ctx.scale(s, s);
        PF.text(ctx, n, 0, 0, F.display(200), k === 2 ? C.yellow : C.paper, 'left');
        ctx.restore();
        ctx.globalAlpha = prog(lt, t0 + 0.15, t0 + 0.5) * exit(3 + k);
        PF.text(ctx, label, x + 4, y + 48, F.sans(26, 700), C.grey, 'left');
      });

      const cap = PF.typed(V.caption, lt, ...T0.caption);
      ctx.globalAlpha = exit(6);
      PF.text(ctx, cap, X, 860 + lift(6), F.serif(72), C.paper);
      ctx.globalAlpha = 1;

      // the cursor follows whatever is being typed, then travels to scene 1
      let cx, cy, cw, ch, solid = false;
      const after = (str, font, x, y, w, h) => [x + PF.measure(ctx, str, font) + 10, y, w, h];
      if (lt < 2.6) {
        [cx, cy, cw, ch] = after(hello, F.sans(96, 700), X, 424, 46, 96);
        solid = lt > 0.8 && lt < 1.9;
      } else if (lt < 4.6) {
        [cx, cy, cw, ch] = after(c1, mono, X, 528, 18, 34);
        solid = lt < 3.8;
      } else if (lt < 8.4) {
        [cx, cy, cw, ch] = after(c2, mono, X, 644, 18, 34);
        solid = lt < 5.1;
      } else {
        [cx, cy, cw, ch] = after(cap, F.serif(72), X, 874, 36, 72);
        solid = lt < 9.4;
      }
      const mv = E.inOutCubic(prog(lt, 10.5, 11.7));
      if (mv > 0) {
        cx = lerp(cx, 200, mv);
        cy = lerp(cy, 342, mv);
        cw = lerp(cw, 38, mv);
        ch = lerp(ch, 76, mv);
        solid = mv < 1;
      }
      PF.cursor(ctx, cx, cy, cw, ch, lt, C.paper, solid);
    },
  });

  // ---------------------------------------------------------------- S1 题
  const Q = {
    label: S('你说 · 第 2 条消息'),
    lines: [
      { s: S('所以接下来你跟着我做了这么多事情的经验'), y: 330, t0: 12.15, cps: 12 },
      { s: S('制作一段120秒动态图形短片，'), y: 440, t0: 14.0, cps: 12 },
      { s: S('展现你作为动态设计师出众的能力，'), y: 550, t0: 15.6, cps: 12 },
      { s: S('就当你的证明之战。'), y: 660, t0: 17.3, cps: 10 },
    ],
    note1: S('注：此前的“经验” = 1 句“哈喽哈喽” + 1 个空仓库。'),
    note2: S('那就从零开始证明。'),
  };
  // [line, substring, time, style]
  const marks = [
    [1, '120秒', 18.5, 'yellow'],
    [1, '动态图形', 19.0, 'under'],
    [2, '出众的能力', 19.5, 'under'],
    [3, '证明之战', 20.0, 'blue'],
  ];

  PF.scenes.push({
    id: 'challenge', t0: 12, t1: 24, ground: C.ink, fg: C.paper, chapter: '序章 PROLOGUE',
    types: [...Q.lines.map((l) => [l.s, l.t0, l.cps]), [Q.note1, 20.6, 40], [Q.note2, 21.5, 20]],
    draw(ctx, lt, t) {
      const X = 200, font = F.sans(76, 700);
      // zoom through the blue box of 证明之战
      const L3 = Q.lines[3];
      const pre = PF.measure(ctx, '就当你的', font);
      const segW = PF.measure(ctx, '证明之战', font);
      const box = { x: X + pre - 28, y: L3.y - 70, w: segW + 56, h: 96 };
      const zp = prog(t, 22.4, 24.0);
      if (zp > 0) {
        const s = Math.pow(90, E.inCubic(zp));
        const fx = box.x + 14, fy = box.y + box.h / 2;
        const c = E.outCubic(prog(t, 22.4, 23.2));
        ctx.translate(W / 2, H / 2);
        ctx.scale(s, s);
        ctx.translate(-lerp(W / 2, fx, c), -lerp(H / 2, fy, c));
      }

      ctx.globalAlpha = prog(t, 12.0, 12.4);
      PF.text(ctx, Q.label, X, 240, F.mono(18), C.grey, 'left', 'alphabetic', 2);

      const dim = 1 - 0.7 * E.inOutCubic(prog(t, 20.5, 21.1));
      let cur = null;
      Q.lines.forEach((l, i) => {
        const s = PF.typed(l.s, t, l.t0, l.cps);
        ctx.globalAlpha = dim;
        PF.text(ctx, s, X, l.y, font, C.paper);
        if (t >= l.t0 - 0.2 && s.length < Array.from(l.s).length + 1) cur = { x: X + PF.measure(ctx, s, font) + 10, y: l.y + 12, typing: s.length < Array.from(l.s).length };
      });
      ctx.globalAlpha = 1;

      marks.forEach(([li, sub, tm, style]) => {
        const p = E.outExpo(prog(t, tm, tm + 0.35));
        if (p <= 0) return;
        const l = Q.lines[li];
        const idx = l.s.indexOf(sub);
        const x0 = X + PF.measure(ctx, l.s.slice(0, idx), font);
        const w = PF.measure(ctx, sub, font);
        let r;
        if (style === 'blue') r = box;
        else r = { x: x0 - 10, y: l.y - 68, w: w + 20, h: 90 };
        if (style === 'under') {
          ctx.fillStyle = C.yellow;
          ctx.fillRect(x0, l.y + 14, w * p, 8);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x0 - 4, l.y - 90, w + 8, 120);
          ctx.clip();
          PF.text(ctx, l.s, X, l.y, font, C.paper);
          ctx.restore();
          return;
        }
        ctx.fillStyle = style === 'blue' ? C.blue : C.yellow;
        ctx.fillRect(r.x, r.y, r.w * p, r.h);
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w * p, r.h);
        ctx.clip();
        PF.text(ctx, l.s, X, l.y, font, style === 'blue' ? C.paper : C.ink);
        ctx.restore();
      });

      const n1 = PF.typed(Q.note1, t, 20.6, 40);
      const n2 = PF.typed(Q.note2, t, 21.5, 20);
      PF.text(ctx, n1, X, 790, F.mono(24), C.grey);
      PF.text(ctx, n2, X, 840, F.mono(24, 700), C.yellow);

      if (t < 12.15) cur = { x: 200, y: 342, typing: false };
      if (t > 21.5 && t < 22.4) cur = { x: X + PF.measure(ctx, n2, F.mono(24, 700)) + 8, y: 846, small: true, typing: t < 22.0 };
      if (cur && t < 22.4) {
        if (cur.small) PF.cursor(ctx, cur.x, cur.y, 14, 30, t, C.yellow, cur.typing);
        else PF.cursor(ctx, cur.x, cur.y, 38, 76, t, C.paper, cur.typing);
      }
      if (zp > 0.97) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = C.blue;
        ctx.fillRect(0, 0, W, H);
      }
    },
  });

  // ---------------------------------------------------------------- S2 片名
  const TT = {
    title: S('证明之战'),
    en: S('THE PROVING'),
    sub: S('120 秒 · 3600 帧 · 60 小节 · 全部由代码生成'),
  };
  const N = 7000;
  PF.N = N;
  let burst = null;
  PF.prepare = PF.prepare || [];
  PF.prepare.push(() => {
    const pts = PF.sample('title', (g) => {
      g.font = F.serif(260);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(TT.title, W / 2, 440);
    }, 5);
    const target = PF.fit(pts, N, 11);
    const r = PF.rng(23);
    const b = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) {
      const a = r() * Math.PI * 2, R = 250 + Math.pow(r(), 0.7) * 950;
      b[i * 6] = W / 2 + Math.cos(a) * R;
      b[i * 6 + 1] = H / 2 + Math.sin(a) * R * 0.75;
      b[i * 6 + 2] = r() * 0.45; // converge delay
      b[i * 6 + 3] = r() < 0.5 ? -1 : 1; // swirl direction
      b[i * 6 + 4] = target[i * 2];
      b[i * 6 + 5] = target[i * 2 + 1];
    }
    burst = b;
    PF.titleTarget = target;
  });

  PF.rings = function (ctx, t, cx, cy, color, from) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const tk = PF.lastKick(t - k * PF.BEAT);
      const age = t - tk;
      if (tk < from || age > 1.5 || age < 0) continue;
      const q = age / 1.5;
      ctx.globalAlpha = 0.3 * (1 - q);
      ctx.beginPath();
      ctx.arc(cx, cy, 80 + 900 * E.outCubic(q), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  PF.dial = function (ctx, t, cx, cy, r, color, appear) {
    const bar = Math.floor(t / PF.BAR);
    for (let k = 0; k < 60; k++) {
      const vis = prog(appear, k / 60, k / 60 + 0.05);
      if (vis <= 0) continue;
      const a = -Math.PI / 2 + (k / 60) * Math.PI * 2;
      const len = k % 4 === 0 ? 26 : 12;
      ctx.globalAlpha = (k <= bar ? 0.85 : 0.22) * vis;
      ctx.strokeStyle = k === bar ? C.yellow : color;
      ctx.lineWidth = k === bar ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  PF.scenes.push({
    id: 'title', t0: 24, t1: 32, ground: C.blue, fg: C.paper, chapter: '片名 TITLE',
    types: [[TT.sub, 27.1, 40]],
    draw(ctx, lt, t) {
      PF.rings(ctx, t, W / 2, 440, C.paper, 24.4);
      PF.dial(ctx, t, W / 2, 540, 452, C.paper, prog(t, 24.6, 25.8));

      // particles: burst, then converge into the title
      const pa = 1 - prog(t, 26.2, 26.7);
      if (pa > 0 && burst) {
        const ob = E.outExpo(prog(t, 24.0, 24.7));
        const gold = [];
        ctx.globalAlpha = pa;
        ctx.fillStyle = C.paper;
        for (let i = 0; i < N; i++) {
          const o = i * 6;
          const bx = lerp(W / 2, burst[o], ob), by = lerp(440, burst[o + 1], ob);
          const pc = E.inOutCubic(prog(t, 24.45 + burst[o + 2], 25.55 + burst[o + 2]));
          const tx = burst[o + 4], ty = burst[o + 5];
          const sw = Math.sin(Math.PI * pc) * 0.25 * burst[o + 3];
          const x = lerp(bx, tx, pc) - (ty - by) * sw;
          const y = lerp(by, ty, pc) + (tx - bx) * sw;
          if (i % 13 === 0) gold.push(x, y);
          else ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
        }
        ctx.fillStyle = C.yellow;
        for (let k = 0; k < gold.length; k += 2) ctx.fillRect(gold[k] - 1.6, gold[k + 1] - 1.6, 3.2, 3.2);
        ctx.globalAlpha = 1;
      }
      const ta = prog(t, 26.2, 26.6);
      if (ta > 0) {
        ctx.globalAlpha = ta;
        PF.text(ctx, TT.title, W / 2, 440, F.serif(260), C.paper, 'center', 'middle');
        ctx.globalAlpha = 1;
      }

      // THE PROVING — letters rise out of a mask
      const ef = F.display(120), sp = 30;
      const total = PF.measure(ctx, TT.en, ef, sp) - sp;
      let x = W / 2 - total / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 745 - 112, W, 124);
      ctx.clip();
      Array.from(TT.en).forEach((ch, k) => {
        const p = E.outExpo(prog(t, 26.3 + k * 0.045, 27.0 + k * 0.045));
        PF.text(ctx, ch, x, 745 + 130 * (1 - p), ef, C.paper, 'left');
        x += PF.measure(ctx, ch, ef) + sp;
      });
      ctx.restore();

      ctx.globalAlpha = 0.85;
      PF.text(ctx, PF.typed(TT.sub, t, 27.1, 40), W / 2, 830, F.mono(22), C.paper, 'center', 'alphabetic', 1);
      ctx.globalAlpha = 1;

      const fl = 1 - prog(t, 24.0, 24.18);
      if (fl > 0 && t >= 24) {
        ctx.globalAlpha = fl * 0.9;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    },
  });
})();
