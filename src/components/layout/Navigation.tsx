import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  Home, 
  Pill, 
  Calendar, 
  BarChart3, 
  Menu,
  X,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  const navigationItems = [
    { name: "Inicio", href: "/dashboard", icon: Home },
    { name: "Medicamentos", href: "/medications", icon: Pill },
    { name: "Calendario", href: "/calendar", icon: Calendar },
    { name: "Estadísticas", href: "/statistics", icon: BarChart3 },
    { name: "Configuración", href: "/settings", icon: Settings }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/') {
      return true;
    }
    return location.pathname === path;
  };

  const getLinkClassName = (path: string) => {
    const baseClasses = 'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
    const activeClasses = 'bg-primary text-white';
    const inactiveClasses = 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200" role="navigation" aria-label="Navegación principal">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and brand */}
          <div className="flex items-center h-16">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-2 text-xl font-bold text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-2 py-1"
              aria-label="MediTrack - Ir al inicio"
            >
              <Pill className="w-6 h-6 flex-shrink-0" />
              <span className="inline">MediTrack</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center h-16">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-expanded={isMenuOpen}
              aria-label="Menú principal"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center h-16 space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={getLinkClassName(item.href)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Tablet Navigation - Icon only */}
          <div className="hidden md:flex lg:hidden items-center h-16 space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={getLinkClassName(item.href)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  title={item.name}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </div>


        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={getLinkClassName(item.href)}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}