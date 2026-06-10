// src/pages/api/health.ts
// Diagnostic endpoint — vérifie que le serveur SSR tourne et que les vars d'env sont présentes.
// À SUPPRIMER après débogage.

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const smtpUser  = process.env.SMTP_USER;
  const smtpPass  = process.env.SMTP_PASS;
  const smtpHost  = process.env.SMTP_HOST;
  const contactTo = process.env.CONTACT_TO;
  const smtpPort  = process.env.SMTP_PORT;

  const payload = {
    ok: true,
    server: 'SSR running',
    env: {
      SMTP_HOST:  smtpHost  ? smtpHost              : 'MANQUANT',
      SMTP_PORT:  smtpPort  ? smtpPort              : 'MANQUANT (défaut 587)',
      SMTP_USER:  smtpUser  ? smtpUser              : 'MANQUANT',
      SMTP_PASS:  smtpPass  ? '***défini***'        : 'MANQUANT',
      CONTACT_TO: contactTo ? contactTo             : 'MANQUANT',
    },
    allEnvSet: !!(smtpUser && smtpPass && smtpHost && contactTo),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
