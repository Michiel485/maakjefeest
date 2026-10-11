// Kopie van de database van SayingYes, zonder de foto's (Michiel, 11 oktober
// 2026). Haalt elke tabel uit het schema public op via de REST-ingang van
// Supabase, plus de accounts uit auth, en schrijft alles als één gezipt
// JSON-bestand weg. Bewaart de laatste 8 kopieën.
//
// Gebruik:  node scripts/backup-database.mjs [map]
// Standaardmap: G:/Mijn Drive/AI/Brein/Privé/Bestanden/SayingYes-backups
//
// Leest NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY uit .env.local.
// Schrijft niets terug naar de database. De structuur van de tabellen staat
// in supabase/*.sql; dit bestand bevat alleen de rijen.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs"
import { gzipSync } from "zlib"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const BEWAAR = 8
const PER_KEER = 1000
const standaardMap = "G:/Mijn Drive/AI/Brein/Privé/Bestanden/SayingYes-backups"
const map = process.argv[2] ?? standaardMap

// .env.local lezen zonder iets te printen
const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((r) => /^[A-Z_]+=/.test(r))
    .map((r) => [r.slice(0, r.indexOf("=")), r.slice(r.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const sleutel = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !sleutel) {
  console.error("NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local")
  process.exit(1)
}
const kop = { apikey: sleutel, Authorization: `Bearer ${sleutel}` }

async function haal(pad, extra = {}) {
  const res = await fetch(`${url}${pad}`, { headers: { ...kop, ...extra } })
  if (!res.ok) throw new Error(`${pad}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
  return res
}

// Welke tabellen er zijn: de OpenAPI-beschrijving van PostgREST noemt ze
const beschrijving = await (await haal("/rest/v1/", { Accept: "application/openapi+json" })).json()
const tabellen = Object.keys(beschrijving.definitions ?? {}).sort()

const kopie = { gemaakt: new Date().toISOString(), project: new URL(url).hostname, tabellen: {}, accounts: [] }
const telling = {}

for (const t of tabellen) {
  const rijen = []
  for (let van = 0; ; van += PER_KEER) {
    const res = await haal(`/rest/v1/${encodeURIComponent(t)}?select=*`, {
      Range: `${van}-${van + PER_KEER - 1}`,
      "Range-Unit": "items",
    })
    const deel = await res.json()
    rijen.push(...deel)
    if (deel.length < PER_KEER) break
  }
  kopie.tabellen[t] = rijen
  telling[t] = rijen.length
}

// De accounts (inloggen met een mailadres) staan in auth, niet in public
for (let pagina = 1; ; pagina++) {
  const res = await haal(`/auth/v1/admin/users?page=${pagina}&per_page=1000`)
  const { users = [] } = await res.json()
  kopie.accounts.push(...users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at })))
  if (users.length < 1000) break
}

mkdirSync(map, { recursive: true })
const datum = kopie.gemaakt.slice(0, 10)
const bestand = join(map, `sayingyes-${datum}.json.gz`)
const inhoud = gzipSync(Buffer.from(JSON.stringify(kopie)))
writeFileSync(bestand, inhoud)

// Alleen de laatste kopieën houden
const oud = readdirSync(map).filter((f) => /^sayingyes-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(f)).sort().slice(0, -BEWAAR)
for (const f of oud) unlinkSync(join(map, f))

const rijenTotaal = Object.values(telling).reduce((a, b) => a + b, 0)
console.log(`Kopie: ${bestand}`)
console.log(`Grootte: ${(inhoud.length / 1024).toFixed(0)} kB, ${tabellen.length} tabellen, ${rijenTotaal} rijen, ${kopie.accounts.length} accounts`)
console.log(`Per tabel: ${Object.entries(telling).map(([t, n]) => `${t} ${n}`).join(", ")}`)
if (oud.length) console.log(`Opgeruimd: ${oud.join(", ")}`)
