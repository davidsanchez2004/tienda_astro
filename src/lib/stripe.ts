import Stripe from 'stripe';

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY || '';

if (!STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY - Stripe payments will not work');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
