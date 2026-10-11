// IndexNow: de site seint Bing (en Yandex, Seznam en Naver, die de lijst
// delen) meteen als er een pagina bij komt of verandert, in plaats van te
// wachten tot Bing zelf langskomt (Michiel, 11 oktober 2026). Google doet niet
// mee; daar blijft de sitemap de route.
//
// De sleutel is geen geheim: hij staat ook openbaar in public/<sleutel>.txt,
// zodat Bing kan nagaan dat de melding echt van deze site komt.

import { MARKETING_URL } from "./site-url"

export const INDEXNOW_SLEUTEL = "2eb4b0d5ce6dccdb98f8f539b518ed05"

/** Meld adressen van www.sayingyes.nl aan bij IndexNow. Geeft de HTTP-status terug. */
export async function meldBijIndexNow(urls: string[]): Promise<number> {
  if (urls.length === 0) return 0
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(MARKETING_URL).host,
      key: INDEXNOW_SLEUTEL,
      keyLocation: `${MARKETING_URL}/${INDEXNOW_SLEUTEL}.txt`,
      urlList: urls,
    }),
  })
  return res.status
}
