// 证明之战 — soundtrack
// A 120 BPM score in D minor, synthesised with Web Audio. Every event time is
// derived from the same beat grid and scene timings the picture uses.
(function () {
  'use strict';
  const PF = window.PF;
  const { BEAT, BAR, DURATION } = PF;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // i – VI – III – VII : Dm  Bb  F  C, one chord per bar
  const CHORDS = [[57, 62, 65, 69], [58, 62, 65, 70], [57, 60, 65, 69], [55, 60, 64, 67]];
  const ROOTS = [38, 34, 41, 36];
  const chordAt = (t) => Math.floor(t / BAR) % 4;
  const inR = (t, a, b) => t >= a && t < b;

  // ---------- voices ----------
  function Voices(ctx, chain, noise) {
    const env = (g, t, a, peak, d, sus = 0.0001) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d);
    };
    const out = (node, dry = 1, rev = 0, dly = 0) => {
      if (dry) { const g = ctx.createGain(); g.gain.value = dry; node.connect(g); g.connect(chain.dry); }
      if (rev) { const g = ctx.createGain(); g.gain.value = rev; node.connect(g); g.connect(chain.rev); }
      if (dly) { const g = ctx.createGain(); g.gain.value = dly; node.connect(g); g.connect(chain.dly); }
    };
    const noiseSrc = (t, dur, seed) => {
      const s = ctx.createBufferSource();
      s.buffer = noise;
      s.loop = true;
      s.start(t, PF.hash(seed) * 1.5, dur + 0.05);
      return s;
    };
    const osc = (type, f, t, dur) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      o.start(t);
      o.stop(t + dur);
      return o;
    };
    return {
      kick(t, v = 1) {
        const o = osc('sine', 150, t, 0.6);
        o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
        const g = ctx.createGain();
        env(g, t, 0.003, 0.95 * v, 0.5);
        o.connect(g);
        out(g, 1);
        const n = noiseSrc(t, 0.02, t * 7);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2500;
        const ng = ctx.createGain();
        env(ng, t, 0.001, 0.25 * v, 0.02);
        n.connect(hp); hp.connect(ng);
        out(ng, 1);
      },
      snare(t, v = 1) {
        const n = noiseSrc(t, 0.3, t * 3);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1900;
        bp.Q.value = 0.7;
        const g = ctx.createGain();
        env(g, t, 0.002, 0.42 * v, 0.2);
        n.connect(bp); bp.connect(g);
        out(g, 1, 0.35);
        const o = osc('triangle', 190, t, 0.2);
        o.frequency.exponentialRampToValueAtTime(140, t + 0.1);
        const og = ctx.createGain();
        env(og, t, 0.002, 0.3 * v, 0.1);
        o.connect(og);
        out(og, 1);
      },
      hat(t, v = 1, open = false) {
        const n = noiseSrc(t, open ? 0.3 : 0.06, t * 11);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7800;
        const g = ctx.createGain();
        env(g, t, 0.001, 0.11 * v, open ? 0.22 : 0.035);
        n.connect(hp); hp.connect(g);
        out(g, 1, 0.08);
      },
      bass(t, m, dur, v = 1) {
        const o = osc('sawtooth', mtof(m + 12), t, dur + 0.1);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.Q.value = 4;
        lp.frequency.setValueAtTime(220, t);
        lp.frequency.linearRampToValueAtTime(1100, t + 0.012);
        lp.frequency.exponentialRampToValueAtTime(260, t + 0.18);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.2 * v, t + 0.006);
        g.gain.setValueAtTime(0.2 * v, t + dur - 0.04);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(lp); lp.connect(g);
        out(g, 1);
        const s = osc('sine', mtof(m), t, dur + 0.1);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.0001, t);
        sg.gain.linearRampToValueAtTime(0.26 * v, t + 0.01);
        sg.gain.setValueAtTime(0.26 * v, t + dur - 0.04);
        sg.gain.linearRampToValueAtTime(0.0001, t + dur);
        s.connect(sg);
        out(sg, 1);
      },
      pad(t, notes, dur, v = 1, cutoff = 1400) {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = cutoff;
        lp.Q.value = 0.4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.03 * v, t + 0.45);
        g.gain.setValueAtTime(0.03 * v, t + dur);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.2);
        notes.forEach((m) => {
          [-7, 7].forEach((c) => {
            const o = osc('sawtooth', mtof(m), t, dur + 1.3);
            o.detune.value = c;
            o.connect(lp);
          });
        });
        lp.connect(g);
        out(g, 1, 0.6);
      },
      pluck(t, m, v = 1) {
        const o = osc('square', mtof(m), t, 0.4);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(3200, t);
        lp.frequency.exponentialRampToValueAtTime(380, t + 0.2);
        const g = ctx.createGain();
        env(g, t, 0.003, 0.09 * v, 0.28);
        o.connect(lp); lp.connect(g);
        out(g, 1, 0.2, 0.35);
      },
      lead(t, m, dur, v = 1) {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.085 * v, t + 0.025);
        g.gain.setValueAtTime(0.075 * v, t + Math.max(0.05, dur - 0.08));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
        const lfo = osc('sine', 5.5, t, dur + 0.3);
        const lg = ctx.createGain();
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(9, t + Math.min(0.4, dur));
        lfo.connect(lg);
        [0, 6].forEach((c) => {
          const o = osc('sawtooth', mtof(m), t, dur + 0.3);
          o.detune.value = c;
          lg.connect(o.detune);
          o.connect(lp);
        });
        lp.connect(g);
        out(g, 1, 0.4, 0.25);
      },
      blip(t, m, v = 1) {
        const o = osc('sine', mtof(m), t, 0.3);
        const g = ctx.createGain();
        env(g, t, 0.002, 0.14 * v, 0.16);
        o.connect(g);
        out(g, 1, 0.25, 0.3);
      },
      tick(t, v = 1, seed = 0) {
        const n = noiseSrc(t, 0.02, seed + t * 17);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2800 + PF.hash(seed + t) * 2200;
        bp.Q.value = 1.6;
        const g = ctx.createGain();
        env(g, t, 0.001, 0.3 * v, 0.018);
        n.connect(bp); bp.connect(g);
        out(g, 1, 0.05);
      },
      stab(t, notes, v = 1) {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(4200, t);
        lp.frequency.exponentialRampToValueAtTime(700, t + 0.25);
        const g = ctx.createGain();
        env(g, t, 0.004, 0.05 * v, 0.3);
        notes.forEach((m) => [-9, 9].forEach((c) => {
          const o = osc('sawtooth', mtof(m + 12), t, 0.4);
          o.detune.value = c;
          o.connect(lp);
        }));
        lp.connect(g);
        out(g, 1, 0.45);
      },
      riser(t0, t1, v = 1) {
        const dur = t1 - t0;
        const n = noiseSrc(t0, dur, t0);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 2.2;
        bp.frequency.setValueAtTime(300, t0);
        bp.frequency.exponentialRampToValueAtTime(7500, t1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.32 * v, t1 - 0.02);
        g.gain.linearRampToValueAtTime(0.0001, t1);
        n.connect(bp); bp.connect(g);
        out(g, 1, 0.3);
        const o = osc('sawtooth', 110, t0, dur);
        o.frequency.exponentialRampToValueAtTime(880, t1);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1800;
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.0001, t0);
        og.gain.exponentialRampToValueAtTime(0.05 * v, t1 - 0.02);
        og.gain.linearRampToValueAtTime(0.0001, t1);
        o.connect(lp); lp.connect(og);
        out(og, 1, 0.2);
      },
      impact(t, v = 1) {
        const o = osc('sine', 72, t, 1.8);
        o.frequency.exponentialRampToValueAtTime(27, t + 1.4);
        const g = ctx.createGain();
        env(g, t, 0.004, 0.8 * v, 1.6);
        o.connect(g);
        out(g, 1);
        const n = noiseSrc(t, 1.4, t * 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(5000, t);
        lp.frequency.exponentialRampToValueAtTime(300, t + 1.2);
        const ng = ctx.createGain();
        env(ng, t, 0.002, 0.3 * v, 1.2);
        n.connect(lp); lp.connect(ng);
        out(ng, 1, 0.9);
      },
    };
  }

  // ---------- the score ----------
  function buildScore() {
    const ev = [];
    const at = (t, fn) => ev.push({ t, fn });

    // pads: filter opens as the film gains confidence
    for (let bar = 0; bar < 56; bar++) {
      const t = bar * BAR, c = CHORDS[bar % 4];
      const cut = t < 12 ? 500 : t < 24 ? 800 : t < 48 ? 1300 : t < 64 ? 1800 : t < 96 ? 1500 : 2200;
      const v = t < 12 ? 0.7 : t < 24 ? 0.85 : t >= 48 && t < 64 ? 1.2 : 1;
      if (t >= 22 && t < 24) continue; // air before the drop
      at(t, (V, w) => V.pad(w, c, BAR, v, cut));
    }
    at(112, (V, w) => V.pad(w, [50, 57, 62, 65, 69], 6.2, 0.9, 900));

    // drums from the shared kick pattern
    for (let b = 0; b < DURATION / BEAT; b++) {
      const t = b * BEAT;
      if (PF.kickAt(b)) at(t, (V, w) => V.kick(w, t < 24 ? 0.7 : 1));
      if (inR(t, 32, 110)) {
        const think = inR(t, 48, 64);
        if (think ? b % 4 === 2 : b % 2 === 1) at(t, (V, w) => V.snare(w, think ? 1.1 : 1));
        if (!think) at(t + BEAT / 2, (V, w) => V.hat(w, 1, b % 4 === 3));
        if (inR(t, 64, 110) && !think) {
          at(t + BEAT / 4, (V, w) => V.hat(w, 0.45));
          at(t + (3 * BEAT) / 4, (V, w) => V.hat(w, 0.45));
        }
      }
    }

    // bass: driving eighths, long notes while thinking
    for (let t = 24; t < 110 - 1e-6; t += BEAT / 2) {
      const bar = Math.floor(t / BAR), step = Math.round((t - bar * BAR) / (BEAT / 2));
      const root = ROOTS[bar % 4];
      if (inR(t, 48, 64)) {
        if (step === 0) at(t, (V, w) => V.bass(w, root, BAR - 0.05, 0.9));
      } else {
        const m = root + (step === 3 || step === 7 ? 12 : 0);
        at(t, (V, w) => V.bass(w, m, BEAT / 2 - 0.03, step % 2 ? 0.8 : 1));
      }
    }

    // arpeggios
    for (let t = 32; t < 110 - 1e-6; t += BEAT / 4) {
      const think = inR(t, 48, 64);
      const s = Math.round(t / (BEAT / 4));
      if (think && s % 2) continue;
      if (inR(t, 88.5, 96)) continue;
      const c = CHORDS[chordAt(t)];
      const pat = [0, 1, 2, 3, 4, 3, 2, 1];
      const k = pat[(think ? s / 2 : s) % 8];
      const m = (k === 4 ? c[0] + 12 : c[k]) + 12;
      const v = think ? 1.1 : inR(t, 32, 48) ? 0.6 : 0.8;
      at(t, (V, w) => V.pluck(w, m, v));
    }

    // lead melody over the proof
    const MEL = [
      [81, 0, 1.5], [79, 1.5, 0.5], [77, 2, 1], [76, 3, 0.5], [77, 3.5, 0.5],
      [74, 4, 1.5], [72, 5.5, 0.5], [74, 6, 1], [77, 7, 1],
      [81, 8, 1.5], [84, 9.5, 0.5], [81, 10, 1], [79, 11, 1],
      [76, 12, 1.5], [77, 13.5, 0.5], [79, 14, 2],
      [81, 16, 1.5], [79, 17.5, 0.5], [77, 18, 1], [76, 19, 0.5], [77, 19.5, 0.5],
      [86, 20, 2], [84, 22, 1], [82, 23, 1],
      [81, 24, 3.5],
    ];
    MEL.forEach(([m, b, d]) => at(96 + b * BEAT, (V, w) => V.lead(w, m, d * BEAT)));

    // montage stabs, one per cut
    for (let k = 0; k < 12; k++) {
      const t = 90 + k * BEAT;
      at(t, (V, w) => V.stab(w, CHORDS[chordAt(t)], 1));
    }

    // risers and impacts at every chapter seam
    at(20, (V, w) => V.riser(w, w + 4, 1));
    [[46.5, 48, 0.5], [62.5, 64, 0.5], [78.5, 80, 0.5], [94, 96, 0.7], [110, 112, 1.1]].forEach(([a, b, v]) =>
      at(a, (V, w) => V.riser(w, w + (b - a), v)));
    [[24, 1.1], [32, 0.5], [48, 0.55], [64, 0.55], [80, 0.55], [96, 1], [112, 1]].forEach(([t, v]) =>
      at(t, (V, w) => V.impact(w, v)));
    at(64.32, (V, w) => V.kick(w, 0.8));

    // UI sounds tied to on-screen events
    const tones = [74, 77, 81, 84, 86, 89, 93, 96];
    (PF.readTags || []).forEach((t, k) => at(t, (V, w) => V.blip(w, tones[k % 8], 0.7)));
    (PF.nodeTimes || []).forEach((t, k) => at(t, (V, w) => V.blip(w, tones[k], 0.9)));
    (PF.commitTimes || []).forEach((t, k) => at(t, (V, w) => V.blip(w, tones[k + 1], 0.9)));
    (PF.checkTimes || []).forEach((t, k) => at(t + 0.2, (V, w) => V.blip(w, tones[k % 8] + 12, 0.6)));
    for (let k = 0; k < 12; k++) at(66 + k * BEAT, (V, w) => V.blip(w, 69 + [0, 3, 5, 7, 10, 12][k % 6], 0.5));
    at(117.6, (V, w) => V.blip(w, 81, 1));
    at(117.6, (V, w) => V.blip(w, 86, 0.8));

    // typing
    let seed = 1;
    PF.scenes.forEach((s) => (s.types || []).forEach(([str, t0, cps]) => {
      PF.typeTimes(str, t0, cps).forEach((t) => {
        const sd = seed++;
        at(t, (V, w) => V.tick(w, 0.9, sd));
      });
    }));

    ev.sort((a, b) => a.t - b.t);
    return ev.filter((e) => e.t >= 0 && e.t < DURATION);
  }

  // ---------- plumbing ----------
  function makeNoise(ctx) {
    const len = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0), r = PF.rng(99);
    for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
    return b;
  }
  function makeIR(ctx) {
    const len = Math.floor(ctx.sampleRate * 2.6);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch), r = PF.rng(300 + ch);
      for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return b;
  }
  // A fresh chain per play session; disconnecting it silences anything already scheduled.
  function makeChain(ctx, dest, ir) {
    const dry = ctx.createGain();
    const rev = ctx.createGain(), conv = ctx.createConvolver();
    conv.buffer = ir || makeIR(ctx);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.5;
    rev.connect(conv); conv.connect(revOut); revOut.connect(dry);
    const dly = ctx.createGain(), dl = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    dl.delayTime.value = BEAT * 0.75;
    fb.gain.value = 0.36;
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    dly.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl);
    const dlyOut = ctx.createGain();
    dlyOut.gain.value = 0.5;
    lp.connect(dlyOut); dlyOut.connect(dry);
    dry.connect(dest);
    return { dry, rev, dly };
  }
  function makeMaster(ctx) {
    const master = ctx.createGain();
    master.gain.value = PF.audio.GAIN;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 8;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    master.connect(comp);
    comp.connect(ctx.destination);
    return master;
  }

  let score = null;
  const getScore = () => (score = score || buildScore());

  PF.audio = {
    GAIN: 0.56,
    // Live playback: schedule a sliding window of events ahead of the clock.
    createLive() {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC({ latencyHint: 'playback' });
      const master = makeMaster(ctx);
      const noise = makeNoise(ctx), ir = makeIR(ctx);
      let chain = null, voices = null, cursor = 0, base = 0;
      return {
        ctx, master,
        start(filmT) {
          if (chain) chain.dry.disconnect();
          chain = makeChain(ctx, master, ir);
          voices = Voices(ctx, chain, noise);
          base = ctx.currentTime + 0.05 - filmT;
          const ev = getScore();
          cursor = ev.findIndex((e) => e.t >= filmT - 1e-6);
          if (cursor < 0) cursor = ev.length;
          return base;
        },
        stop() {
          if (chain) chain.dry.disconnect();
          chain = null;
        },
        pump(horizon = 0.6) {
          if (!chain) return;
          const ev = getScore();
          const until = ctx.currentTime - base + horizon;
          while (cursor < ev.length && ev[cursor].t < until) {
            const e = ev[cursor++];
            const w = Math.max(base + e.t, ctx.currentTime + 0.005);
            e.fn(voices, w);
          }
        },
        // picture follows what is heard, so subtract the device's output latency
        time() { return ctx.currentTime - base - (ctx.outputLatency || 0) - (ctx.baseLatency || 0); },
      };
    },
    // Offline render of the full soundtrack, returned as a 16-bit WAV (base64).
    async renderWav(sampleRate = 48000) {
      const ctx = new OfflineAudioContext(2, Math.ceil(sampleRate * DURATION), sampleRate);
      const master = makeMaster(ctx);
      const chain = makeChain(ctx, master);
      const V = Voices(ctx, chain, makeNoise(ctx));
      // Feed the graph one second ahead instead of all at once: a graph holding
      // every future note renders far slower than the music plays.
      const ev = getScore();
      let i = 0;
      const feed = (until) => {
        while (i < ev.length && ev[i].t < until) { const e = ev[i++]; e.fn(V, e.t); }
      };
      feed(0.5);
      for (let k = 0; k < DURATION; k++) {
        ctx.suspend(k).then(() => { feed(k + 1.5); ctx.resume(); });
      }
      const buf = await ctx.startRendering();
      const n = buf.length, L = buf.getChannelData(0), R = buf.getChannelData(1);
      const bytes = new Uint8Array(44 + n * 4);
      const dv = new DataView(bytes.buffer);
      const str = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
      str(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
      dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
      dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 4, true);
      dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, n * 4, true);
      let peak = 0;
      for (let i = 0; i < n; i++) {
        const l = Math.max(-1, Math.min(1, L[i])), r = Math.max(-1, Math.min(1, R[i]));
        peak = Math.max(peak, Math.abs(l), Math.abs(r));
        dv.setInt16(44 + i * 4, l * 32767, true);
        dv.setInt16(46 + i * 4, r * 32767, true);
      }
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return { wav: btoa(bin), peak };
    },
  };
})();
