import { useAuth } from '../context/AuthContext'
import AdminDashboard from './AdminDashboard'
import CustomerDashboard from './CustomerDashboard'

export default function Dashboard() {
  const { user } = useAuth()
  return user?.role === 'admin' ? <AdminDashboard /> : <CustomerDashboard />
}
