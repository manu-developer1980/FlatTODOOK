import { Outlet } from 'react-router-dom';
import { Pill } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Pill className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MediTrack</h1>
          <p className="text-gray-600">Tu compañero para el seguimiento de medicamentos</p>
        </div>

        {/* Auth form container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2024 MediTrack. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}