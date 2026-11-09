import { serve, openPage } from './qa-lib.mjs';
const { server, port } = await serve();
const { browser, page } = await openPage(`http://127.0.0.1:${port}/index.html`);
await new Promise(r => setTimeout(r, 3000));
const info = await page.evaluate(() => ({ hf: window.__hf ? Object.keys(window.__hf) : null, tl: Object.keys(window.__timelines || {}), player: !!window.__player, svgs: [...document.querySelectorAll('svg')].map(s => s.id) }));
console.log(JSON.stringify(info));
await browser.close(); server.close();
