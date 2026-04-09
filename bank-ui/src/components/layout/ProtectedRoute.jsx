import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 border-2 border-[#0f4c81] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 font-mono tracking-wider">authenticating...</span>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-7xl font-mono font-bold text-gray-100 mb-3">403</div>
        <div className="text-sm text-gray-500">You don't have permission to view this page.</div>
      </div>
    </div>
  )

  return children
}
