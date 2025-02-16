"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" })
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-900">Viken Bad</h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{session?.user?.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                تسجيل خروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            مرحباً بك، {session?.user?.name}!
          </h1>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <p className="text-lg text-gray-600">
              مرحباً بك في لوحة التحكم الخاصة بك.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
} 