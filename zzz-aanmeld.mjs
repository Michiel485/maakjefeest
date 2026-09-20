import { createClient } from "@supabase/supabase-js"
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data: ev, error } = await s.from("events").insert({
  type: "bruiloft", title: "Aanmeldtest", slug: "zzz-aanmeld", status: "published",
  plan: "uitnodiging", style: "zand", datum: "2027-07-10", locatie: "Utrecht",
  user_email: "m.vanbendegem@smartphonehoesjes.nl",
}).select("id").single()
if (error) throw error
await s.from("cards").insert([
  { event_id: ev.id, type: "save_the_date", template: "klassiek", share_token: "zzzstd",
    content: { guestType: undefined, aanmelden: "janee" } },
  { event_id: ev.id, type: "trouwkaart", template: "klassiek", share_token: "zzztk",
    content: { guestType: "avondgast", aanmelden: "volledig" } },
  { event_id: ev.id, type: "trouwkaart", template: "klassiek", share_token: "zzzgeen",
    content: { guestType: "daggast", aanmelden: "geen" } },
])
console.log(ev.id)
