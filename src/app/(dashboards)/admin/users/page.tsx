"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import AdminNavigation from '@/components/AdminNavigation'

type User = {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    status: "active"
  })
  const [editData, setEditData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "",
    status: ""
  })
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
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
        console.log('Starting fetchUsers...')
        const response = await fetch('/api/users', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })

        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))

        let errorData
        let responseData
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            responseData = await response.json()
          } catch (e) {
            console.error('Error parsing JSON:', e)
            throw new Error('Invalid JSON response from server')
          }
        } else {
          const textData = await response.text()
          console.error('Unexpected content type:', contentType, 'Response:', textData)
          throw new Error('Unexpected response format from server')
        }

        if (!response.ok) {
          errorData = responseData
          console.error('Error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          })
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`)
        }

        setUsers(responseData)
      } catch (error) {
        console.error('Error in fetchUsers:', {
          name: error instanceof Error ? error.name : 'Unknown error',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack trace',
        })
        setError(error instanceof Error ? error.message : 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.role === 'admin') {
      fetchUsers()
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" })
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user')
      }

      const newUser = await response.json()
      setUsers([newUser, ...users])
      setShowModal(false)
      setFormData({ name: "", email: "", password: "", role: "user", status: "active" })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      const updatedUser = await response.json()
      setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user))
      setShowEditModal(false)
      setEditData({ id: "", name: "", email: "", password: "", role: "", status: "" })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleEditClick = (user: User) => {
    setEditData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
    setDeleteError("")
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users?id=${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      setUsers(users.filter(user => user.id !== userToDelete.id))
      setShowDeleteModal(false)
      setUserToDelete(null)
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
          {/* Users Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">إدارة المستخدمين</h3>
              <button 
                onClick={() => setShowModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                إضافة مستخدم جديد
              </button>
            </div>
            
            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الدور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      الحالة
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
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {user.role === "admin" ? "مسؤول" : "مستخدم"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'نشط' : 'غير نشط'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          تعديل
                        </button>
                        <span className="mx-2 text-gray-300">|</span>
                        <button 
                          onClick={() => handleDeleteClick(user)}
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

      {/* New User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    إضافة مستخدم جديد
                  </h3>
                  
                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          الاسم
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          كلمة المرور
                        </label>
                        <input
                          type="password"
                          id="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          الدور
                        </label>
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          <option value="user">مستخدم</option>
                          <option value="admin">مسؤول</option>
                        </select>
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
                    </div>

                    <div className="mt-5 sm:mt-6">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
                      >
                        إضافة المستخدم
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
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
                    تعديل المستخدم
                  </h3>
                  
                  {error && (
                    <div className="mt-2 rounded-md bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleEditUser} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                          الاسم
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          id="edit-email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">
                          كلمة المرور (اتركها فارغة إذا لم ترد تغييرها)
                        </label>
                        <input
                          type="password"
                          id="edit-password"
                          value={editData.password}
                          onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
                          الدور
                        </label>
                        <select
                          id="edit-role"
                          value={editData.role}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        >
                          <option value="user">مستخدم</option>
                          <option value="admin">مسؤول</option>
                        </select>
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
                    تأكيد حذف المستخدم
                  </h3>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      هل أنت متأكد من حذف المستخدم {userToDelete?.name}؟ لا يمكن التراجع عن هذا الإجراء.
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