"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import AdminNavigation from '@/components/AdminNavigation'

type User = {
  id: string
  name: string
  email: string
}

type Project = {
  id: string
  title: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  users: User[]
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active",
    userIds: [] as string[]
  })
  const [editData, setEditData] = useState({
    id: "",
    title: "",
    description: "",
    status: "",
    userIds: [] as string[]
  })
  const [users, setUsers] = useState<User[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    } else if (session?.user?.role !== "admin") {
      router.push("/auth/login")
    }
  }, [status, session, router])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          credentials: 'include'
        })
        if (!response.ok) throw new Error('Failed to fetch users')
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    if (session?.user?.role === 'admin') {
      fetchUsers()
    }
  }, [session])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          credentials: 'include'
        })
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error('Error fetching projects:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch projects')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.role === 'admin') {
      fetchProjects()
    }
  }, [session])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      const newProject = await response.json()
      setProjects([newProject, ...projects])
      setShowModal(false)
      setFormData({ title: "", description: "", status: "active", userIds: [] })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update project')
      }

      const updatedProject = await response.json()
      setProjects(projects.map(project => project.id === updatedProject.id ? updatedProject : project))
      setShowEditModal(false)
      setEditData({ id: "", title: "", description: "", status: "", userIds: [] })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleEditClick = (project: Project) => {
    setEditData({
      id: project.id,
      title: project.title,
      description: project.description || "",
      status: project.status,
      userIds: project.users.map(user => user.id)
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setShowDeleteModal(true)
    setDeleteError("")
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return

    try {
      const response = await fetch(`/api/projects?id=${projectToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete project')
      }

      setProjects(projects.filter(project => project.id !== projectToDelete.id))
      setShowDeleteModal(false)
      setProjectToDelete(null)
    } catch (error: any) {
      setDeleteError(error.message)
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
          {/* Projects Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">إدارة المشاريع</h3>
              <button 
                onClick={() => setShowModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                إضافة مشروع جديد
              </button>
            </div>
            
            {/* Projects Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      العنوان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الوصف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      المستخدمون
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900"
                        >
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{project.description || '-'}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          project.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {project.status === 'active' ? 'نشط' : 'غير نشط'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {project.users.map(user => user.name).join(', ') || '-'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <button 
                          onClick={() => handleEditClick(project)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          تعديل
                        </button>
                        <span className="mx-2 text-gray-300">|</span>
                        <button 
                          onClick={() => handleDeleteClick(project)}
                          className="text-red-600 hover:text-red-900"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              {/* Close button */}
              <div className="absolute left-0 top-0 hidden pl-4 pt-4 rtl:left-4 rtl:right-auto sm:block">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <span className="sr-only">إغلاق</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-right">
                  <h3 className="pr-6 text-lg font-medium leading-6 text-gray-900 mb-4">
                    إضافة مشروع جديد
                  </h3>
                  
                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleCreateProject} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          العنوان
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          الوصف
                        </label>
                        <textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          الحالة
                        </label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          <option value="active">نشط</option>
                          <option value="inactive">غير نشط</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="users" className="block text-sm font-medium text-gray-700">
                          المستخدمون
                        </label>
                        <select
                          id="users"
                          multiple
                          value={formData.userIds}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                            setFormData({ ...formData, userIds: selectedOptions })
                          }}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-6">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
                      >
                        إضافة المشروع
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-right">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    تعديل المشروع
                  </h3>
                  
                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleEditProject} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                          العنوان
                        </label>
                        <input
                          type="text"
                          id="edit-title"
                          value={editData.title}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          required
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

                      <div>
                        <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                          الحالة
                        </label>
                        <select
                          id="edit-status"
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          <option value="active">نشط</option>
                          <option value="inactive">غير نشط</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="edit-users" className="block text-sm font-medium text-gray-700">
                          المستخدمون
                        </label>
                        <select
                          id="edit-users"
                          multiple
                          value={editData.userIds}
                          onChange={(e) => {
                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
                            setEditData({ ...editData, userIds: selectedOptions })
                          }}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
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
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-right">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    تأكيد حذف المشروع
                  </h3>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      هل أنت متأكد من حذف المشروع {projectToDelete?.title}؟ لا يمكن التراجع عن هذا الإجراء.
                    </p>
                  </div>

                  {deleteError && (
                    <div className="mt-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
                      {deleteError}
                    </div>
                  )}

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