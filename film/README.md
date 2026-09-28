# 证明之战 · THE PROVING

一段 120 秒的动态图形短片。画面由 Canvas 2D 逐帧绘制，声音由 Web Audio 实时合成，没有使用任何视频、图片或音频素材。

## 观看

用浏览器打开 `index.html`，点击“播放”。页面需要联网来加载 Google Fonts。

快捷键：`空格` 播放/暂停，`← →` 前后 5 秒，`M` 静音，`F` 全屏。

## 结构

| 文件 | 内容 |
| --- | --- |
| `engine.js` | 常量、缓动函数、节拍表、粒子采样、转场、HUD、`PF.render(ctx, t)` |
| `scenes-a.js` | 序章（空仓库、你出的题）、片名 |
| `scenes-b.js` | 01 读、02 想、03 做 |
| `scenes-c.js` | 04 验、终证、片尾 |
| `audio.js` | 120 BPM、D 小调的合成配乐，和画面共用同一张节拍表 |
| `player.js` | 播放器：时钟、进度条、章节、全屏 |
| `render.cjs` | 用无头 Chromium + ffmpeg 导出 MP4 |

画面是时间的纯函数：同一个 `t` 永远画出同一帧，所以实时播放、拖动进度条和逐帧导出得到的画面完全一致。

## 导出 MP4

需要 Node、Playwright（带 Chromium）和带 libx264 的 ffmpeg。

```sh
FFMPEG=/path/to/ffmpeg node render.cjs video proving.mp4 3   # 1920×1080 · 30 fps · H.264 + AAC，3 个并行渲染进程
node render.cjs stills 24.5,60,105.6 stills/                  # 导出指定时间点的静帧
node render.cjs audio soundtrack.wav                          # 只导出配乐
```

| 时间 | 章节 |
| --- | --- |
| 00:00 | 序章：一个空仓库 |
| 00:12 | 序章：你出的题 |
| 00:24 | 片名：证明之战 |
| 00:32 | 01 读：先读懂，再动手 |
| 00:48 | 02 想：动画的灵魂是时间 |
| 01:04 | 03 做：一次一个提交 |
| 01:20 | 04 验：证据胜于宣称 |
| 01:36 | 终证：用数字证明 |
| 01:52 | 片尾：下一题？ |
