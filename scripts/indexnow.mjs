// Meld pagina's van www.sayingyes.nl aan bij IndexNow (Bing en partners).
// Voor wijzigingen die de dagelijkse cron niet ziet, zoals de homepage of een
// zoekpagina. De cron meldt alleen nieuwe of bijgewerkte artikelen.
//
// Gebruik:  node scripts/indexnow.mjs              alle adressen uit de sitemap
//           node scripts/indexnow.mjs / /save-the-date   alleen deze paden
//
// Leest niets uit .env.local: de sleutel is openbaar (public/<sleutel>.txt).

import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const SITE = "https://www.sayingyes.nl"
const sleutel = /INDEXNOW_SLEUTEL = "([0-9a-f]+)"/.exec(readFileSync(join(root, "lib/indexnow.ts"), "utf8"))[1]

let urls = process.argv.slice(2).map((p) => (p.startsWith("http") ? p : `${SITE}${p === "/" ? "" : p}`))
if (urls.length === 0) {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text()
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: sleutel, keyLocation: `${SITE}/${sleutel}.txt`, urlList: urls }),
})
// 200 en 202 zijn goed; 403 betekent dat het sleutelbestand niet gevonden werd
console.log(`IndexNow: HTTP ${res.status} voor ${urls.length} adressen`)
if (res.status >= 300) console.log((await res.text()).slice(0, 300))
