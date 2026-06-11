// Endpoint de syndication : expose le ticker d'accueil au format JSON Feed 1.1.
// Objectif : permettre aux allie.es (bot Signal, site partenaire, lecteur de flux)
// de syndiquer les actualites sans scraper le HTML.
// Source unique : src/data/ticker.ts (aucune duplication de contenu).
//
// Format : https://jsonfeed.org/version/1.1
// CORS : ouvert (Access-Control-Allow-Origin: *) car c'est une ressource publique
//        en lecture seule. L'exception est declaree dans src/middleware.ts.

import type { APIRoute } from 'astro';
import { tickerItems } from '../../data/ticker';

const SITE = 'https://soundsystemhardening.fr';

// Parse le prefixe "[ TAG ] texte" d'un item de ticker.
function parseItem(raw: string) {
  const m = raw.match(/^\[\s*([^\]]+?)\s*\]\s*(.*)$/);
  const tag = m ? m[1].trim() : null;
  const text = (m ? m[2] : raw).trim();
  return { tag, text };
}

// Tente de deriver une date ISO depuis un tag type "JUIN 2026". Sinon null.
const MOIS: Record<string, number> = {
  janvier: 0, fevrier: 1, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, aout: 7, août: 7, septembre: 8, octobre: 9, novembre: 10, decembre: 11, décembre: 11,
};
function tagToDate(tag: string | null): string | null {
  if (!tag) return null;
  const m = tag.toLowerCase().match(/([a-zéèûôî]+)\s+(\d{4})/);
  if (!m || !(m[1] in MOIS)) return null;
  return new Date(Date.UTC(Number(m[2]), MOIS[m[1]], 1)).toISOString();
}

// slug stable pour l'id (independant de l'ordre d'affichage)
function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

export const GET: APIRoute = () => {
  const items = tickerItems.map((raw, i) => {
    const { tag, text } = parseItem(raw);
    const date = tagToDate(tag);
    return {
      id: `${SITE}/#news-${i + 1}-${slug(text)}`,
      url: `${SITE}/`,
      title: text,
      content_text: text,
      tags: tag ? [tag] : [],
      _category: tag,
      ...(date ? { date_published: date } : {}),
    };
  });

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'SoundSystemHardening - Actualites',
    home_page_url: SITE,
    feed_url: `${SITE}/api/news.json`,
    description: 'Veille droits, opsec et repression du mouvement free party. Flux libre de syndication.',
    language: 'fr',
    icon: `${SITE}/favicon-512.png`,
    favicon: `${SITE}/favicon-32.png`,
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      // Cache court : le ticker change rarement, on autorise la mise en cache CDN/lecteur.
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
};
