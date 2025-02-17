"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

type TimeLog = {
  id: string
  date: string
  hours: number
  description: string | null
  project: {
    id: string
    title: string
  }
}

type ProjectStats = {
  projectId: string
  projectTitle: string
  totalHours: number
  logCount: number
}

export default function MyLogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [dateRange, setDateRange] = useState({
    start: "",
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/time-logs/user', {
          credentials: 'include'
        })
        if (!response.ok) throw new Error('Failed to fetch time logs')
        const data = await response.json()
        setTimeLogs(data)

        // Calculate project statistics
        const stats = data.reduce((acc: ProjectStats[], log: TimeLog) => {
          const existingStat = acc.find(stat => stat.projectId === log.project.id)
          if (existingStat) {
            existingStat.totalHours += log.hours
            existingStat.logCount += 1
          } else {
            acc.push({
              projectId: log.project.id,
              projectTitle: log.project.title,
              totalHours: log.hours,
              logCount: 1
            })
          }
          return acc
        }, [])

        setProjectStats(stats.sort((a: ProjectStats, b: ProjectStats) => b.totalHours - a.totalHours))
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      fetchData()
    }
  }, [session])

  const filteredLogs = timeLogs.filter(log => {
    const logDate = new Date(log.date)
    const startDate = dateRange.start ? new Date(dateRange.start) : null
    const endDate = dateRange.end ? new Date(dateRange.end) : null

    const matchesProject = selectedProject === "all" || log.project.id === selectedProject
    const matchesDateRange = (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate)

    return matchesProject && matchesDateRange
  })

  const totalFilteredHours = filteredLogs.reduce((sum, log) => sum + log.hours, 0)

  if (status === "loading" || loading) {
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
                onClick={() => router.push('/auth/login')}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                تسجيل خروج
              </button>
            </div>
            
            {/* Bottom row with navigation */}
            <div className="flex items-center justify-between border-t pt-4">
              <nav className="flex items-center space-x-6 space-x-reverse">
                <Link 
                  href="/user/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  لوحة التحكم
                </Link>
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
          {/* Project Statistics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projectStats.map(stat => (
              <div key={stat.projectId} className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">{stat.projectTitle}</h3>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">إجمالي الساعات</dt>
                    <dd className="mt-1 text-3xl font-semibold text-blue-600">{stat.totalHours}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">عدد التسجيلات</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.logCount}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700">
                  المشروع
                </label>
                <select
                  id="project-filter"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="all">جميع المشاريع</option>
                  {projectStats.map(stat => (
                    <option key={stat.projectId} value={stat.projectId}>
                      {stat.projectTitle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date-start" className="block text-sm font-medium text-gray-700">
                  من تاريخ
                </label>
                <input
                  type="date"
                  id="date-start"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="date-end" className="block text-sm font-medium text-gray-700">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  id="date-end"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              إجمالي الساعات المحددة: <span className="font-semibold text-blue-600">{totalFilteredHours}</span>
            </div>
          </div>

          {/* Time Logs Table */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(log.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{log.project.title}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{log.hours}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.description || '-'}</div>
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