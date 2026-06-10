// src/pages/api/signalement.ts
// Endpoint SSR — reçoit un signalement de problème wiki, envoie un email via SMTP Infomaniak.
// Variables d'environnement requises : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // ── Parse body ────────────────────────────────────────────────────────────
  const ct = request.headers.get('content-type') || '';
  let data: Record<string, string> = {};

  if (ct.includes('application/json')) {
    data = await request.json();
  } else {
    const text = await request.text();
    new URLSearchParams(text).forEach((v, k) => { data[k] = v; });
  }

  // ── Honeypot ──────────────────────────────────────────────────────────────
  if (data['bot-field']) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // ── Validation ────────────────────────────────────────────────────────────
  if (!data.type?.trim() || !data.description?.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Champs requis manquants (type, description).' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Envoi SMTP ────────────────────────────────────────────────────────────
  // process.env = lecture au runtime (Coolify injecte les vars sur le container)
  const smtpHost = process.env.SMTP_HOST || import.meta.env.SMTP_HOST || 'mail.infomaniak.com';
  const smtpPort = Number(process.env.SMTP_PORT || import.meta.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || import.meta.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || import.meta.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error('[API /signalement] SMTP credentials manquants — vérifier les variables d\'environnement.');
    return new Response(
      JSON.stringify({ ok: false, error: 'Configuration serveur incomplète. Passez par Signal.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const body = [
    `Type         : ${data.type}`,
    `Page         : ${data.page?.trim() || 'Non renseignée'}`,
    ``,
    `Description`,
    `─────────────────────────────────────────`,
    data.description,
    ``,
    `─────────────────────────────────────────`,
    `Soumis via soundsystemhardening.fr/contact`,
  ].join('\n');

  try {
    await transporter.sendMail({
      from:    `"SoundSystem Hardening" <${smtpUser}>`,
      to:      process.env.CONTACT_TO || import.meta.env.CONTACT_TO,
      subject: `[Signalement SSH] ${data.type}${data.page ? ' — ' + data.page : ''}`,
      text:    body,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[API /signalement] SMTP error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Erreur lors de l\'envoi. Réessayez ou ouvrez une issue GitHub.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
