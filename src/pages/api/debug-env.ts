// src/pages/api/debug-env.ts
// ENDPOINT DÉSACTIVÉ — supprimé de l'API publique pour réduire la surface d'attaque.
// Même en retournant 404 en production, son existence révèle la liste des variables
// d'environnement internes et constitue une information utile pour un attaquant.

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
