import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState("Procesando autenticación...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const next = searchParams.get("next") || "/dashboard";
        const code = searchParams.get("code");
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code
          );
          if (error) throw error;
          if (data.user) {
            setStatus("success");
            setMessage("¡Autenticación exitosa! Redirigiendo...");
            toast.success("Autenticación completada");
            setTimeout(() => navigate(next), 1500);
            return;
          }
        }

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (data.user) {
            setStatus("success");
            setMessage("¡Autenticación exitosa! Redirigiendo...");
            toast.success("Email confirmado exitosamente");
            setTimeout(() => navigate(next), 1500);
            return;
          }
        }

        setStatus("success");
        setMessage("Email confirmado. Inicia sesión para continuar.");
        toast.success("Email confirmado. Inicia sesión");
        setTimeout(() => navigate("/login"), 1500);
      } catch (error) {
        console.error("Error en auth callback:", error);
        setStatus("error");
        setMessage("Error al procesar la autenticación");
        toast.error("Error al confirmar el email");

        // Redirect to login after showing error
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            {status === "processing" && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            )}
            {status === "success" && (
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {status === "error" && (
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {status === "processing" && "Procesando..."}
            {status === "success" && "¡Éxito!"}
            {status === "error" && "Error"}
          </h2>
          <p className="text-gray-600">{message}</p>

          {status === "processing" && (
            <div className="mt-6">
              <LoadingSpinner size="medium" />
            </div>
          )}

          {status === "error" && (
            <div className="mt-6">
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
