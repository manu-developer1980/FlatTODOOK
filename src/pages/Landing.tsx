import { Link } from 'react-router-dom';
import { Pill, Heart, Users, Award, Smartphone, Clock, Shield, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-green-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-primary rounded-full p-4">
                <Pill className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Nunca olvides tomar tu medicación
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              MediTrack es tu compañero confiable para el seguimiento de medicamentos. 
              Recordatorios inteligentes, notificaciones para cuidadores y un sistema de gamificación 
              que hace que cuidar tu salud sea más fácil y motivador.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Comenzar Gratis
              </Link>
              <Link
                to="/login"
                className="bg-white text-primary border-2 border-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Diseñado para personas mayores
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Interfaz simple, accesible y con iconos grandes para facilitar el uso diario
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="bg-primary rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fácil de usar</h3>
              <p className="text-gray-600">
                Botones grandes, texto claro y navegación intuitiva pensada para personas mayores
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="bg-green-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Recordatorios confiables</h3>
              <p className="text-gray-600">
                Notificaciones en tu móvil y correos para cuidadores cuando falte una medicación
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="bg-orange-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Red de cuidadores</h3>
              <p className="text-gray-600">
                Invita a familiares y amigos para que reciban notificaciones y ayuden en tu cuidado
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="bg-purple-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Gamificación</h3>
              <p className="text-gray-600">
                Consigue badges y recompensas por mantener tu rutina de medicación
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="bg-blue-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Estadísticas de salud</h3>
              <p className="text-gray-600">
                Visualiza tu progreso y comparte informes con tu médico
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <div className="bg-red-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Seguro y privado</h3>
              <p className="text-gray-600">
                Tus datos médicos están protegidos y nunca se comparten sin tu consentimiento
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Planes accesibles para todos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comienza gratis y actualiza cuando necesites más funciones
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Gratis</h3>
                <div className="text-4xl font-bold text-primary mb-2">€0</div>
                <p className="text-gray-600">Para siempre</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Hasta 5 medicaciones activas
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  2 cuidadores en tu red
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Recordatorios básicos
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Estadísticas semanales
                </li>
              </ul>

              <Link
                to="/register"
                className="block w-full text-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Comenzar Gratis
              </Link>
            </div>

            <div className="bg-primary rounded-xl p-8 shadow-lg border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </span>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Plan Premium</h3>
                <div className="text-4xl font-bold text-white mb-2">€5</div>
                <p className="text-blue-100">por mes</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  Medicaciones ilimitadas
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  Cuidadores ilimitados
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  Recordatorios avanzados
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  Estadísticas completas
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  Exportación de informes
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                  Sin publicidad
                </li>
              </ul>

              <Link
                to="/register?plan=premium"
                className="block w-full text-center bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
              >
                Comenzar Prueba Gratuita
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Comienza a cuidar tu salud hoy mismo
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de personas que ya están mejorando su adherencia a medicamentos con MediTrack
          </p>
          <Link
            to="/register"
            className="bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary inline-block"
          >
            Regístrate Ahora - Es Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Pill className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">MediTrack</span>
              </div>
              <p className="text-gray-400">
                Tu compañero confiable para el seguimiento de medicamentos.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Seguridad</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Acerca de</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreras</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MediTrack. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}