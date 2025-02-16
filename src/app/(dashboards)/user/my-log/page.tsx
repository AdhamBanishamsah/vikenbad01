"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

// Mock data for time entries
const mockTimeEntries = [
  { 
    id: 1, 
    date: "2024-03-15", 
    project: "مشروع 1",
    hours: 8,
    description: "تطوير واجهة المستخدم",
    status: "معلق"
  },
  { 
    id: 2, 
    date: "2024-03-14", 
    project: "مشروع 2",
    hours: 6,
    description: "اجتماع مع العميل",
    status: "معتمد"
  },
  { 
    id: 3, 
    date: "2024-03-13", 
    project: "مشروع 1",
    hours: 7,
    description: "تطوير قاعدة البيانات",
    status: "معتمد"
  },
  { 
    id: 4, 
    date: "2024-03-12", 
    project: "مشروع 3",
    hours: 5,
    description: "اختبار الوظائف",
    status: "معتمد"
  },
]

// Mock data for projects (for filtering)
const mockProjects = [
  { id: 1, name: "مشروع 1" },
  { id: 2, name: "مشروع 2" },
  { id: 3, name: "مشروع 3" },
]

export default function MyLogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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

  // Filter time entries based on selected filters
  const filteredEntries = mockTimeEntries.filter(entry => {
    let matches = true

    if (selectedProject && entry.project !== selectedProject) {
      matches = false
    }

    if (selectedStatus && entry.status !== selectedStatus) {
      matches = false
    }

    if (startDate && entry.date < startDate) {
      matches = false
    }

    if (endDate && entry.date > endDate) {
      matches = false
    }

    return matches
  })

  // Calculate total hours
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0)

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
                  className="text-sm font-medium text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          {/* Filters Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">تصفية النتائج</h3>
              <button 
                onClick={() => {
                  setSelectedProject("")
                  setSelectedStatus("")
                  setStartDate("")
                  setEndDate("")
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                إعادة تعيين التصفية
              </button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                  المشروع
                </label>
                <select
                  id="project"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">جميع المشاريع</option>
                  {mockProjects.map((project) => (
                    <option key={project.id} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  الحالة
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">جميع الحالات</option>
                  <option value="معتمد">معتمد</option>
                  <option value="معلق">معلق</option>
                </select>
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  من تاريخ
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="rounded-xl bg-blue-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-blue-900">إجمالي الساعات</h4>
                <p className="mt-1 text-sm text-blue-700">للفترة المحددة</p>
              </div>
              <div className="text-3xl font-bold text-blue-900">{totalHours} ساعة</div>
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-xl font-semibold text-gray-900">سجل الوقت</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      المشروع
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
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{entry.date}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{entry.project}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{entry.hours}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{entry.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          entry.status === "معتمد" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {entry.status}
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