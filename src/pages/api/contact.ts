// src/pages/api/contact.ts
// Endpoint SSR - reçoit le formulaire de contact, envoie un email via SMTP Infomaniak.
// Variables d'environnement requises : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

// Origine autorisée — doit correspondre à la valeur dans middleware.ts
const CORS_ORIGIN = 'https://soundsystemhardening.fr';
const corsHeaders = {
  'Access-Control-Allow-Origin':  CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

export const POST: APIRoute = async ({ request }) => {
  // ── Parse body (JSON ou form-urlencoded) ──────────────────────────────────
  const ct = request.headers.get('content-type') || '';
  let data: Record<string, string> = {};

  if (ct.includes('application/json')) {
    data = await request.json();
  } else {
    const text = await request.text();
    new URLSearchParams(text).forEach((v, k) => { data[k] = v; });
  }

  // ── Honeypot anti-bot ────────────────────────────────────────────────────
  if (data['bot-field']) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  }

  // ── Validation ────────────────────────────────────────────────────────────
  if (!data.objet?.trim() || !data.message?.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Champs requis manquants (objet, message).' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // ── Envoi SMTP ────────────────────────────────────────────────────────────
  // process.env = lecture au runtime (Coolify injecte les vars sur le container)
  // Lire depuis process.env (runtime Docker/Coolify) avec fallback import.meta.env (dev local)
  const smtpHost = process.env.SMTP_HOST || import.meta.env.SMTP_HOST || 'mail.infomaniak.com';
  const smtpPort = Number(process.env.SMTP_PORT || import.meta.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER || import.meta.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || import.meta.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error('[API /contact] SMTP credentials manquants - vérifier les variables d\'environnement.');
    return new Response(
      JSON.stringify({ ok: false, error: 'Configuration serveur incomplète. Passez par Signal.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const body = [
    `Objet        : ${data.objet}`,
    ``,
    `Message`,
    `─────────────────────────────────────────`,
    data.message,
    ``,
    `Moyen de réponse : ${data.reponse?.trim() || 'Non renseigné'}`,
    ``,
    `─────────────────────────────────────────`,
    `Soumis via soundsystemhardening.fr/contact`,
  ].join('\n');

  try {
    await transporter.sendMail({
      from:    `"SoundSystem Hardening" <${smtpUser}>`,
      to:      process.env.CONTACT_TO || import.meta.env.CONTACT_TO,
      subject: `[Contact SSH] ${data.objet}`,
      text:    body,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('[API /contact] SMTP error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Erreur lors de l\'envoi. Réessayez ou passez par Signal.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};
