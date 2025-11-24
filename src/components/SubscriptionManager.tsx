import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { SubscriptionService } from "@/services/subscriptionService";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Check, X, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function SubscriptionManager() {
  const { user, subscription, loadSubscription } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user, loadSubscription]);

  const handleUpgradeToPremium = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para cambiar tu suscripción");
      return;
    }

    setIsProcessing(true);
    try {
      const { sessionId } =
        (await SubscriptionService.createCheckoutSession()) as any;
      if (!sessionId) {
        toast.error("Error al crear sesión de pago");
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("Stripe no está configurado");
        return;
      }
      // Use the new Stripe API - redirectToCheckout has been replaced
      window.location.href = `/checkout?session_id=${sessionId}`;
    } catch (error) {
      console.error("Error upgrading to premium:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || subscription?.plan !== "premium") {
      toast.error("No tienes una suscripción premium activa");
      return;
    }

    if (
      !confirm(
        "¿Estás seguro de que quieres cancelar tu suscripción premium? Tu plan cambiará a gratuito al final del período de facturación actual."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const updatedSubscription =
        await SubscriptionService.cancelSubscription();
      if (updatedSubscription) {
        toast.success(
          "Suscripción cancelada exitosamente. Tu plan cambiará a gratuito al final del período actual."
        );
        await loadSubscription();
      } else {
        toast.error("Error al cancelar la suscripción");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error("Error al cancelar la suscripción");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isPremiumActive =
    subscription?.plan === "premium" && subscription?.status === "active";
  const isPremiumCanceled =
    subscription?.plan === "premium" && subscription?.status === "canceled";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suscripción</h1>
        <p className="text-gray-600">
          Gestiona tu plan de suscripción en MediTrack
        </p>
      </div>

      {/* Estado actual */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-full ${
                isPremiumActive ? "bg-yellow-100" : "bg-gray-100"
              }`}>
              <Crown
                className={`h-6 w-6 ${
                  isPremiumActive ? "text-yellow-600" : "text-gray-600"
                }`}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isPremiumActive ? "Plan Premium" : "Plan Gratuito"}
              </h2>
              <p className="text-gray-600">
                {isPremiumActive
                  ? "Tienes acceso completo a todas las funciones"
                  : "Acceso limitado a funciones básicas"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {isPremiumActive ? "5,00 €" : "0,00 €"}
            </div>
            <div className="text-sm text-gray-600">por mes</div>
          </div>
        </div>

        {subscription && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estado</p>
                <p className="font-medium">
                  {subscription.status === "active" && "Activa"}
                  {subscription.status === "canceled" && "Cancelada"}
                  {subscription.status === "past_due" && "Pago pendiente"}
                  {subscription.status === "unpaid" && "Sin pagar"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Próxima facturación
                </p>
                <p className="font-medium">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>
            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Tu suscripción se cancelará el{" "}
                  {formatDate(subscription.current_period_end)} y cambiará al
                  plan gratuito.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Características */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Plan Gratuito
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Hasta 5 medicaciones activas</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>2 cuidadores en tu red</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Recordatorios básicos</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Estadísticas semanales</span>
            </li>
          </ul>
          {!isPremiumActive && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">Este es tu plan actual</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-yellow-200">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Plan Premium
            </h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Medicaciones ilimitadas</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Cuidadores ilimitados</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Recordatorios avanzados</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Estadísticas completas</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Exportación de informes</span>
            </li>
          </ul>
          {isPremiumActive && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">Este es tu plan actual</p>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {isPremiumActive ? (
          <div className="space-y-4">
            <button
              onClick={handleCancelSubscription}
              disabled={
                isLoading || isProcessing || subscription?.cancel_at_period_end
              }
              className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {subscription?.cancel_at_period_end
                ? "Cancelación programada"
                : "Cancelar suscripción"}
            </button>
            {subscription?.cancel_at_period_end && (
              <p className="text-sm text-gray-600">
                Tu suscripción ya está programada para cancelarse. Contacta con
                soporte si necesitas ayuda.
              </p>
            )}
          </div>
        ) : (
          <button
            onClick={handleUpgradeToPremium}
            disabled={isProcessing}
            className="w-full md:w-auto px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Actualizar a Premium
          </button>
        )}
      </div>
    </div>
  );
}
