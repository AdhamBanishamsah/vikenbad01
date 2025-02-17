"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

type Project = {
  id: string
  title: string
  status: string
}

type TimeLog = {
  id: string
  date: string
  hours: number
  project: {
    id: string
    title: string
    status: string
  }
}

type ProjectStats = {
  projectId: string
  projectTitle: string
  totalHours: number
  color: string
}

export default function UserDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch time logs first
        const timeLogsResponse = await fetch('/api/time-logs/user')
        if (!timeLogsResponse.ok) throw new Error('Failed to fetch time logs')
        const timeLogsData = await timeLogsResponse.json()
        setTimeLogs(timeLogsData)

        // Then fetch active projects
        const projectsResponse = await fetch('/api/projects/active')
        if (!projectsResponse.ok) throw new Error('Failed to fetch projects')
        const projectsData = await projectsResponse.json()
        setActiveProjects(projectsData)

        // Calculate project statistics
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
        const stats = projectsData.map((project: Project, index: number) => {
          const projectLogs = timeLogsData.filter((log: TimeLog) => log.project.id === project.id)
          const totalHours = projectLogs.reduce((sum: number, log: TimeLog) => sum + log.hours, 0)
          
          return {
            projectId: project.id,
            projectTitle: project.title,
            totalHours,
            color: colors[index % colors.length]
          }
        }).filter((stat: ProjectStats) => stat.totalHours > 0) // Only show projects with hours

        setProjectStats(stats.sort((a: ProjectStats, b: ProjectStats) => b.totalHours - a.totalHours))
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status])

  const totalHours = projectStats.reduce((sum, project) => sum + project.totalHours, 0)
  const totalProjects = projectStats.length // Only count projects with hours
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
                  className="text-sm font-medium text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">
              مرحباً {session?.user?.name}
            </h1>
            <p className="mt-2 text-gray-600">
              مرحباً بك في لوحة تحكم المستخدم. يمكنك تسجيل ساعات عملك ومتابعة سجل الساعات الخاص بك.
            </p>
          </div>

          {/* Statistics Tiles */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">إجمالي الساعات</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalHours}</p>
              <p className="mt-2 text-sm text-gray-600">ساعة عمل</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">المشاريع النشطة</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{totalProjects}</p>
              <p className="mt-2 text-sm text-gray-600">مشروع</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500">الشهر الحالي</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{currentMonth}</p>
              <p className="mt-2 text-sm text-gray-600">التقويم الميلادي</p>
            </div>
          </div>

          {/* Project Hours Chart */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">توزيع ساعات العمل</h3>
              {projectStats.length > 0 ? (
                <div className="relative h-64">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-center text-gray-500">لا توجد بيانات لعرضها</p>
              )}
            </div>

            {/* Project List */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">تفاصيل المشاريع</h3>
              {projectStats.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {projectStats.map((project) => (
                    <li key={project.projectId} className="py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div 
                          className="h-4 w-4 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="font-medium text-gray-900">{project.projectTitle}</span>
                      </div>
                      <span className="text-gray-600">{project.totalHours} ساعة</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">لا توجد مشاريع نشطة</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Link
              href="/user/time-register"
              className="group rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h2 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                تسجيل الوقت
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                قم بتسجيل ساعات عملك على المشاريع المختلفة.
              </p>
            </Link>

            <Link
              href="/user/my-log"
              className="group rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <h2 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                سجل الساعات
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                راجع سجل ساعات عملك وإحصائيات المشاريع.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 