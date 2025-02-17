"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import AdminNavigation from '@/components/AdminNavigation'

ChartJS.register(ArcElement, Tooltip, Legend)

type User = {
  id: string
  name: string
  email: string
  role: string
  status: string
}

type Project = {
  id: string
  title: string
  status: string
}

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
  user: {
    id: string
    name: string
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
  userCount: number
  color: string
}

type UserStats = {
  userId: string
  userName: string
  totalHours: number
  projectCount: number
}

type ReportFilters = {
  type: 'project' | 'user'
  projectId?: string
  userId?: string
  startDate: string
  endDate: string
  lockStatus?: 'locked' | 'unlocked'
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    type: 'project',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    lockStatus: undefined
  })
  const [reportError, setReportError] = useState("")
  const [generatingReport, setGeneratingReport] = useState(false)
  const [lockingLogs, setLockingLogs] = useState(false)
  const [lockSuccess, setLockSuccess] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (session?.user?.role !== "admin") {
      router.push("/auth/login")
    }
  }, [status, session, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersResponse = await fetch('/api/users')
        if (!usersResponse.ok) throw new Error('Failed to fetch users')
        const usersData = await usersResponse.json()
        setUsers(usersData.filter((user: User) => user.status === 'active'))

        // Fetch all projects
        const projectsResponse = await fetch('/api/projects')
        if (!projectsResponse.ok) throw new Error('Failed to fetch projects')
        const projectsData = await projectsResponse.json()
        setProjects(projectsData.filter((project: Project) => project.status === 'active'))

        // Fetch all time logs
        const timeLogsResponse = await fetch('/api/time-logs/all')
        if (!timeLogsResponse.ok) throw new Error('Failed to fetch time logs')
        const timeLogsData = await timeLogsResponse.json()
        setTimeLogs(timeLogsData)

        // Calculate project statistics
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const projectStats = projectsData
          .filter((project: Project) => project.status === 'active')
          .map((project: Project, index: number) => {
            const projectLogs = timeLogsData.filter((log: TimeLog) => log.project.id === project.id)
            const totalHours = projectLogs.reduce((sum: number, log: TimeLog) => sum + log.hours, 0)
            const uniqueUsers = new Set(projectLogs.map((log: TimeLog) => log.user.id)).size 

            return {
              projectId: project.id,
              projectTitle: project.title,
              totalHours,
              userCount: uniqueUsers,
              color: colors[index % colors.length]
            }
          })
          .filter((stat: ProjectStats) => stat.totalHours > 0)
          .sort((a: ProjectStats, b: ProjectStats) => b.totalHours - a.totalHours)

        setProjectStats(projectStats)

        // Calculate user statistics
        const userStats = usersData
          .filter((user: User) => user.status === 'active' && user.role === 'user')
          .map((user: User) => {
            const userLogs = timeLogsData.filter((log: TimeLog) => log.user.id === user.id)
            const totalHours = userLogs.reduce((sum: number, log: TimeLog) => sum + log.hours, 0)
            const uniqueProjects = new Set(userLogs.map((log: TimeLog) => log.project.id)).size

            return {
              userId: user.id,
              userName: user.name,
              totalHours,
              projectCount: uniqueProjects
            }
          })
          .sort((a: UserStats, b: UserStats) => b.totalHours - a.totalHours)

        setUserStats(userStats)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    if (session?.user?.role === 'admin') {
      fetchData()
    }
  }, [session])

  const totalHours = timeLogs.reduce((sum: number, log: TimeLog) => sum + log.hours, 0)
  const activeUsers = users.filter((user: User) => user.status === 'active' && user.role === 'user').length
  const activeProjects = projects.filter((project: Project) => project.status === 'active').length
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' })

  const chartData = {
    labels: projectStats.map(project => project.projectTitle),
    datasets: [{
      data: projectStats.map(project => project.totalHours),
      backgroundColor: projectStats.map(project => project.color),
      borderWidth: 0
    }]
  }

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: {
          font: {
            size: 12
          }
        }
      }
    }
  }

  const getFilteredLogs = () => {
    return timeLogs.filter(log => {
      // Project filter
      if (reportFilters.projectId && log.project.id !== reportFilters.projectId) {
        return false;
      }
      
      // User filter
      if (reportFilters.userId && log.user.id !== reportFilters.userId) {
        return false;
      }
      
      // Lock status filter
      if (reportFilters.lockStatus === 'locked' && !log.locked) {
        return false;
      }
      if (reportFilters.lockStatus === 'unlocked' && log.locked) {
        return false;
      }
      
      // Date range filter
      if (reportFilters.startDate || reportFilters.endDate) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0); // Normalize time to start of day
        
        if (reportFilters.startDate) {
          const startDate = new Date(reportFilters.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (logDate < startDate) return false;
        }
        
        if (reportFilters.endDate) {
          const endDate = new Date(reportFilters.endDate);
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          if (logDate > endDate) return false;
        }
      }
      
      return true;
    });
  }

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setReportError("")
    setGeneratingReport(true)

    try {
      const filteredLogsToReport = getFilteredLogs();

      if (filteredLogsToReport.length === 0) {
        throw new Error('لا توجد سجلات في النطاق المحدد')
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportFilters,
          timeLogIds: filteredLogsToReport.map(log => log.id)
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate report')
      }

      // Create a CSV string
      const csvRows = [
        ['Date', 'User', 'Project', 'Hours', 'Description', 'Status'],
        ...data.timeLogs.map((log: any) => [
          new Date(log.date).toLocaleDateString('ar', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          log.user.name,
          log.project.title,
          log.hours,
          log.description,
          log.locked ? 'مقفل' : 'مفتوح'
        ])
      ]
      csvRows.push(['', '', '', '', '', ''])
      csvRows.push(['Total Hours:', '', '', data.metadata.totalHours, '', ''])

      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(',')).join('\n')

      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `time-logs-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setShowReportModal(false)
    } catch (error: any) {
      console.error('Error generating report:', error)
      setReportError(error.message || 'Failed to generate report')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleLockTimeLogs = async () => {
    setLockingLogs(true)
    setLockSuccess(false)
    setReportError("")

    try {
      const filteredLogs = getFilteredLogs();
      const logsToLock = filteredLogs
        .filter(log => !log.locked)
        .map(log => log.id);

      if (logsToLock.length === 0) {
        throw new Error('لا توجد سجلات مفتوحة للقفل في النطاق المحدد')
      }

      const response = await fetch('/api/time-logs/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeLogIds: logsToLock,
          startDate: reportFilters.startDate,
          endDate: reportFilters.endDate,
          ...(reportFilters.projectId && { projectId: reportFilters.projectId }),
          ...(reportFilters.userId && { userId: reportFilters.userId }),
          ...(reportFilters.lockStatus && { lockStatus: reportFilters.lockStatus })
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lock time logs')
      }

      // Refresh time logs data
      const timeLogsResponse = await fetch('/api/time-logs/all')
      if (!timeLogsResponse.ok) throw new Error('Failed to fetch time logs')
      const timeLogsData = await timeLogsResponse.json()
      setTimeLogs(timeLogsData)

      setLockSuccess(true)
      setTimeout(() => setLockSuccess(false), 3000) // Hide success message after 3 seconds
    } catch (error: any) {
      console.error('Error locking time logs:', error)
      setReportError(error.message)
    } finally {
      setLockingLogs(false)
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
      <AdminNavigation />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-32">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  مرحباً {session?.user?.name}
                </h1>
                <p className="mt-2 text-gray-600">
                  مرحباً بك في لوحة تحكم الإدارة. يمكنك متابعة إحصائيات المشاريع والمستخدمين.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                إنشاء تقرير
              </button>
            </div>
          </div>

          {/* Statistics Tiles */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">إجمالي الساعات</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalHours}</p>
              <p className="mt-2 text-sm text-gray-600">ساعة عمل</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">المستخدمون النشطون</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{activeUsers}</p>
              <p className="mt-2 text-sm text-gray-600">مستخدم</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">المشاريع النشطة</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{activeProjects}</p>
              <p className="mt-2 text-sm text-gray-600">مشروع</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">الشهر الحالي</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{currentMonth}</p>
              <p className="mt-2 text-sm text-gray-600">2024</p>
            </div>
          </div>

          {/* Project Statistics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Project Hours Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">توزيع ساعات العمل حسب المشروع</h3>
              <div className="relative h-64">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Top Users List */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">أفضل المستخدمين أداءً</h3>
              <div className="space-y-4">
                {userStats.slice(0, 5).map(user => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.userName}</p>
                      <p className="text-sm text-gray-500">{user.projectCount} مشاريع</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{user.totalHours} ساعة</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Logs List Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">سجلات الوقت</h3>
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  إنشاء تقرير
                </button>
                <button
                  onClick={handleLockTimeLogs}
                  disabled={lockingLogs}
                  className="rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {lockingLogs ? 'جاري قفل السجلات...' : 'قفل السجلات'}
                </button>
              </div>
            </div>
            
            {/* Success Message */}
            {lockSuccess && (
              <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
                تم قفل السجلات بنجاح
              </div>
            )}
            
            {/* Filters */}
            <div className="mb-4 flex space-x-4 space-x-reverse">
              <div className="w-48">
                <select
                  value={reportFilters.projectId || ''}
                  onChange={(e) => setReportFilters({ 
                    ...reportFilters, 
                    projectId: e.target.value || undefined 
                  })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">كل المشاريع</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <select
                  value={reportFilters.userId || ''}
                  onChange={(e) => setReportFilters({ 
                    ...reportFilters, 
                    userId: e.target.value || undefined 
                  })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">كل المستخدمين</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <select
                  value={reportFilters.lockStatus || ''}
                  onChange={(e) => setReportFilters({ 
                    ...reportFilters, 
                    lockStatus: e.target.value as 'locked' | 'unlocked' | undefined 
                  })}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">كل السجلات</option>
                  <option value="locked">المقفلة</option>
                  <option value="unlocked">المفتوحة</option>
                </select>
              </div>
            </div>

            {/* Time Logs Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      المستخدم
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
                      تاريخ القفل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      تم القفل بواسطة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {getFilteredLogs().map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {new Date(log.date).toLocaleDateString('ar', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {log.user.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {log.project.title}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {log.hours}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.description || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          log.locked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {log.locked ? 'مقفل' : 'مفتوح'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {log.lockedAt ? new Date(log.lockedAt).toLocaleDateString('ar', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {log.lockedBy?.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
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
                    إنشاء تقرير
                  </h3>
                  
                  {reportError && (
                    <div className="mt-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
                      {reportError}
                    </div>
                  )}

                  <form onSubmit={handleGenerateReport} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          نوع التقرير
                        </label>
                        <select
                          id="type"
                          value={reportFilters.type}
                          onChange={(e) => setReportFilters({ 
                            ...reportFilters, 
                            type: e.target.value as 'project' | 'user',
                            projectId: undefined,
                            userId: undefined
                          })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          <option value="project">حسب المشروع</option>
                          <option value="user">حسب المستخدم</option>
                        </select>
                      </div>

                      {reportFilters.type === 'project' && (
                        <div>
                          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                            المشروع
                          </label>
                          <select
                            id="projectId"
                            value={reportFilters.projectId}
                            onChange={(e) => setReportFilters({ ...reportFilters, projectId: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="">كل المشاريع</option>
                            {projects.map(project => (
                              <option key={project.id} value={project.id}>
                                {project.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {reportFilters.type === 'user' && (
                        <div>
                          <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                            المستخدم
                          </label>
                          <select
                            id="userId"
                            value={reportFilters.userId}
                            onChange={(e) => setReportFilters({ ...reportFilters, userId: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="">كل المستخدمين</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                          تاريخ البداية
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={reportFilters.startDate}
                          onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                          تاريخ النهاية
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={reportFilters.endDate}
                          onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end space-x-3 space-x-reverse">
                      <button
                        type="submit"
                        disabled={generatingReport}
                        className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {generatingReport ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 