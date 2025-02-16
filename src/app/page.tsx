"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    } else if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg">جاري التحميل...</div>
    </div>
  )
} 