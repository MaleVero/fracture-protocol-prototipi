// Genera l'icona (PNG 180x180 e 64x64 come data URI) con il linguaggio del gioco: rombo isometrico ambra su nero, crepa teal-viola.
//   node icona.js  -> stampa out/icona.json {png180, png64}
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium }); const p = await b.newPage(); await p.setContent('<canvas id="c"></canvas>');
  const out = await p.evaluate(() => {
    const draw = (N) => {
      const c = document.getElementById('c'); c.width = c.height = N; const g = c.getContext('2d'); const s = N / 180;
      g.fillStyle = '#07090B'; g.fillRect(0, 0, N, N);
      
      // rombo: la casella del campo
      const cx = N / 2, cy = N * .56, rx = N * .38, ry = N * .19;
      const rombo = (dy, col, lw) => { g.beginPath(); g.moveTo(cx - rx, cy + dy); g.lineTo(cx, cy - ry + dy); g.lineTo(cx + rx, cy + dy); g.lineTo(cx, cy + ry + dy); g.closePath(); g.lineWidth = lw; g.strokeStyle = col; g.stroke(); };
      g.fillStyle = '#0e1319'; g.beginPath(); g.moveTo(cx - rx, cy + 10 * s); g.lineTo(cx, cy - ry + 10 * s); g.lineTo(cx + rx, cy + 10 * s); g.lineTo(cx, cy + ry + 10 * s); g.closePath(); g.fill();
      rombo(10 * s, 'rgba(255,176,0,.35)', 6 * s); rombo(0, '#FFB000', 7 * s);
      g.fillStyle = '#121820'; g.beginPath(); g.moveTo(cx - rx, cy); g.lineTo(cx, cy - ry); g.lineTo(cx + rx, cy); g.lineTo(cx, cy + ry); g.closePath(); g.fill(); rombo(0, '#FFB000', 7 * s);
      // la crepa: spezzata dall'alto al basso, teal con un filo viola
      const pts = [[.56, .06], [.46, .26], [.60, .40], [.45, .56], [.57, .72], [.48, .94]];
      const trace = (w, col) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x * N, y * N) : g.moveTo(x * N, y * N)); g.lineWidth = w; g.strokeStyle = col; g.lineJoin = 'miter'; g.lineCap = 'round'; g.stroke(); };
      trace(15 * s, 'rgba(154,107,196,.55)'); trace(9 * s, '#04060A'); trace(5.2 * s, '#00CED1');
      return c.toDataURL('image/png');
    };
    return { png180: draw(180), png64: draw(64), png120: draw(120) };
  });
  fs.writeFileSync(C.OUT + '/icona.json', JSON.stringify(out)); fs.writeFileSync(C.OUT + '/icona-180.png', Buffer.from(out.png180.split(',')[1], 'base64'));
  console.log('png180', out.png180.length, 'png120', out.png120.length, 'png64', out.png64.length); await b.close();
})();
