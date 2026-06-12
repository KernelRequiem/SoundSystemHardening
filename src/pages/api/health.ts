// src/pages/api/health.ts
// Sonde de vie minimale - confirme uniquement que le runtime SSR repond.
// Ne divulgue AUCUN detail de configuration (host SMTP, utilisateur, presence de secrets).
// Utilisable comme healthcheck conteneur sans exposer de surface d'information.

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};
