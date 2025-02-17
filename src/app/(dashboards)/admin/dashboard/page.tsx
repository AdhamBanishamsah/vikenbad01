"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

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
  project: {
    id: string
    title: string
  }
  user: {
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

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([])
  const [userStats, setUserStats] = useState<UserStats[]>([])

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
            const uniqueUsers = new Set(projectLogs.map(log => log.user.id)).size

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

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0)
  const activeUsers = users.filter(user => user.status === 'active' && user.role === 'user').length
  const activeProjects = projects.filter(project => project.status === 'active').length
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
                  href="/admin/dashboard"
                  className="text-sm font-medium text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  لوحة التحكم
                </Link>
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
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">
              مرحباً {session?.user?.name}
            </h1>
            <p className="mt-2 text-gray-600">
              مرحباً بك في لوحة تحكم الإدارة. يمكنك متابعة إحصائيات المشاريع والمستخدمين.
            </p>
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
              <p className="mt-2 text-sm text-gray-600">التقويم الميلادي</p>
            </div>
          </div>

          {/* Project Hours Chart and Stats */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium text-gray-900">توزيع ساعات العمل حسب المشاريع</h3>
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
                    <li key={project.projectId} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div 
                            className="h-4 w-4 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="font-medium text-gray-900">{project.projectTitle}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.totalHours} ساعة | {project.userCount} مستخدم
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">لا توجد مشاريع نشطة</p>
              )}
            </div>
          </div>

          {/* User Statistics */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium text-gray-900">إحصائيات المستخدمين</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      إجمالي الساعات
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      عدد المشاريع
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {userStats.map((user) => (
                    <tr key={user.userId}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{user.totalHours} ساعة</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900">{user.projectCount} مشروع</div>
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