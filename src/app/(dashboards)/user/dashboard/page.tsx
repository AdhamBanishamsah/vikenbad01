"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (session?.user?.role !== "user") {
      router.push("/auth/login")
    }
  }, [status, session, router])

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col space-y-4">
            {/* Top row with logo and sign out */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Viken Bad</h2>
              <button
                onClick={handleSignOut}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                تسجيل خروج
              </button>
            </div>
            
            {/* Bottom row with navigation */}
            <div className="flex items-center justify-between border-t pt-4">
              <nav className="flex items-center space-x-6 space-x-reverse">
                <Link 
                  href="/user/time-register"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  تسجيل الوقت
                </Link>
                <Link 
                  href="/user/my-log"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  سجلي
                </Link>
              </nav>
              <span className="text-sm font-medium text-gray-600">لوحة المستخدم</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-32">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              مرحباً بك، {session?.user?.name}!
            </h1>
            <p className="text-gray-600">
              مرحباً بك في لوحة تحكم المستخدم.
            </p>
          </div>

          {/* Content Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">تسجيل الوقت</h3>
              <p className="text-gray-600">سجل ساعات عملك وأنشطتك اليومية</p>
            </div>
            
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-gray-900">سجل النشاطات</h3>
              <p className="text-gray-600">اطلع على سجل نشاطاتك السابقة</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 