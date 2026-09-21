// Het xlsx-pakket laden, in een vorm die ook echt werkt.
//
// `(await import("xlsx")).default` gaf undefined, en daardoor viel de Excel-
// export in het dashboard stil op "Cannot read properties of undefined
// (reading 'utils')". Die knop was daarmee al een tijd stuk zonder dat het
// opviel, want de fout kwam alleen in de console terecht.
//
// Oorzaak: xlsx is een CommonJS-pakket. Afhankelijk van hoe de bundelaar de
// interop doet zitten de functies op de namespace of op .default. Dus pakken
// we wat er is, in plaats van te gokken.

type XlsxModule = typeof import("xlsx")

export async function laadXlsx(): Promise<XlsxModule> {
  const mod = (await import("xlsx")) as XlsxModule & { default?: XlsxModule }
  return mod.utils ? mod : (mod.default as XlsxModule)
}
