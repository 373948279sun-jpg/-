// Export 证明之战 with headless Chromium + ffmpeg.
//   node render.cjs stills 0,24.5,60 out/          -> PNG stills at those times
//   node render.cjs video out/proving.mp4 [workers]  -> 1920×1080 30fps H.264 + AAC
// FFMPEG may point at an ffmpeg binary with libx264 (default: `ffmpeg` on PATH).
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const PAGE = 'file://' + path.join(__dirname, 'index.html');
const FPS = 30, DURATION = 120;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
  // Fetch Google Fonts with curl (which verifies TLS against the system CA
  // bundle) and hand them to the page, so the export uses the real faces.
  const cache = path.join(os.tmpdir(), 'proving-font-cache');
  fs.mkdirSync(cache, { recursive: true });
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async (route) => {
    const url = route.request().url();
    const f = path.join(cache, crypto.createHash('sha1').update(url).digest('hex'));
    if (!fs.existsSync(f)) {
      execFileSync('curl', ['-sS', '--fail', '-A', route.request().headers()['user-agent'] || 'Mozilla/5.0', '-o', f, url]);
    }
    const css = url.includes('googleapis');
    await route.fulfill({
      status: 200,
      body: fs.readFileSync(f),
      headers: { 'content-type': css ? 'text/css; charset=utf-8' : 'font/woff2', 'access-control-allow-origin': '*' },
    });
  });
  await page.goto(PAGE);
  await page.evaluate(() => window.PF.ready());
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  console.error('fonts loaded:', [...new Set(fonts)].join(', '));
  return page;
}
const launch = () => pw.chromium.launch({
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
});

function ff(args, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: [opts.stdin ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
    if (opts.stdin) opts.stdin(p.stdin);
  });
}

async function stills(times, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await launch();
  const page = await openPage(browser);
  for (const t of times) {
    const t0 = Date.now();
    const url = await page.evaluate((t) => window.PF.exportFrame(t, 'image/png'), t);
    const f = path.join(outDir, `t${String(t.toFixed(2)).padStart(6, '0')}.png`);
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.error(`${f}  ${Date.now() - t0}ms`);
  }
  await browser.close();
}

async function segment(browser, from, to, file) {
  const page = await openPage(browser);
  await ff(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], {
    stdin: async (stdin) => {
      for (let f = from; f < to; f++) {
        const url = await page.evaluate((t) => window.PF.exportFrame(t, 'image/jpeg', 0.96), f / FPS);
        const buf = Buffer.from(url.split(',')[1], 'base64');
        if (!stdin.write(buf)) await new Promise((r) => stdin.once('drain', r));
        if ((f - from) % 150 === 0) console.error(`  ${path.basename(file)}: frame ${f}/${to}`);
      }
      stdin.end();
    },
  });
  await page.close();
}

// Final delivery encode: two-pass H.264 at a fixed average bitrate, so the file
// size is predictable (about 48 MB for 120 s) and hard scenes get the bits.
const VIDEO_KBPS = 3000;

async function video(out, workers = 3) {
  const dir = path.dirname(path.resolve(out));
  const tmp = fs.mkdtempSync(path.join(dir, '.render-'));
  const browser = await launch();
  console.error('rendering soundtrack…');
  const apage = await openPage(browser);
  const { wav, peak } = await apage.evaluate(() => window.PF.audio.renderWav(48000));
  fs.writeFileSync(path.join(tmp, 'audio.wav'), Buffer.from(wav, 'base64'));
  console.error('soundtrack peak', peak.toFixed(3));
  await apage.close();

  const total = FPS * DURATION, per = Math.ceil(total / workers);
  const segs = [];
  const jobs = [];
  for (let w = 0; w < workers; w++) {
    const from = w * per, to = Math.min(total, from + per);
    const file = path.join(tmp, `seg${w}.mp4`);
    segs.push(file);
    jobs.push(segment(browser, from, to, file));
  }
  await Promise.all(jobs);
  await browser.close();
  fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map((s) => `file '${s}'`).join('\n'));
  const master = path.join(tmp, 'master.mp4');
  await ff(['-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', master]);
  console.error('encoding delivery file (two-pass)…');
  const log = path.join(tmp, 'x264');
  const venc = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p',
    '-b:v', `${VIDEO_KBPS}k`, '-maxrate', `${VIDEO_KBPS * 2}k`, '-bufsize', `${VIDEO_KBPS * 4}k`, '-passlogfile', log];
  await ff(['-i', master, ...venc, '-pass', '1', '-an', '-f', 'mp4', '/dev/null']);
  await ff(['-i', master, '-i', path.join(tmp, 'audio.wav'), ...venc, '-pass', '2',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.error('wrote', out);
}

async function audio(out) {
  const browser = await launch();
  const page = await openPage(browser);
  const { wav, peak } = await page.evaluate(() => window.PF.audio.renderWav(48000));
  fs.writeFileSync(out, Buffer.from(wav, 'base64'));
  console.error('wrote', out, 'peak', peak.toFixed(3));
  await browser.close();
}

const [mode, a, b] = process.argv.slice(2);
if (mode === 'stills') stills(a.split(',').map(Number), b || 'stills').catch((e) => { console.error(e); process.exit(1); });
else if (mode === 'audio') audio(a || 'soundtrack.wav').catch((e) => { console.error(e); process.exit(1); });
else if (mode === 'video') video(a || 'proving.mp4', Number(b) || 3).catch((e) => { console.error(e); process.exit(1); });
else console.error('usage: node render.cjs stills <t,t,…> <dir> | audio <out.wav> | video <out.mp4> [workers]');
