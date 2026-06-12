// src/pages/api/debug-env.ts
// Route de debug — bloquée en production, accessible en développement uniquement.
// Retourne 404 si NODE_ENV !== 'development' ou si PROD est vrai.

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => {
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Dev uniquement : liste des variables d'env présentes (valeurs masquées)
  return new Response(
    JSON.stringify({
      NODE_ENV:           process.env.NODE_ENV ?? 'non défini',
      SMTP_HOST:          process.env.SMTP_HOST         ? '***' : 'non défini',
      SMTP_PORT:          process.env.SMTP_PORT         ? '***' : 'non défini',
      SMTP_USER:          process.env.SMTP_USER         ? '***' : 'non défini',
      SMTP_PASS:          process.env.SMTP_PASS         ? '***' : 'non défini',
      CONTACT_TO:         process.env.CONTACT_TO        ? '***' : 'non défini',
      AIRTABLE_BASE_ID:   process.env.AIRTABLE_BASE_ID  ? '***' : 'non défini',
      AIRTABLE_WRITE_TOKEN: process.env.AIRTABLE_WRITE_TOKEN ? '***' : 'non défini',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
