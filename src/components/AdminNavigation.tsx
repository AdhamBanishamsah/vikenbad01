"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function AdminNavigation() {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col space-y-4">
          {/* Top row with logo and sign out */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Viken Bad</h2>
            <button
              onClick={() => router.push('/auth/login')}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="تسجيل خروج"
            >
              تسجيل خروج
            </button>
          </div>
          
          {/* Bottom row with navigation */}
          <div className="flex items-center justify-between border-t pt-4">
            <nav className="flex items-center space-x-6 space-x-reverse">
              <Link 
                href="/admin/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="لوحة التحكم"
              >
                لوحة التحكم
              </Link>
              <Link 
                href="/admin/users"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="إدارة المستخدمين"
              >
                إدارة المستخدمين
              </Link>
              <Link 
                href="/admin/projects"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="المشاريع"
              >
                المشاريع
              </Link>
            </nav>
            <span className="text-sm font-medium text-gray-600">لوحة الإدارة</span>
          </div>
        </div>
      </div>
    </header>
  )
} 