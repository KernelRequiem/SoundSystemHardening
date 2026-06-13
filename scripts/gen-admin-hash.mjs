#!/usr/bin/env node
/**
 * gen-admin-hash.mjs — Génération de hash PBKDF2 pour ADMIN_CREDS
 *
 * Usage:
 *   ADMIN_SECRET=your_secret node scripts/gen-admin-hash.mjs <password>
 *
 * Exemple complet:
 *   ADMIN_SECRET=$(cat .env | grep ADMIN_SECRET | cut -d= -f2) \
 *   node scripts/gen-admin-hash.mjs "MonMotDePasse"
 *
 * Puis ajouter dans .env:
 *   ADMIN_CREDS=pierre@ssh.fr:<hash>:admin;tech@ssh.fr:<hash2>:moderator
 */

import { pbkdf2Sync, randomBytes } from 'crypto';

const PBKDF2_ITERS  = 150_000;
const PBKDF2_KEYLEN = 32;

const password = process.argv[2];
const secret   = process.env.ADMIN_SECRET;

if (!password) {
  console.error('\n❌  Usage: ADMIN_SECRET=xxx node scripts/gen-admin-hash.mjs <password>\n');
  process.exit(1);
}

if (!secret) {
  console.error('\n❌  ADMIN_SECRET manquant. Exécute d\'abord:');
  console.error('    export ADMIN_SECRET=$(node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))")');
  console.error('    # Puis ajoute ADMIN_SECRET=<valeur> dans ton .env\n');
  process.exit(1);
}

console.log('\n⏳  Dérivation PBKDF2-SHA256 en cours (150 000 itérations)…');

const hash = pbkdf2Sync(password, secret, PBKDF2_ITERS, PBKDF2_KEYLEN, 'sha256').toString('hex');

console.log('\n✅  Hash généré:');
console.log(`    ${hash}`);
console.log('\n📋  Exemple ADMIN_CREDS (copier dans .env):');
console.log(`    ADMIN_CREDS=pierre@soundsystem.fr:${hash}:admin`);
console.log('    # Sépare plusieurs utilisateurs avec ";" :');
console.log(`    ADMIN_CREDS=pierre@soundsystem.fr:${hash}:admin;tech@soundsystem.fr:<autre_hash>:moderator\n`);
