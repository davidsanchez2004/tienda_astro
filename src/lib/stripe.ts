import Stripe from 'stripe';

// NOTA: Hardcodeado temporalmente - mover a variables de entorno cuando Coolify las pase correctamente
const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY || 'sk_test_TU_CLAVE_AQUI';
const STRIPE_WEBHOOK_SECRET_KEY = import.meta.env.STRIPE_WEBHOOK_SECRET || 'whsec_TU_WEBHOOK_SECRET';

if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'sk_test_TU_CLAVE_AQUI') {
  console.warn('[WARN] STRIPE_SECRET_KEY no configurada - Los pagos NO funcionaran');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_TU_CLAVE_AQUI';
export const STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET_KEY;

// Helper para verificar si Stripe está configurado
export function isStripeConfigured(): boolean {
  return STRIPE_SECRET_KEY !== '' && 
         STRIPE_SECRET_KEY !== 'sk_test_TU_CLAVE_AQUI' &&
         !STRIPE_SECRET_KEY.includes('TU_CLAVE');
}
