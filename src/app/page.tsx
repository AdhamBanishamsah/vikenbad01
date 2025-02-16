"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "admin") {
        router.push("/admin/dashboard")
      } else if (session?.user?.role === "user") {
        router.push("/user/dashboard")
      }
    } else if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, session, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg">جاري التحميل...</div>
    </div>
  )
} 