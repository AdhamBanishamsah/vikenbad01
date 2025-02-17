"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

// Mock data for all projects
const mockProjects = {
  "1": {
    id: 1,
    name: "مشروع 1",
    client: "عميل 1",
    startDate: "2024-03-01",
    endDate: "2024-06-30",
    status: "جاري",
    progress: 25,
    description: "وصف تفصيلي للمشروع وأهدافه الرئيسية",
    totalHours: 450,
    totalUsers: 8,
    budget: "150,000 kr",
  },
  "2": {
    id: 2,
    name: "مشروع 2",
    client: "عميل 2",
    startDate: "2024-02-15",
    endDate: "2024-05-15",
    status: "جاري",
    progress: 60,
    description: "وصف تفصيلي للمشروع الثاني",
    totalHours: 320,
    totalUsers: 5,
    budget: "100,000 kr",
  },
  "3": {
    id: 3,
    name: "مشروع 3",
    client: "عميل 3",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    status: "مكتمل",
    progress: 100,
    description: "وصف تفصيلي للمشروع الثالث",
    totalHours: 280,
    totalUsers: 4,
    budget: "80,000 kr",
  },
}

// Mock data for time logs
const mockTimeLogs = [
  {
    id: 1,
    user: "أحمد محمد",
    date: "2024-03-15",
    hours: 8,
    description: "تطوير واجهة المستخدم",
    status: "معتمد"
  },
  {
    id: 2,
    user: "سارة أحمد",
    date: "2024-03-15",
    hours: 6,
    description: "تصميم قاعدة البيانات",
    status: "معتمد"
  },
  {
    id: 3,
    user: "محمد علي",
    date: "2024-03-14",
    hours: 7,
    description: "اختبار الوظائف",
    status: "معلق"
  },
]

export default function ClientPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [projectDetails, setProjectDetails] = useState(mockProjects[params.id as string])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (session?.user?.role !== "admin") {
      router.push("/auth/login")
    }
  }, [status, session, router])

  useEffect(() => {
    // Update project details when params change
    setProjectDetails(mockProjects[params.id as string])
  }, [params.id])

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

  if (!projectDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">المشروع غير موجود</div>
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
                  className="text-sm font-medium text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          {/* Project Header */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{projectDetails.name}</h1>
                <p className="mt-1 text-sm text-gray-600">{projectDetails.description}</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                projectDetails.status === "مكتمل" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {projectDetails.status}
              </span>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-500">العميل</div>
                <div className="mt-1 text-lg font-semibold">{projectDetails.client}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-500">المدة</div>
                <div className="mt-1 text-lg font-semibold">
                  {projectDetails.startDate} - {projectDetails.endDate}
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-500">الميزانية</div>
                <div className="mt-1 text-lg font-semibold">{projectDetails.budget}</div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-500">نسبة الإنجاز</div>
                <div className="mt-2">
                  <div className="h-2.5 w-full rounded-full bg-gray-200">
                    <div 
                      className="h-2.5 rounded-full bg-blue-600"
                      style={{ width: `${projectDetails.progress}%` }}
                    ></div>
                  </div>
                  <span className="mt-1 text-sm text-gray-600">{projectDetails.progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">إجمالي الساعات</div>
              <div className="mt-2 flex items-baseline">
                <div className="text-3xl font-bold">{projectDetails.totalHours}</div>
                <div className="mr-2 text-sm text-gray-500">ساعة</div>
              </div>
            </div>
            
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">عدد المستخدمين</div>
              <div className="mt-2 flex items-baseline">
                <div className="text-3xl font-bold">{projectDetails.totalUsers}</div>
                <div className="mr-2 text-sm text-gray-500">مستخدم</div>
              </div>
            </div>
            
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-gray-500">متوسط الساعات اليومي</div>
              <div className="mt-2 flex items-baseline">
                <div className="text-3xl font-bold">
                  {(projectDetails.totalHours / 30).toFixed(1)}
                </div>
                <div className="mr-2 text-sm text-gray-500">ساعة/يوم</div>
              </div>
            </div>
          </div>

          {/* Time Logs Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">سجل الوقت</h3>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                تصدير التقرير
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الساعات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الوصف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {mockTimeLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{log.user}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">{log.date}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{log.hours}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{log.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          log.status === "معتمد" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 