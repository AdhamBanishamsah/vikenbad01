"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

// Mock data for dashboard statistics
const mockStats = {
  totalProjects: 12,
  activeProjects: 8,
  totalUsers: 25,
  totalHours: 1250,
  monthlyStats: [
    { month: "Jan", hours: 150 },
    { month: "Feb", hours: 220 },
    { month: "Mar", hours: 180 },
    { month: "Apr", hours: 240 },
    { month: "May", hours: 260 },
    { month: "Jun", hours: 200 },
  ],
  projectDistribution: [
    { status: "مكتمل", count: 4 },
    { status: "جاري", count: 8 },
    { status: "متوقف", count: 2 },
  ],
  recentActivity: [
    { id: 1, user: "أحمد محمد", action: "تسجيل ساعات عمل", project: "مشروع 1", time: "منذ ساعة" },
    { id: 2, user: "سارة أحمد", action: "إضافة مشروع جديد", project: "مشروع 4", time: "منذ ساعتين" },
    { id: 3, user: "محمد علي", action: "تحديث حالة المشروع", project: "مشروع 2", time: "منذ 3 ساعات" },
  ]
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (session?.user?.role !== "admin") {
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
                  href="/admin/users"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  إدارة المستخدمين
                </Link>
                <Link 
                  href="/admin/projects"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  المشاريع
                </Link>
              </nav>
              <span className="text-sm font-medium text-gray-600">لوحة الإدارة</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-32">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              مرحباً بك، {session?.user?.name}!
            </h1>
            <p className="mt-2 text-gray-600">
              هذه نظرة عامة على أداء المشاريع والإحصائيات
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">إجمالي المشاريع</div>
              <div className="mt-2 flex items-baseline">
                <div className="text-3xl font-bold text-blue-600">{mockStats.totalProjects}</div>
                <div className="mr-2 text-sm text-gray-500">مشروع</div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">المشاريع النشطة</div>
              <div className="mt-2 flex items-baseline">
                <div className="text-3xl font-bold text-green-600">{mockStats.activeProjects}</div>
                <div className="mr-2 text-sm text-gray-500">مشروع</div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">عدد المستخدمين</div>
              <div className="mt-2 flex items-baseline">
                <div className="text-3xl font-bold text-purple-600">{mockStats.totalUsers}</div>
                <div className="mr-2 text-sm text-gray-500">مستخدم</div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">إجمالي الساعات</div>
              <div className="mt-2 flex items-baseline">
                <div className="text-3xl font-bold text-orange-600">{mockStats.totalHours}</div>
                <div className="mr-2 text-sm text-gray-500">ساعة</div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Hours Chart */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">ساعات العمل الشهرية</h3>
              <div className="h-64">
                <div className="flex h-full items-end space-x-2 space-x-reverse rtl:space-x-reverse">
                  {mockStats.monthlyStats.map((stat) => (
                    <div key={stat.month} className="flex flex-1 flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${(stat.hours / 300) * 100}%` }}
                      ></div>
                      <div className="mt-2 text-xs text-gray-500">{stat.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Status Distribution */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">توزيع حالات المشاريع</h3>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {mockStats.projectDistribution.map((status) => (
                  <div key={status.status} className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                    <div className="mt-1 text-sm text-gray-500">{status.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">النشاطات الأخيرة</h3>
            <div className="space-y-4">
              {mockStats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="h-10 w-10 rounded-full bg-gray-100"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.user}</div>
                      <div className="text-sm text-gray-500">
                        {activity.action} في {activity.project}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 