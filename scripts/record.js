// Records assets/portfolio.gif: a Playwright function that walks sebastian.quovra.com and
// dumps one JPEG per frame into a folder; then ffmpeg assembles the GIF.
//
//   node -e "require('playwright').chromium.launch().then(async b=>{const p=await b.newPage();console.log(await require('./scripts/record.js')(p,'/tmp/frames'));await b.close();})"
//   ffmpeg -framerate 8 -i /tmp/frames/f%04d.jpg -vf "scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" -loop 0 assets/portfolio.gif
//
// (The same function body runs as-is inside the Playwright MCP `browser_run_code_unsafe` tool.)
module.exports = async (page, dir) => {
  let i = 0;
  const snap = async () => { await page.screenshot({ path: `${dir}/f${String(i++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 82 }); };
  const burst = async (n, ms) => { for (let k = 0; k < n; k++) { await snap(); await page.waitForTimeout(ms); } };
  const go = async (sel) => { await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ behavior: 'smooth', block: 'start' }), sel); await burst(9, 90); await page.waitForTimeout(300); await snap(); };
  await page.setViewportSize({ width: 1200, height: 760 });
  await page.goto('https://sebastian.quovra.com/?ba=23', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await burst(6, 150);
  for (const k of ['pulso', 'trazo', 'quovra', 'reachr', 'cobro']) { await page.hover(`a.win.lit[data-win=${k}]`); await burst(3, 130); }
  await page.hover('a.win.lit[data-win=pulso]'); await burst(2, 130);
  await page.click('a.win.lit[data-win=pulso]'); await burst(10, 90); await page.waitForTimeout(400); await snap();
  const box = await page.locator('#pulso canvas').boundingBox();
  if (box) { const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    for (let t = 0; t < 9; t++) { await page.mouse.click(cx, cy); await burst(4, 110); } }
  await go('#quovra');
  for (const m of ['turnos', 'tienda', 'resenas', 'sitio']) { await page.click(`#quovra .qv-sw[data-mod=${m}]`); await burst(5, 130); }
  await go('#reachr');
  await page.locator('#reachr .col[data-stage=lead] .card').first().focus(); await burst(2, 120);
  for (let t = 0; t < 3; t++) { await page.keyboard.press('ArrowRight'); await burst(5, 120); }
  await burst(6, 150);
  await go('#cobro');
  await page.locator('#cobro-rate-r').focus();
  for (let t = 0; t < 12; t++) { await page.keyboard.press('ArrowRight'); await burst(1, 90); }
  await burst(8, 150);
  await go('section.contact');
  await burst(4, 150);
  return { frames: i };
};
