import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProtectedRoute() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}