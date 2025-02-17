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
  locked: boolean
  lockedAt: string | null
  project: {
    id: string
    title: string
  }
  lockedBy?: {
    id: string
    name: string
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null)
  const [editData, setEditData] = useState({
    date: "",
    hours: 0,
    description: ""
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

  const handleEditClick = (log: TimeLog) => {
    setSelectedLog(log)
    setEditData({
      date: log.date,
      hours: log.hours,
      description: log.description || ""
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = (log: TimeLog) => {
    setSelectedLog(log)
    setShowDeleteModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLog) return

    try {
      const response = await fetch(`/api/time-logs?id=${selectedLog.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: editData.date,
          hours: Number(editData.hours),
          description: editData.description || null
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update time log')
      }

      // Refresh time logs
      const timeLogsResponse = await fetch('/api/time-logs/user')
      if (!timeLogsResponse.ok) throw new Error('Failed to fetch time logs')
      const timeLogsData = await timeLogsResponse.json()
      setTimeLogs(timeLogsData)

      setShowEditModal(false)
      setSelectedLog(null)
      setEditData({ date: "", hours: 0, description: "" })
    } catch (error) {
      console.error('Error updating time log:', error)
      setError(error instanceof Error ? error.message : 'Failed to update time log')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedLog) return

    try {
      const response = await fetch(`/api/time-logs?id=${selectedLog.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete time log')
      }

      // Refresh time logs
      const timeLogsResponse = await fetch('/api/time-logs/user')
      if (!timeLogsResponse.ok) throw new Error('Failed to fetch time logs')
      const timeLogsData = await timeLogsResponse.json()
      setTimeLogs(timeLogsData)

      setShowDeleteModal(false)
      setSelectedLog(null)
    } catch (error) {
      console.error('Error deleting time log:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete time log')
    }
  }

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
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(log.date).toLocaleDateString('ar', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
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
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          log.locked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {log.locked ? 'مقفل' : 'مفتوح'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        {!log.locked && (
                          <>
                            <button
                              onClick={() => handleEditClick(log)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              تعديل
                            </button>
                            <span className="mx-2 text-gray-300">|</span>
                            <button
                              onClick={() => handleDeleteClick(log)}
                              className="text-red-600 hover:text-red-900"
                            >
                              حذف
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">إغلاق</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-right">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    تعديل تسجيل الوقت
                  </h3>

                  <form onSubmit={handleEditSubmit} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700">
                          التاريخ
                        </label>
                        <input
                          type="date"
                          id="edit-date"
                          value={editData.date}
                          onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="edit-hours" className="block text-sm font-medium text-gray-700">
                          الساعات
                        </label>
                        <input
                          type="number"
                          id="edit-hours"
                          value={editData.hours}
                          onChange={(e) => setEditData({ ...editData, hours: Number(e.target.value) })}
                          required
                          min="0"
                          step="0.5"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                          الوصف
                        </label>
                        <textarea
                          id="edit-description"
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
                      >
                        حفظ التغييرات
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-right">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    تأكيد حذف تسجيل الوقت
                  </h3>

                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      هل أنت متأكد من حذف هذا التسجيل؟ لا يمكن التراجع عن هذا الإجراء.
                    </p>
                  </div>

                  <div className="mt-5 flex justify-end space-x-3 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 