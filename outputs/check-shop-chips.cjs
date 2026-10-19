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
  await p.setViewport({ width: 1440, height: 1100 });
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
  await new Promise((r) => setTimeout(r, 1200));

  const out = {};
  for (const [i, name] of [[2, 'trees'], [3, 'accents'], [1, 'frames']]) {
    const tabs = await p.$$('.shop__tab');
    await tabs[i].click();
    await new Promise((r) => setTimeout(r, 1500));
    out[name] = await p.evaluate(() => ({
      chips: [...document.querySelectorAll('.category-chip')].map((e) => e.textContent.trim()),
      cards: document.querySelectorAll('.shop-card').length,
    }));
  }

  // Фильтр «Экзотические» на деревьях
  const tabs = await p.$$('.shop__tab');
  await tabs[2].click();
  await new Promise((r) => setTimeout(r, 1200));
  const chips = await p.$$('.category-chip');
  const labels = await p.evaluate(() => [...document.querySelectorAll('.category-chip')].map((e) => e.textContent.trim()));
  const idx = labels.indexOf('Экзотические');
  if (idx >= 0) {
    await chips[idx].click();
    await new Promise((r) => setTimeout(r, 900));
    out.exotic = await p.evaluate(() => ({
      cards: [...document.querySelectorAll('.shop-card__title')].map((e) => e.textContent.trim()),
    }));
  } else out.exotic = 'chip not found: ' + labels.join('|');

  // Сортировка «По типу»
  await p.select('[class*=sort] select', 'type').catch(() => {});
  await new Promise((r) => setTimeout(r, 900));
  out.afterSortSelect = await p.evaluate(() => ({
    sortValue: document.querySelector('[class*=sort] select')?.value,
    cards: document.querySelectorAll('.shop-card').length,
    cats: [...document.querySelectorAll('.shop-card__category')].map((e) => e.textContent.trim()).slice(0, 12),
  }));

  await p.screenshot({ path: __dirname + '/shop-trees-filtered.png' });
  console.log(JSON.stringify({ errs, bad, ...out }, null, 1));
  await b.close();
})();
