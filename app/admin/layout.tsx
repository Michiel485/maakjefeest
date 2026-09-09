import OwnerOptOut from "@/components/OwnerOptOut"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OwnerOptOut />
    </>
  )
}
