const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const tok = fs.readFileSync(__dirname + '/tok.txt', 'utf8').trim();
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 1000 });
  const errs = [], bad = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status() + ' ' + r.url());
  });
  await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await p.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('lang', 'ru');
  }, tok);
  await p.goto('http://localhost:5173/shop', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));

  const info = await p.evaluate(() => ({
    url: location.pathname,
    hasPasswordInput: !!document.querySelector('input[type=password]'),
    tokenKept: !!localStorage.getItem('token'),
    cards: document.querySelectorAll('.shop-card').length,
    previewBtns: document.querySelectorAll('.shop-card__preview-btn').length,
    chips: [...document.querySelectorAll('.shop-chip, .shop-category-chip, [class*=chip]')].map((e) => e.textContent.trim()).slice(0, 14),
    sortOptions: [...document.querySelectorAll('select option')].map((o) => o.textContent.trim()),
    tabTitles: [...document.querySelectorAll('[class*=shop-tab]')].map((e) => e.textContent.trim()).slice(0, 8),
  }));
  await p.screenshot({ path: __dirname + '/shop-after-fix.png' });
  console.log(JSON.stringify({ errs, bad, ...info }, null, 1));
  await b.close();
})();
