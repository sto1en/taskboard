const puppeteer = require('puppeteer-core');
(async () => {
  const tok = require('fs').readFileSync('outputs/tok.txt','utf8').trim();
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args:['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({width:1440,height:1000});
  const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(r.status()+' '+r.url()); });
  await p.goto('http://localhost:5173/', {waitUntil:'domcontentloaded'});
  await p.evaluate(t => { localStorage.setItem('token', t); localStorage.setItem('lang','ru'); }, tok);
  await p.goto('http://localhost:5173/shop', {waitUntil:'networkidle0'});
  await new Promise(r => setTimeout(r, 2500));
  const url = p.url();
  const hasLogin = await p.evaluate(() => !!document.querySelector('form input[type=password]'));
  const tokAfter = await p.evaluate(() => !!localStorage.getItem('token'));
  const info = await p.evaluate(() => ({
    cards: document.querySelectorAll('.shop-card').length,
    chips: [...document.querySelectorAll('.shop-chips button, .shop-type-chip')].map(e=>e.textContent.trim()).slice(0,10),
    treePreviews: document.querySelectorAll('.shop-card__preview-btn').length,
    sorts: [...document.querySelectorAll('select option')].map(o=>o.textContent.trim()),
  }));
  await p.screenshot({path:'outputs/shop-after-fix.png', fullPage:false});
  console.log(JSON.stringify({url, hasLogin, tokAfter, errs, bad, ...info}, null, 1));
  await b.close();
})();
