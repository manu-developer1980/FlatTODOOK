import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { useNotificationScheduler } from '@/hooks/useNotificationScheduler';

export default function Layout() {
  // Initialize notification scheduling
  useNotificationScheduler();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}