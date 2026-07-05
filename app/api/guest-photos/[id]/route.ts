import { createServiceClient } from "@/lib/supabase"
import { createClient } from "@/lib/supabase-server"
import { GUEST_PHOTOS_BUCKET } from "@/lib/guest-photos"

async function getOwnedPhoto(photoId: string, userEmail: string) {
  const service = createServiceClient()
  const { data: photo } = await service
    .from("guest_photos")
    .select("id, event_id, storage_path")
    .eq("id", photoId)
    .single()
  if (!photo) return null

  const { data: event } = await service
    .from("events")
    .select("user_email")
    .eq("id", photo.event_id)
    .single()
  if (!event || event.user_email !== userEmail) return null

  return photo
}

// PATCH: foto goedkeuren (pending → approved)
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const photo = await getOwnedPhoto(id, user.email)
  if (!photo) return Response.json({ error: "Geen toegang" }, { status: 403 })

  const service = createServiceClient()
  const { error } = await service
    .from("guest_photos")
    .update({ status: "approved" })
    .eq("id", id)

  if (error) {
    console.error("[guest-photos] approve:", error.message)
    return Response.json({ error: "Goedkeuren mislukt" }, { status: 500 })
  }

  return Response.json({ success: true })
}

// DELETE: foto verwijderen (kan altijd, ook achteraf) — incl. storage-object
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return Response.json({ error: "Niet ingelogd" }, { status: 401 })

  const photo = await getOwnedPhoto(id, user.email)
  if (!photo) return Response.json({ error: "Geen toegang" }, { status: 403 })

  const service = createServiceClient()

  const { error } = await service.from("guest_photos").delete().eq("id", id)
  if (error) {
    console.error("[guest-photos] delete:", error.message)
    return Response.json({ error: "Verwijderen mislukt" }, { status: 500 })
  }

  // Storage-object pas na de rij verwijderen; een wees-bestand is onschuldiger
  // dan een rij die naar een verdwenen bestand wijst.
  const { error: storageError } = await service.storage
    .from(GUEST_PHOTOS_BUCKET)
    .remove([photo.storage_path])
  if (storageError) {
    console.error("[guest-photos] storage remove:", storageError.message)
  }

  return Response.json({ success: true })
}
