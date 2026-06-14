/**
 * /api/admin/moderation — Actions de modération (admin/modérateur)
 *
 * POST { action:'review', id, decision:'approved'|'rejected', note? }
 * POST { action:'import-github' }   → tire les Issues ouvertes du repo dans la file
 *
 * L'import GitHub utilise GITHUB_REPO (ex: "KernelRequiem/SoundSystemHardening")
 * et, optionnellement, GITHUB_TOKEN (augmente le quota et permet les repos privés).
 * Aucun token n'est jamais renvoyé au client.
 */
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/adminAuth';
import { reviewContribution, importGithubContributions } from '../../../lib/adminStore';

const ORIGIN = 'https://soundsystemhardening.fr';
export const prerender = false;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function fetchGithubIssues(): Promise<Array<{ title: string; body: string; url: string; author?: string }>> {
  const repo = process.env.GITHUB_REPO || import.meta.env.GITHUB_REPO;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error('GITHUB_REPO non configuré (format attendu : owner/repo).');
  }
  const token = process.env.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'HardeningCore',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // state=open, on exclut les PR (l'API issues les inclut, on filtre sur pull_request).
  const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=50&sort=created`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} (${res.status === 404 ? 'repo introuvable' : res.status === 403 ? 'quota/token' : 'erreur'}).`);
  }
  const items = (await res.json()) as Array<{
    title?: string; body?: string; html_url?: string; pull_request?: unknown; user?: { login?: string };
  }>;
  return items
    .filter((i) => !i.pull_request) // on ne garde que les vraies Issues
    .map((i) => ({
      title: String(i.title || '(sans titre)'),
      body: String(i.body || ''),
      url: String(i.html_url || ''),
      author: i.user?.login,
    }))
    .filter((i) => i.url);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = checkAdminAuth(cookies);
  if (!auth.valid || !auth.email) return json({ ok: false, error: 'Non autorisé.' }, 401);

  const origin = request.headers.get('origin');
  if (origin && origin !== ORIGIN && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return json({ ok: false, error: 'Origine non autorisée.' }, 403);
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'JSON invalide.' }, 400); }

  const action = String(body.action || '');

  if (action === 'review') {
    const id = String(body.id || '');
    const decision = body.decision === 'approved' ? 'approved' : body.decision === 'rejected' ? 'rejected' : null;
    if (!decision) return json({ ok: false, error: 'Décision invalide.' }, 400);
    const res = reviewContribution(id, decision, auth.email, body.note ? String(body.note) : undefined);
    return res.ok ? json({ ok: true }) : json({ ok: false, error: res.error }, 400);
  }

  if (action === 'import-github') {
    try {
      const issues = await fetchGithubIssues();
      const added = importGithubContributions(issues);
      return json({ ok: true, fetched: issues.length, added });
    } catch (e) {
      return json({ ok: false, error: e instanceof Error ? e.message : 'Échec import GitHub.' }, 502);
    }
  }

  return json({ ok: false, error: 'Action inconnue.' }, 400);
};

export const GET: APIRoute = () => new Response(null, { status: 405 });
