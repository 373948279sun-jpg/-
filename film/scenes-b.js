// 证明之战 — scenes 3–5: 读 (read), 想 (think), 做 (make)
(function () {
  'use strict';
  const PF = window.PF;
  const { W, H, C, F, E, clamp, lerp, prog } = PF;
  const S = (s) => (PF.strings.push(s), s);

  // Chapter card shared by the four chapters: number, name, one-line principle.
  PF.card = function (ctx, t, t0, num, name, line, numColor, fg, alpha = 1) {
    const p = E.outExpo(prog(t, t0, t0 + 0.6));
    if (p <= 0 || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const lx = 120 + PF.measure(ctx, num, F.display(124)) + 28;
    ctx.beginPath();
    ctx.rect(100, 120, 1100, 140);
    ctx.clip();
    PF.text(ctx, num, 120, 236 + 120 * (1 - p), F.display(124), numColor);
    PF.text(ctx, name, lx, 172 + 60 * (1 - p), F.mono(20, 700), fg, 'left', 'alphabetic', 3);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = alpha;
    PF.text(ctx, PF.typed(line, t, t0 + 0.4, 16), lx, 234, F.sans(44, 700), fg);
    ctx.restore();
  };
  // Big chapter glyph revealed through a moving mask.
  PF.glyph = function (ctx, ch, x, y, size, color, p, dir) {
    if (p <= 0) return;
    ctx.save();
    ctx.beginPath();
    const h = size * 1.1, w = size * 1.1;
    if (dir === 'up') ctx.rect(x - w / 2, y + h / 2 - h * p, w, h * p);
    else ctx.rect(x - w / 2, y - h / 2, w * p, h);
    ctx.clip();
    const off = dir === 'up' ? 80 * (1 - p) : 0;
    PF.text(ctx, ch, x, y + off, F.serif(size), color, 'center', 'middle');
    ctx.restore();
  };

  // ---------------------------------------------------------------- S3 读
  const R = {
    ch: S('读'), name: S('读 · READ'), line: S('先读懂，再动手。'),
    label: S('LICENSE · 201 行 · 11,357 字节'),
    caption: S('每一行，都读过。'),
  };
  const SRC = [
    '### AL ###', '#Template for AL projects for Dynamics 365 Business Central', '#launch.json folder',
    '.vscode/', '#Cache folder', '.alcache/', '#Symbols folder', '.alpackages/', '#Snapshots folder',
    '.snapshots/', '#Testing Output folder', '.output/', '#Extension App-file', '*.app',
    '#Rapid Application Development File', 'rad.json', '#Translation Base-file', '*.g.xlf',
    '#License-file', '*.flf', '#Test results file', 'TestResults.xml', '',
    '                                 Apache License', '                           Version 2.0, January 2004',
    '                        http://www.apache.org/licenses/', '',
    '   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION', '', '   1. Definitions.', '',
    '      "License" shall mean the terms and conditions for use, reproduction,',
    '      and distribution as defined by Sections 1 through 9 of this document.', '',
    '      "Licensor" shall mean the copyright owner or entity authorized by',
    '      the copyright owner that is granting the License.', '',
    '      "Legal Entity" shall mean the union of the acting entity and all',
    '      other entities that control, are controlled by, or are under common',
    '      control with that entity. For the purposes of this definition,',
    '      "control" means (i) the power, direct or indirect, to cause the',
    '      direction or management of such entity, whether by contract or',
    '      otherwise, or (ii) ownership of fifty percent (50%) or more of the',
    '      outstanding shares, or (iii) beneficial ownership of such entity.', '',
    '      "You" (or "Your") shall mean an individual or Legal Entity',
    '      exercising permissions granted by this License.', '',
    '      "Source" form shall mean the preferred form for making modifications,',
    '      including but not limited to software source code, documentation',
    '      source, and configuration files.',
  ];
  // [source line, tag text, x, y] — a tag pops the moment its line passes the reading head
  const TAGS = [
    [0, 'AL', 1010, 250], [1, 'Dynamics 365 Business Central', 1230, 190], [5, '.alcache/', 1560, 330],
    [13, '*.app', 1010, 470], [15, 'rad.json', 1650, 470], [23, 'Apache License', 1120, 620],
    [24, 'Version 2.0 · 2004', 1520, 610], [27, 'TERMS AND CONDITIONS', 1000, 760], [29, 'Definitions', 1560, 750],
    [31, '"License"', 1180, 890], [34, '"Licensor"', 1470, 880], [45, '"You"', 1720, 880],
  ];
  const LL = [47,52,55,0,63,0,18,0,74,75,0,71,55,0,70,73,68,69,68,72,71,0,64,53,0,75,70,38,0,65,67,67,43,0,68,70,66,53,0,73,73,76,77,75,76,44,0,65,73,69,76,75,75,73,74,77,74,72,71,75,0,74,72,48,0,72,70,68,66,72,62,0,69,70,68,75,72,71,65,70,71,65,70,71,67,69,46,0,68,69,68,36,0,59,54,0,70,49,0,69,68,63,68,35,0,66,74,70,70,70,72,68,73,68,73,68,69,72,70,70,35,0,72,70,70,66,72,44,0,73,72,71,63,73,71,49,0,73,73,75,72,0,66,64,66,69,74,67,72,72,76,0,69,69,71,71,73,72,70,70,68,67,58,0,70,68,71,71,71,71,67,66,73,66,0,30,0,58,0,68,67,68,68,66,70,60,49,0,45,0,66,67,42,0,49,0,70,68,75,70,33];
  const LH = 27, HEAD = 600, SPEED = LH * 8, SCROLL0 = 33.4;
  const lineAtHead = (k) => SCROLL0 + (LH * k + 20) / SPEED;
  PF.readTags = TAGS.map((g) => lineAtHead(g[0]));

  PF.scenes.push({
    id: 'read', t0: 32, t1: 48, ground: C.paper, fg: C.ink, chapter: '01 读 READ',
    tin: { type: 'slices', lead: 0.8, dur: 0.9, n: 9 },
    types: [[R.line, 32.4, 16], [R.label, 40.3, 40]],
    draw(ctx, lt, t) {
      const fadeCol = 1 - prog(t, 40.0, 40.5);
      const gA = lerp(1, 0.07, E.inOutCubic(prog(t, 40.0, 41.0)));
      ctx.globalAlpha = gA;
      PF.glyph(ctx, R.ch, 1330, 540, 720, C.ink, E.outExpo(prog(t, 32.0, 32.7)), 'up');
      ctx.globalAlpha = 1;
      PF.card(ctx, t, 32.0, '01', R.name, R.line, C.blue, C.ink, 1 - prog(t, 39.8, 40.3));

      // the reading column
      if (fadeCol > 0) {
        const off = Math.max(0, (t - SCROLL0) * SPEED);
        ctx.save();
        ctx.globalAlpha = prog(t, 33.0, 33.4) * fadeCol;
        ctx.beginPath();
        ctx.rect(100, 380, 820, 600);
        ctx.clip();
        const font = F.mono(15);
        const drawLines = (color) => {
          SRC.forEach((s, k) => {
            const y = 620 + k * LH - off;
            if (y < 360 || y > 1010) return;
            PF.text(ctx, s, 120, y, font, color);
          });
        };
        drawLines(C.ink);
        ctx.fillStyle = C.blue;
        ctx.fillRect(108, HEAD - 21, 800, 30);
        ctx.beginPath();
        ctx.rect(108, HEAD - 21, 800, 30);
        ctx.clip();
        drawLines(C.paper);
        ctx.restore();
        ctx.globalAlpha = 0.5 * prog(t, 33.0, 33.4) * fadeCol;
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.moveTo(92, HEAD - 14); ctx.lineTo(102, HEAD - 6); ctx.lineTo(92, HEAD + 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // tags pulled out of the text, anchored around the glyph
      ctx.font = F.mono(18, 700);
      TAGS.forEach((g, k) => {
        const tk = PF.readTags[k];
        const p = prog(t, tk, tk + 0.3);
        const out = 1 - prog(t, 40.2 + k * 0.03, 40.6 + k * 0.03);
        if (p <= 0 || out <= 0) return;
        const s = E.outBack(p);
        const w = PF.measure(ctx, g[1], F.mono(18, 700)) + 50, h = 40;
        ctx.save();
        ctx.globalAlpha = out;
        ctx.translate(g[2], g[3]);
        ctx.scale(s, s);
        ctx.fillStyle = C.paper;
        ctx.fillRect(0, -h / 2, w, h);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -h / 2, w, h);
        ctx.fillStyle = C.blue;
        ctx.fillRect(14, -5, 10, 10);
        PF.text(ctx, g[1], 34, 1, F.mono(18, 700), C.ink, 'left', 'middle');
        ctx.restore();
      });

      // the file as data: 201 line lengths, horizontal first, then standing up
      if (t >= 40.2) {
        PF.text(ctx, PF.typed(R.label, t, 40.3, 40), 120, 350, F.mono(22, 700), C.ink);
        const sweep = (t - 44.0) / 2.0 * 220 - 10;
        const col = E.inExpo(prog(t, 46.3, 47.3));
        const pul = 1 + 0.08 * PF.pulse(t, 9);
        for (let i = 0; i < LL.length; i++) {
          const len = LL[i];
          if (!len) continue;
          const g = E.outExpo(prog(t, 40.3 + i * 0.004, 41.1 + i * 0.004));
          const q = E.inOutCubic(prog(t, 42.0 + i * 0.003, 42.9 + i * 0.003));
          const hl = t > 44 && t < 46.4 ? Math.max(0, 1 - Math.abs(i - sweep) / 14) : 0;
          const L0 = len * 7 * g, L1 = len * 5.2 * pul * (1 + 0.35 * hl);
          let L = lerp(L0, L1, q);
          const th = lerp(2, 5.6, q);
          let cx = lerp(120 + L0 / 2, 120 + i * 8.4 + 2.8, q);
          let cy = lerp(391 + i * 2.9, 960 - L1 / 2, q);
          if (col > 0) {
            cx = lerp(cx, 960, col);
            cy = lerp(cy, 700, col);
            L *= 1 - col;
          }
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-Math.PI / 2 * q);
          ctx.fillStyle = hl > 0.05 ? C.blue : C.ink;
          ctx.fillRect(-L / 2, -th / 2, L, th);
          ctx.restore();
        }
        const cp = E.outExpo(prog(t, 43.5, 44.1)) * (1 - prog(t, 46.0, 46.4));
        if (cp > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(100, 170, 1200, 110);
          ctx.clip();
          PF.text(ctx, R.caption, 120, 250 + 90 * (1 - cp), F.sans(64, 700), C.ink);
          ctx.restore();
        }
        const dot = prog(t, 46.9, 47.3);
        if (dot > 0) {
          ctx.fillStyle = C.blue;
          ctx.beginPath();
          ctx.arc(960, 700, 16 * E.outBack(dot), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  });

  // ---------------------------------------------------------------- S4 想
  const K = {
    ch: S('想'), name: S('想 · THINK'), line: S('动画的灵魂是时间。'),
    tracks: [S('linear · 匀速 · 机械'), S('ease-in-out · 缓入缓出 · 自然'), S('overshoot · 回弹 · 有生命')],
    axisT: S('时间 →'), axisV: S('位置 ↑'),
  };
  const EASES = [E.linear, E.inOutCubic, E.outBack];
  const NODES = [
    [560, 330, S('120 BPM')], [960, 250, S('30 fps')], [1360, 330, S('3600 帧')], [380, 600, S('D 小调')],
    [960, 540, S('1920×1080')], [1540, 600, S('Canvas 2D')], [700, 820, S('Web Audio')], [1220, 820, S('0 素材')],
  ];
  const EDGES = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [0, 4], [2, 4]];
  PF.nodeTimes = NODES.map((_, k) => 58.0 + k * 0.5);

  PF.scenes.push({
    id: 'think', t0: 48, t1: 64, ground: C.blue, fg: C.paper, chapter: '02 想 THINK',
    tin: { type: 'iris', x: 960, y: 700, lead: 0.7, dur: 0.8 },
    types: [[K.line, 48.4, 16]],
    draw(ctx, lt, t) {
      // blueprint grid drifting
      ctx.strokeStyle = C.paper;
      ctx.globalAlpha = 0.08;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const o = (t * 14) % 60;
      for (let x = -o; x < W; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = -o; y < H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.globalAlpha = lerp(1, 0.1, E.inOutCubic(prog(t, 49.6, 50.3)));
      PF.glyph(ctx, K.ch, 470, 590, 640, C.paper, E.outExpo(prog(t, 48.0, 48.7)), 'right');
      ctx.globalAlpha = 1;
      PF.card(ctx, t, 48.0, '02', K.name, K.line, C.yellow, C.paper, 1 - prog(t, 57.6, 58.0));

      // easing lab: a graph editor on the left, the same curves as motion on the right
      const labIn = E.outCubic(prog(t, 50.0, 50.6));
      const labOut = prog(t, 57.6, 58.1);
      const lab = labIn * (1 - labOut);
      if (lab > 0) {
        ctx.save();
        ctx.globalAlpha = lab;
        ctx.translate(0, 30 * (1 - labIn) + 40 * E.inCubic(labOut));
        const gx = 200, gy = 880, gs = 520;
        ctx.strokeStyle = C.paper;
        ctx.globalAlpha = lab * 0.12;
        ctx.beginPath();
        for (let k = 1; k < 10; k++) {
          ctx.moveTo(gx + (gs * k) / 10, gy); ctx.lineTo(gx + (gs * k) / 10, gy - gs);
          ctx.moveTo(gx, gy - (gs * k) / 10); ctx.lineTo(gx + gs, gy - (gs * k) / 10);
        }
        ctx.stroke();
        ctx.globalAlpha = lab * 0.6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy - gs - 20); ctx.lineTo(gx, gy); ctx.lineTo(gx + gs + 20, gy);
        ctx.stroke();
        PF.text(ctx, K.axisT, gx + gs, gy + 34, F.mono(16), C.paper, 'right');
        PF.text(ctx, K.axisV, gx - 14, gy - gs, F.mono(16), C.paper, 'right');
        const u = t < 51 ? 0 : clamp(((t - 51) % 2) / 1.5);
        EASES.forEach((fn, k) => {
          const d = E.inOutCubic(prog(t, 50.2 + k * 0.35, 51.0 + k * 0.35));
          if (d <= 0) return;
          ctx.globalAlpha = lab * (k === 0 ? 0.5 : 1);
          ctx.strokeStyle = k === 2 ? C.yellow : C.paper;
          ctx.lineWidth = k === 0 ? 2 : 4;
          ctx.setLineDash(k === 0 ? [8, 8] : []);
          ctx.beginPath();
          for (let s = 0; s <= 100 * d; s++) {
            const x = gx + (gs * s) / 100, y = gy - gs * fn(s / 100);
            s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          if (t > 51) {
            ctx.fillStyle = k === 2 ? C.yellow : C.paper;
            ctx.beginPath();
            ctx.arc(gx + gs * u, gy - gs * fn(u), 8, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        if (t > 51) {
          ctx.globalAlpha = lab * 0.5;
          ctx.fillStyle = C.paper;
          ctx.fillRect(gx + gs * u - 1, gy - gs - 40, 2, gs + 40);
        }

        // tracks
        const cyc = Math.floor(Math.max(0, t - 51) / 2);
        EASES.forEach((fn, k) => {
          const y = 440 + k * 170, x0 = 1000, x1 = 1700;
          const ap = prog(t, 50.3 + k * 0.2, 50.8 + k * 0.2);
          ctx.globalAlpha = lab * ap;
          PF.text(ctx, K.tracks[k], x0, y - 56, F.mono(18, k ? 700 : 400), k === 2 ? C.yellow : C.paper);
          ctx.globalAlpha = lab * ap * 0.35;
          ctx.fillStyle = C.paper;
          ctx.fillRect(x0, y - 1, (x1 - x0) * ap, 2);
          ctx.fillRect(x0, y - 12, 2, 24);
          ctx.fillRect(x1, y - 12, 2, 24);
          const pos = (uu) => {
            const v = fn(uu);
            return lerp(x0, x1, cyc % 2 ? 1 - v : v);
          };
          for (let g = 3; g >= 0; g--) {
            const uu = Math.max(0, u - g * 0.035);
            const v = (fn(Math.min(1, uu + 0.01)) - fn(uu)) / 0.01;
            const st = t > 51 && u < 1 ? Math.min(Math.abs(v) * 0.14, 0.55) : 0;
            ctx.globalAlpha = lab * ap * (g ? 0.14 : 1);
            ctx.fillStyle = k === 2 ? C.yellow : C.paper;
            ctx.save();
            ctx.translate(pos(uu), y);
            ctx.scale(1 + st, 1 / (1 + st));
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
        ctx.restore();
      }

      // decisions this film was built on, connected as they were made
      if (t >= 57.9) {
        const con = E.inExpo(prog(t, 62.3, 63.3));
        const P = NODES.map((n) => [lerp(n[0], 960, con), lerp(n[1], 540, con)]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = C.paper;
        EDGES.forEach(([a, b]) => {
          const ts = Math.max(PF.nodeTimes[a], PF.nodeTimes[b]) + 0.1;
          const d = E.inOutCubic(prog(t, ts, ts + 0.4));
          if (d <= 0) return;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.moveTo(P[a][0], P[a][1]);
          ctx.lineTo(lerp(P[a][0], P[b][0], d), lerp(P[a][1], P[b][1], d));
          ctx.stroke();
        });
        const la = 1 - prog(t, 62.1, 62.5);
        NODES.forEach((n, k) => {
          const tk = PF.nodeTimes[k];
          const p = prog(t, tk, tk + 0.35);
          if (p <= 0) return;
          const age = t - tk;
          if (age < 1) {
            ctx.globalAlpha = 0.4 * (1 - age);
            ctx.beginPath();
            ctx.arc(P[k][0], P[k][1], 10 + 60 * E.outCubic(age), 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = C.yellow;
          ctx.beginPath();
          ctx.arc(P[k][0], P[k][1], 11 * E.outBack(p), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = la * clamp(p * 2);
          const lw = PF.measure(ctx, n[2], F.mono(24, 700));
          ctx.fillStyle = C.blue;
          ctx.fillRect(P[k][0] + 18, P[k][1] - 20, lw + 14, 38);
          PF.text(ctx, n[2], P[k][0] + 24, P[k][1] + 8, F.mono(24, 700), C.paper);
        });
        ctx.globalAlpha = 1;
      }
    },
  });

  // ---------------------------------------------------------------- S5 做
  const M = {
    ch: S('做'), name: S('做 · MAKE'), line: S('一次一个提交。'),
    main: S('main'), init: S('e71e248  Initial commit'),
    branch: S('claude/confident-franklin-rhs0f4'),
    commits: [
      S('分镜：9 场 · 120 秒'), S('引擎：同一个 t，同一帧'), S('粒子：7000 个点'),
      S('音轨：Web Audio 合成'), S('导出：3600 帧 → MP4'),
    ],
    head: S('HEAD'),
    shapes: [S('圆'), S('方'), S('三角'), S('六边'), S('星'), S('十字')],
  };
  const NV = 120;
  const poly = (n, rot, inner) => {
    const v = [];
    const m = inner ? n * 2 : n;
    for (let k = 0; k < m; k++) {
      const a = rot + (k / m) * Math.PI * 2;
      const r = inner && k % 2 ? inner : 1;
      v.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return v;
  };
  const cross = () => {
    const a = 0.34, b = 1;
    return [[a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a], [-a, -b]];
  };
  // Resample any star-shaped outline at NV evenly spaced angles, so every
  // shape shares the same vertex count and morphs without tangling.
  const radial = (verts) => {
    const out = [];
    for (let s = 0; s < NV; s++) {
      const th = (s / NV) * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
      if (!verts) { out.push([dx, dy]); continue; }
      let best = 0;
      for (let k = 0; k < verts.length; k++) {
        const [ax, ay] = verts[k], [bx, by] = verts[(k + 1) % verts.length];
        const ex = bx - ax, ey = by - ay;
        const den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-9) continue;
        const tt = (ax * ey - ay * ex) / den;
        const uu = (ax * dy - ay * dx) / den;
        if (tt > 0 && uu >= -1e-6 && uu <= 1 + 1e-6) best = Math.max(best, tt);
      }
      out.push([dx * best, dy * best]);
    }
    return out;
  };
  const SHAPES = [
    radial(null), radial(poly(4, Math.PI / 4)), radial(poly(3, -Math.PI / 2)),
    radial(poly(6, 0)), radial(poly(5, -Math.PI / 2, 0.45)), radial(cross()),
  ];
  const SEQ = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 0];
  const shapeState = (t) => {
    const k = clamp(Math.floor((t - 66) / 0.5), -1, SEQ.length - 1);
    if (k < 0) return { k: -1, a: SEQ[0], b: SEQ[0], p: 1, rot: 0 };
    const tk = 66 + k * 0.5;
    const p = E.outBack(prog(t, tk, tk + 0.32));
    return { k, a: SEQ[Math.max(0, k - 1)], b: SEQ[k], p, rot: (Math.max(0, k - 1) + p) * (Math.PI / 4) };
  };
  const drawShape = (ctx, t, cx, cy, R, alpha) => {
    const s = shapeState(t);
    const A = SHAPES[s.a], B = SHAPES[s.b];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(s.rot);
    ctx.beginPath();
    for (let i = 0; i < NV; i++) {
      const x = lerp(A[i][0], B[i][0], s.p) * R, y = lerp(A[i][1], B[i][1], s.p) * R;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = alpha;
    if (s.k % 2 === 0 || R < 60) {
      ctx.fillStyle = C.ink;
      ctx.fill();
    } else {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 14;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
    return s;
  };

  // git graph geometry (world coordinates; the camera pans in x)
  const MAIN_Y = 640, BR_Y = 420, C0 = 300;
  const CX = [560, 820, 1080, 1340, 1600];
  PF.commitTimes = CX.map((_, k) => 73 + k);
  const path = [];
  (function buildPath() {
    const p0 = [C0, MAIN_Y], p1 = [430, MAIN_Y], p2 = [430, BR_Y], p3 = [560, BR_Y];
    for (let s = 0; s <= 40; s++) {
      const u = s / 40, v = 1 - u;
      path.push([
        v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
        v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
      ]);
    }
    for (let x = 580; x <= 1600; x += 20) path.push([x, BR_Y]);
  })();
  const headX = (t) => {
    // the branch reaches commit k exactly when it lands
    let x = C0;
    CX.forEach((cx, k) => {
      const tk = PF.commitTimes[k], from = k ? CX[k - 1] : C0;
      x = t >= tk - 0.5 ? lerp(from, cx, E.inOutCubic(prog(t, tk - 0.5, tk))) : x;
    });
    return x;
  };
  const camX = (t) => Math.max(0, headX(t) - 1250);
  PF.makeIris = { x: CX[4] - (CX[4] - 1250), y: BR_Y };

  PF.scenes.push({
    id: 'make', t0: 64, t1: 80, ground: C.yellow, fg: C.ink, chapter: '03 做 MAKE',
    tin: { type: 'square', x: 960, y: 540, lead: 0.7, dur: 0.9 },
    types: [[M.line, 64.4, 16], ...M.commits.map((c, k) => [c, PF.commitTimes[k], 50])],
    draw(ctx, lt, t) {
      const cam = camX(t);
      // parallax dot field
      ctx.fillStyle = C.ink;
      ctx.globalAlpha = 0.14;
      const ox = (cam * 0.5) % 40;
      for (let x = -ox; x < W; x += 40) for (let y = 20; y < H; y += 40) ctx.fillRect(x, y, 2, 2);
      ctx.globalAlpha = 1;

      PF.card(ctx, t, 64.4, '03', M.name, M.line, C.blue, C.ink, 1 - prog(t, 71.4, 71.9));

      // 做 falls, squashes, settles, then steps aside
      const fall = prog(t, 64.0, 64.32);
      const land = prog(t, 64.32, 65.1);
      const side = E.inOutCubic(prog(t, 65.6, 66.3));
      const gA = 1 - 0.88 * E.inOutCubic(prog(t, 71.4, 72.0));
      if (t >= 64.0) {
        const k = land > 0 ? 1 - E.outElastic(land) : 0;
        const sy = fall < 1 ? 1.14 : 1 - 0.24 * k, sx = fall < 1 ? 0.9 : 1 + 0.2 * k;
        const y = lerp(-420, 560, E.inCubic(fall));
        const x = lerp(960, 380, side), sc = lerp(1, 0.66, side);
        ctx.save();
        ctx.globalAlpha = gA;
        ctx.translate(x, lerp(y + 280, 600 + 280 * sc, side));
        ctx.scale(sx * sc, sy * sc);
        PF.text(ctx, M.ch, 0, -280, F.serif(560), C.ink, 'center', 'middle');
        ctx.restore();
        const sh = prog(t, 64.32, 64.9);
        if (sh > 0 && sh < 1) {
          ctx.globalAlpha = 1 - sh;
          ctx.fillStyle = C.ink;
          const w = 300 + 1200 * E.outExpo(sh);
          ctx.fillRect(960 - w / 2, 842, w, 4);
          ctx.globalAlpha = 1;
        }
      }

      // shape morphs, one per beat, with motion echo
      if (t >= 65.9 && t < 72.2) {
        const into = E.inOutCubic(prog(t, 71.4, 72.0));
        const R = lerp(210 * E.outBack(prog(t, 65.9, 66.3)), 14, into);
        const cx = lerp(1260, C0, into), cy = lerp(580, MAIN_Y, into);
        for (let g = 3; g >= 1; g--) drawShape(ctx, t - g * 0.045, cx, cy, R, 0.12);
        const s = drawShape(ctx, t, cx, cy, R, 1);
        if (s.k >= 0 && into < 0.5) {
          ctx.globalAlpha = 1 - into * 2;
          PF.text(ctx, `morph ${String(s.k + 1).padStart(2, '0')}/12 · ${NV} 顶点 · ${M.shapes[SEQ[s.k]]}`, 1260, 900, F.mono(20, 700), C.ink, 'center');
          ctx.globalAlpha = 1;
        }
      }

      // the branch this film lives on
      if (t >= 71.8) {
        ctx.save();
        ctx.translate(-cam, 0);
        const md = E.inOutCubic(prog(t, 71.8, 72.4));
        ctx.fillStyle = C.ink;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(cam, MAIN_Y - 2, W * md, 4);
        ctx.globalAlpha = md;
        PF.text(ctx, M.main, cam + 120, MAIN_Y - 18, F.mono(18, 700), C.ink);
        ctx.globalAlpha = md * (1 - clamp(cam / 160));
        PF.text(ctx, M.init, C0, MAIN_Y + 56, F.mono(20, 700), C.ink, 'center');
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.ink;
        ctx.beginPath();
        ctx.arc(C0, MAIN_Y, 14, 0, Math.PI * 2);
        ctx.fill();

        const hx = headX(t);
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        let started = false;
        for (const [x, y] of path) {
          if (x > hx + 0.5 && y === BR_Y) break;
          started ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          started = true;
        }
        if (hx > 560) ctx.lineTo(hx, BR_Y);
        if (t > 72.5) ctx.stroke();
        const bp = prog(t, 72.6, 73.2);
        ctx.globalAlpha = bp;
        PF.text(ctx, M.branch, 452, 540, F.mono(16, 700), C.ink);
        ctx.globalAlpha = 1;

        CX.forEach((x, k) => {
          const tk = PF.commitTimes[k];
          const p = prog(t, tk, tk + 0.3);
          if (p <= 0) return;
          let r = 14 * E.outBack(p);
          if (k === 4) r += 26 * E.inOutCubic(prog(t, 78.5, 79.2));
          ctx.fillStyle = C.ink;
          ctx.beginPath();
          ctx.arc(x, BR_Y, r, 0, Math.PI * 2);
          ctx.fill();
          const up = k % 2 === 0;
          PF.text(ctx, PF.typed(M.commits[k], t, tk, 50), x - 10, up ? BR_Y - 44 : BR_Y + 64, F.mono(20, 700), C.ink);
        });
        const hp = E.outBack(prog(t, 77.6, 77.9));
        if (hp > 0) {
          ctx.save();
          ctx.translate(CX[4] + 60, BR_Y - 120);
          ctx.scale(hp, hp);
          ctx.fillStyle = C.ink;
          ctx.fillRect(-4, -26, 104, 40);
          PF.text(ctx, M.head, 48, -6, F.mono(18, 700), C.yellow, 'center', 'middle', 2);
          ctx.restore();
        }
        ctx.restore();
      }
    },
  });
})();
