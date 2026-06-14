/**
 * monitoring.ts — Agrégateur de monitoring pour la vue admin
 *
 * Importé directement par la page admin (SSR) plutôt qu'exposé en endpoint /api :
 * pas de nouvelle surface réseau, la donnée ne sort jamais sans passer par
 * checkAdminAuth côté page. Tout est calculé à la demande, rien n'est mis en cache.
 *
 * RÈGLE : ne JAMAIS exposer une valeur de secret. On expose uniquement des
 * booléens "présent / absent" pour les variables sensibles (SMTP_PASS, etc.).
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { getTrafficSnapshot } from './trafficStats';
import { getSecuritySnapshot } from './securityLog';

// ── Santé système ─────────────────────────────────────────────────────
export interface SystemHealth {
  nodeVersion:   string;
  platform:      string;
  pid:           number;
  processUptimeS: number;
  memory: {
    rssMb:        number;
    heapUsedMb:   number;
    heapTotalMb:  number;
  };
  env: {
    nodeEnv:      string;
    isProd:       boolean;
    maintenance:  boolean;
    // Présence (jamais la valeur) des secrets critiques.
    hasAdminSecret: boolean;
    hasAdminCreds:  boolean;
    hasSmtp:        boolean;
    hasContactTo:   boolean;
  };
}

function mb(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export function getSystemHealth(): SystemHealth {
  const m = process.memoryUsage();
  return {
    nodeVersion:    process.version,
    platform:       `${process.platform}/${process.arch}`,
    pid:            process.pid,
    processUptimeS: Math.round(process.uptime()),
    memory: {
      rssMb:       mb(m.rss),
      heapUsedMb:  mb(m.heapUsed),
      heapTotalMb: mb(m.heapTotal),
    },
    env: {
      nodeEnv:        process.env.NODE_ENV || 'undefined',
      isProd:         process.env.NODE_ENV === 'production',
      maintenance:    process.env.MAINTENANCE_MODE === 'true',
      hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
      hasAdminCreds:  Boolean(process.env.ADMIN_CREDS),
      hasSmtp:        Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      hasContactTo:   Boolean(process.env.CONTACT_TO),
    },
  };
}

// ── Signalements en attente ───────────────────────────────────────────
// Lit private/reports-pending.json (alimenté par /api/report). On expose un
// agrégat (compteur + métadonnées non sensibles), pas le contenu intégral
// brut, pour limiter la fuite si la vue admin était capturée.
export interface ReportsSummary {
  total:        number;
  pending:      number;
  lastReceived: string | null;   // ISO
  byType:       Record<string, number>;
  recent:       Array<{ lieu: string; date: string; type: string; recu_le: string }>;
}

export function getReportsSummary(): ReportsSummary {
  const file = join(process.cwd(), 'private', 'reports-pending.json');
  const empty: ReportsSummary = { total: 0, pending: 0, lastReceived: null, byType: {}, recent: [] };
  if (!existsSync(file)) return empty;

  let data: Array<Record<string, string>> = [];
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'));
    if (!Array.isArray(data)) return empty;
  } catch {
    return empty;
  }

  const byType: Record<string, number> = {};
  let pending = 0;
  let last: string | null = null;
  for (const r of data) {
    const t = (r.type || 'inconnu').slice(0, 40);
    byType[t] = (byType[t] || 0) + 1;
    if ((r.statut || 'en_attente') === 'en_attente') pending++;
    if (r.recu_le && (!last || r.recu_le > last)) last = r.recu_le;
  }

  const recent = data
    .slice()
    .sort((a, b) => (b.recu_le || '').localeCompare(a.recu_le || ''))
    .slice(0, 10)
    .map((r) => ({
      lieu:    (r.lieu || '—').slice(0, 60),
      date:    (r.date || '—').slice(0, 40),
      type:    (r.type || '—').slice(0, 40),
      recu_le: r.recu_le || '',
    }));

  return { total: data.length, pending, lastReceived: last, byType, recent };
}

// ── Snapshot complet pour la vue admin ────────────────────────────────
export function getMonitoringSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    health:      getSystemHealth(),
    traffic:     getTrafficSnapshot(),
    reports:     getReportsSummary(),
    security:    getSecuritySnapshot(60),
  };
}
