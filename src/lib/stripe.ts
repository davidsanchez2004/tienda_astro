import Stripe from 'stripe';

// Claves hardcodeadas (Coolify no pasa bien las variables de entorno)
const STRIPE_SECRET_KEY = 'sk_test_51SuuAg37m7nN8kJPkhjVFK9TjxapfrNEEoufI2uCxG87tuMBNiZqkgk9HtCtf5wlcXnJ74znWNpm3uyFVk48Q2t500RUGgys5n';
const STRIPE_WEBHOOK_SECRET_KEY = 'whsec_7K2LNsfkeJAlnc6GNgVKZUSinbhaiDwO';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SuuAg37m7nN8kJPoBcVEe7byJ8deK74TNEO7B0c1M2Yy6wN6nsId7MKqH5PAQ053DL08NuOMP2xhOfytjMw4vHT00HwmbmGWW';
export const STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET_KEY;

// Helper para verificar si Stripe está configurado
export function isStripeConfigured(): boolean {
  return STRIPE_SECRET_KEY !== '' && 
         STRIPE_SECRET_KEY !== 'sk_test_TU_CLAVE_AQUI' &&
         !STRIPE_SECRET_KEY.includes('TU_CLAVE');
}
