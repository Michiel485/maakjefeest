import React from "react"
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from "@react-pdf/renderer"

Font.register({
  family: "CormorantGaramond",
  fonts: [
    { src: "https://fonts.gstatic.com/l/font?kit=co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnI&skey=a863d1376a24bd7a&v=v21", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/l/font?kit=co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_iE9GnI&skey=a863d1376a24bd7a&v=v21", fontWeight: 600 },
  ],
})

const GOLD    = "#C5A059"
const DARK    = "#1A1A1A"
const BODY    = "#5C5248"
const LIGHT   = "#9A8E82"
const BORDER  = "#E8D5A3"
const BG      = "#FBF5E8"
const AMT_W   = 88

const s = StyleSheet.create({
  page:           { fontFamily: "Helvetica", fontSize: 10, color: DARK, backgroundColor: "#ffffff", paddingHorizontal: 48, paddingVertical: 48 },
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  brand:          { fontSize: 26, color: GOLD, fontFamily: "CormorantGaramond", fontWeight: 600, letterSpacing: 1.2 },
  brandSub:       { fontSize: 8, color: LIGHT, marginTop: 5, lineHeight: 1.6 },
  invoiceLabel:   { fontSize: 22, fontFamily: "CormorantGaramond", fontWeight: 600, color: GOLD, letterSpacing: 2, textAlign: "right" },
  invoiceNum:     { fontSize: 9, color: BODY, textAlign: "right", marginTop: 4 },
  metaRow:        { flexDirection: "row", marginBottom: 28, gap: 40 },
  metaBlock:      { flex: 1 },
  metaLabel:      { fontSize: 7, color: LIGHT, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  metaValue:      { fontSize: 10, color: DARK, lineHeight: 1.6 },
  metaValueSub:   { fontSize: 8.5, color: BODY, lineHeight: 1.6 },
  tableHeader:    { flexDirection: "row", backgroundColor: BG, paddingVertical: 7, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: BORDER, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableHeaderTxt: { fontSize: 7, fontFamily: "Helvetica-Bold", color: LIGHT, textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow:       { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableDesc:      { flex: 1 },
  tableDescMain:  { fontSize: 10, color: DARK },
  tableDescSub:   { fontSize: 8.5, color: LIGHT, marginTop: 2 },
  tableAmt:       { width: AMT_W, textAlign: "right", fontSize: 10, color: DARK },
  totalsBlock:    { marginTop: 4 },
  totalRow:       { flexDirection: "row", paddingVertical: 3 },
  totalLabel:     { flex: 1, fontSize: 9, color: BODY, textAlign: "right", paddingRight: 10 },
  totalValue:     { width: AMT_W, fontSize: 9, color: BODY, textAlign: "right" },
  divider:        { height: 1, backgroundColor: DARK, marginVertical: 6 },
  totalFinalLabel:{ flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, textAlign: "right", paddingRight: 10 },
  totalFinalValue:{ width: AMT_W, fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, textAlign: "right" },
  note:           { marginTop: 32, paddingTop: 14, borderTopWidth: 1, borderTopColor: BORDER },
  noteTxt:        { fontSize: 8.5, color: LIGHT, lineHeight: 1.7 },
  footer:         { position: "absolute", bottom: 30, left: 48, right: 48, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10, flexDirection: "row", justifyContent: "space-between" },
  footerTxt:      { fontSize: 8, color: LIGHT },
})

interface InvoicePDFProps {
  invoiceNumber:   string
  invoiceDate:     string
  customerName:    string
  customerEmail:   string
  amountExcl:      string
  btwAmount:       string
  amountIncl:      string
  btwRate:         number
  molliePaymentId: string
  description:     string
}

function InvoiceDocument(props: InvoicePDFProps) {
  const { invoiceNumber, invoiceDate, customerName, customerEmail, amountExcl, btwAmount, amountIncl, btwRate, molliePaymentId, description } = props
  return (
    <Document title={`Factuur ${invoiceNumber} — SayingYes`} author="SayingYes">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>SayingYes</Text>
            <Text style={s.brandSub}>
              MvB Commerce{"\n"}
              KVK 42079472  ·  BTW NL005478870B96{"\n"}
              Theo Uden Masmanstraat 43, 3813ZE Amersfoort{"\n"}
              info@sayingyes.nl
            </Text>
          </View>
          <View>
            <Text style={s.invoiceLabel}>FACTUUR</Text>
            <Text style={s.invoiceNum}>{invoiceNumber}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Factuurdatum</Text>
            <Text style={s.metaValue}>{invoiceDate}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Factuur aan</Text>
            <Text style={s.metaValue}>{customerName}</Text>
            <Text style={s.metaValueSub}>{customerEmail}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Betalingsstatus</Text>
            <Text style={s.metaValue}>Betaald</Text>
            <Text style={s.metaValueSub}>via Mollie</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderTxt, { flex: 1 }]}>Omschrijving</Text>
          <Text style={[s.tableHeaderTxt, { width: AMT_W, textAlign: "right" }]}>Bedrag</Text>
        </View>

        <View style={s.tableRow}>
          <View style={s.tableDesc}>
            <Text style={s.tableDescMain}>{description}</Text>
            <Text style={s.tableDescSub}>sayingyes.nl · publicatie voor 12 maanden</Text>
          </View>
          <Text style={s.tableAmt}>€ {amountExcl}</Text>
        </View>

        {/* Totals */}
        <View style={s.totalsBlock}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotaal excl. BTW</Text>
            <Text style={s.totalValue}>€ {amountExcl}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>BTW {btwRate}%</Text>
            <Text style={s.totalValue}>€ {btwAmount}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalFinalLabel}>Totaal incl. BTW</Text>
            <Text style={s.totalFinalValue}>€ {amountIncl}</Text>
          </View>
        </View>

        {/* Note */}
        <View style={s.note}>
          <Text style={s.noteTxt}>
            Betaling ontvangen via Mollie · Referentie: {molliePaymentId}
          </Text>
          <Text style={[s.noteTxt, { marginTop: 4 }]}>
            Bewaar dit document voor je eigen administratie. Vragen? info@sayingyes.nl
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>SayingYes · sayingyes.nl</Text>
          <Text style={s.footerTxt}>{invoiceNumber}</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(props: InvoicePDFProps): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvoiceDocument {...props} />)
  return Buffer.from(buffer)
}
