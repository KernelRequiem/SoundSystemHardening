/**
 * adminAuth.ts — Authentification opérationnelle interne
 * HMAC-SHA256 pour les tokens de session · PBKDF2 pour les mots de passe
 * Accès réservé : admin | moderateur
 */

import { createHmac, timingSafeEqual, pbkdf2Sync, randomBytes } from 'crypto';
import type { AstroCookies } from 'astro';

// ── Constantes ────────────────────────────────────────────────────────
export const ADMIN_COOKIE  = '_ssh_ops';           // Nom opaque du cookie de session
export const TOKEN_TTL_MS  = 8 * 60 * 60 * 1000;  // 8h de session
export const PBKDF2_ITERS  = 150_000;              // Itérations PBKDF2-SHA256
export const PBKDF2_KEYLEN = 32;                   // Longueur de la clé dérivée (bytes)

// ── Roles ─────────────────────────────────────────────────────────────
export type AdminRole = 'admin' | 'moderator';

export interface TokenPayload {
  email: string;
  role:  AdminRole;
  iat:   number;
  exp:   number;
}

export interface AuthResult {
  valid:  boolean;
  email?: string;
  role?:  AdminRole;
}

// ── HMAC token signing ────────────────────────────────────────────────
/**
 * Signe un payload JSON avec HMAC-SHA256.
 * Format : base64url(JSON) . base64url(HMAC)
 */
export function signToken(payload: TokenPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Vérifie et décode un token signé.
 * Utilise timingSafeEqual pour résister aux timing attacks.
 */
export function verifyToken(token: string, secret: string): { valid: boolean; payload?: TokenPayload } {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 0) return { valid: false };

    const data = token.slice(0, dot);
    const sig  = token.slice(dot + 1);

    const expected = createHmac('sha256', secret).update(data).digest('base64url');

    // Comparaison en temps constant — résiste aux attaques temporelles
    const sigBuf = Buffer.from(sig,      'base64url');
    const expBuf = Buffer.from(expected, 'base64url');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false };
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (Date.now() > payload.exp) return { valid: false }; // Token expiré
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

// ── Cookie session ────────────────────────────────────────────────────
/** Vérifie le cookie de session Astro et retourne le résultat d'auth. */
export function checkAdminAuth(cookies: AstroCookies): AuthResult {
  const raw    = cookies.get(ADMIN_COOKIE)?.value;
  if (!raw) return { valid: false };

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.error('[adminAuth] ADMIN_SECRET manquant — accès refusé par défaut');
    return { valid: false };
  }

  const result = verifyToken(raw, secret);
  if (!result.valid || !result.payload) return { valid: false };

  return {
    valid: true,
    email: result.payload.email,
    role:  result.payload.role,
  };
}

/** Construit la valeur du cookie Set-Cookie pour une nouvelle session. */
export function makeSessionCookieHeader(email: string, role: AdminRole, secret: string): string {
  const payload: TokenPayload = {
    email,
    role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const token  = signToken(payload, secret);
  const maxAge = Math.floor(TOKEN_TTL_MS / 1000);

  // Flag Secure uniquement en production (HTTPS).
  // En développement HTTP, le navigateur rejette silencieusement un cookie Secure
  // et la session ne s'établit jamais — l'absence de Secure en dev est intentionnelle.
  const isProduction = process.env.NODE_ENV === 'production';

  const parts = [
    `${ADMIN_COOKIE}=${token}`,
    // Path limité à la console admin : le cookie de session n'est jamais envoyé
    // sur les pages publiques. Doit rester aligné sur TERRAIN_PREFIX (middleware).
    'Path=/hardeningcore',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (isProduction) parts.push('Secure');

  return parts.join('; ');
}

/** Construit le header Set-Cookie pour invalider la session. */
export function clearSessionCookieHeader(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const base = `${ADMIN_COOKIE}=; Path=/hardeningcore; HttpOnly; SameSite=Strict; Max-Age=0`;
  return isProduction ? base + '; Secure' : base;
}

// ── Credential verification ───────────────────────────────────────────
/**
 * Format de la variable d'env ADMIN_CREDS :
 * "email1:pbkdf2_hash1:role1;email2:pbkdf2_hash2:role2"
 *
 * Les hashes sont générés avec scripts/gen-admin-hash.mjs
 * Algorithme : PBKDF2-SHA256(password, ADMIN_SECRET, 150000, 32)
 */
export function checkCredentials(email: string, password: string): AuthResult {
  const credsEnv = process.env.ADMIN_CREDS;
  const secret   = process.env.ADMIN_SECRET;

  if (!credsEnv || !secret) {
    console.error('[adminAuth] ADMIN_CREDS ou ADMIN_SECRET manquant');
    return { valid: false };
  }

  // Dérivation PBKDF2 du mot de passe soumis
  const submittedHash = pbkdf2Sync(
    password,
    secret,          // Salt = ADMIN_SECRET (spécifique à l'installation)
    PBKDF2_ITERS,
    PBKDF2_KEYLEN,
    'sha256'
  ).toString('hex');

  for (const entry of credsEnv.split(';')) {
    const parts = entry.trim().split(':');
    if (parts.length < 2) continue;

    const [storedEmail, storedHash, rawRole] = parts;
    if (!storedEmail || !storedHash) continue;

    const role: AdminRole = rawRole === 'admin' ? 'admin' : 'moderator';

    try {
      // Padding pour timingSafeEqual (longueurs identiques)
      const eBuf = Buffer.allocUnsafe(256).fill(0);
      const sBuf = Buffer.allocUnsafe(256).fill(0);
      Buffer.from(email.toLowerCase().trim()).copy(eBuf);
      Buffer.from(storedEmail.toLowerCase().trim()).copy(sBuf);

      const hBuf = Buffer.from(submittedHash, 'hex');
      const rBuf = Buffer.from(storedHash,    'hex');

      const emailOk = timingSafeEqual(eBuf, sBuf);
      // timingSafeEqual requiert buffers de même longueur
      if (hBuf.length !== rBuf.length) continue;
      const passOk  = timingSafeEqual(hBuf, rBuf);

      if (emailOk && passOk) return { valid: true, email, role };
    } catch {
      continue;
    }
  }

  return { valid: false };
}

// ── Utility ───────────────────────────────────────────────────────────
/** Génère un ADMIN_SECRET aléatoire de 48 bytes (96 chars hex). */
export function generateSecret(): string {
  return randomBytes(48).toString('hex');
}
