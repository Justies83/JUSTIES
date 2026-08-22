import { chromium } from 'playwright-core';
const out = process.env.OUT;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const [name, path, width, clip] of [
  ['s-home-d', '/', 1440, null],
  ['s-home-m', '/', 390, null],
  ['s-lead-m', '/', 390, { x: 0, y: 130, width: 390, height: 420 }],
  ['s-about', '/about', 1440, null],
]) {
  const ctx = await b.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-visible')));
  // Walk the page so every lazy image is decoded before the shot.
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].filter(i => !i.complete).map(i => i.decode().catch(() => {})));
  });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: !clip, clip: clip ?? undefined });
  console.log(name, 'ok');
  await ctx.close();
}
await b.close();
