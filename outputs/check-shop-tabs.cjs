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
  await new Promise((r) => setTimeout(r, 1500));

  const tabs = await p.$$('.shop__tab');
  await tabs[2].click(); // деревья
  await new Promise((r) => setTimeout(r, 2000));

  const trees = await p.evaluate(() => ({
    cards: document.querySelectorAll('.shop-card').length,
    previewBtns: document.querySelectorAll('.tree-preview-btn').length,
    chips: [...document.querySelectorAll('.shop__cat-chip, .shop__chip, [class*=cat-chip]')].map((e) => e.textContent.trim()),
    names: [...document.querySelectorAll('.shop-card__title, .shop-card h3, .shop-card__name')].map((e) => e.textContent.trim()).slice(0, 22),
  }));
  await p.screenshot({ path: __dirname + '/shop-trees.png', fullPage: false });

  const btn = await p.$('.tree-preview-btn');
  let popup = null;
  if (btn) {
    await btn.click();
    await new Promise((r) => setTimeout(r, 1200));
    popup = await p.evaluate(() => {
      const el = document.querySelector('.tree-preview-dialog');
      if (!el) return null;
      return {
        visible: !!(el.offsetWidth || el.offsetHeight),
        svgs: el.querySelectorAll('svg').length,
        text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 160),
      };
    });
    await p.screenshot({ path: __dirname + '/shop-tree-preview.png' });
    await p.keyboard.press('Escape');
  }

  const accTab = (await p.$$('.shop__tab'))[3];
  await accTab.click();
  await new Promise((r) => setTimeout(r, 1800));
  const accents = await p.evaluate(() => ({
    cards: document.querySelectorAll('.shop-card').length,
    rare: document.querySelectorAll('.shop-badge--rare').length,
    badges: [...document.querySelectorAll('.shop-badge')].map((e) => e.textContent.trim()).slice(0, 12),
    chips: [...document.querySelectorAll('.shop__cat-chip, [class*=cat-chip]')].map((e) => e.textContent.trim()),
  }));
  await p.screenshot({ path: __dirname + '/shop-accents.png' });

  console.log(JSON.stringify({ errs, bad, trees, popup, accents }, null, 1));
  await b.close();
})();
