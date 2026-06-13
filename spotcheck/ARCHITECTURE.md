# SpotCheck — Architecture Technique Complète
**Projet SoundSystem Hardening · Usage interne uniquement**

---

## Compréhension du projet

SpotCheck est un outil d'évaluation terrain multi-critères pour identifier et comparer des spots. Il doit surpasser OSM en intégrant une couche d'analyse métier (acoustique, répression, incendie, accès, praticité) avec scoring pondéré, export PDF et notes de terrain — le tout derrière une authentification forte.

---

## Stack technique choisie

| Couche | Techno | Raison |
|---|---|---|
| Frontend | HTML/JS vanilla → migration React/Vite | Démarrage rapide, zéro dépendance build |
| Carte | **Leaflet.js** + CartoDB Dark Tiles | OSM open-source, tuiles dark gratuites, API riche |
| Graphiques | **Chart.js** | Radar chart, léger, zéro config |
| PDF | **jsPDF** | Côté client, pas de serveur nécessaire |
| Backend/DB | **Supabase** (PostgreSQL + Auth + Storage + Realtime) | Open-source, self-hostable, RLS natif |
| Auth | **Supabase Auth** (email/password + magic link) | JWT, RLS automatique, sessions sécurisées |
| Données OSM | **Overpass API** (direct depuis le navigateur) | Requêtes géospatiales OSM, gratuit |
| Déploiement | **Vercel** (static) ou **Docker** (self-hosted) | Simple, rapide, HTTPS natif |

---

## Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVIGATEUR (utilisateur terrain)                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Leaflet Map │  │  Scoring UI  │  │  PDF Export (jsPDF)  │  │
│  │  + Markers   │  │  + Radar     │  │  Rapport terrain     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│  ┌──────▼─────────────────▼────────────────────────────────┐   │
│  │            Application Logic (JS modules)                │   │
│  │  Auth · Spots · Scores · OSM · Notes · Photos · Export  │   │
│  └──────────────────────────────┬───────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ HTTPS (TLS 1.3)
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
   ┌──────▼──────┐        ┌───────▼──────┐       ┌───────▼──────┐
   │  Supabase   │        │  Overpass API│       │  Supabase    │
   │  Auth (JWT) │        │  (OSM data)  │       │  Storage     │
   │  + PostgREST│        │  overpass-   │       │  (Photos +   │
   │  + Realtime │        │  api.de      │       │   PDFs)      │
   │  PostgreSQL │        └──────────────┘       └──────────────┘
   └─────────────┘
```

### Flux d'une requête type

1. L'utilisateur se connecte → Supabase Auth émet un JWT
2. Le JWT est joint à chaque requête PostgREST (`Authorization: Bearer ...`)
3. PostgreSQL vérifie les policies RLS avant de retourner les données
4. L'analyse OSM est appelée directement depuis le navigateur vers Overpass API
5. Les photos uploadées transitent vers Supabase Storage (bucket privé)

---

## Modèle de données

### Relations principales

```
auth.users (Supabase)
    │
    └──► profiles (id, email, role: admin|tech|viewer)
              │
              └──► spots (id, name, lat, lng, type, status, notes)
                        │
                        ├──► scores (acoustique, acces, repression, incendie, praticite)
                        ├──► osm_data (résultats Overpass API, raw_json)
                        ├──► notes (historique, horodaté, auteur)
                        ├──► photos (metadata → Supabase Storage)
                        ├──► reports (PDF générés, archivés)
                        └──► spot_history (audit trail complet)
```

### Score global calculé (colonne générée PostgreSQL)

```sql
global_score = acoustique×0.30 + acces×0.20 + repression×0.25
             + incendie×0.15 + praticite×0.10
```

Les poids sont modifiables sans migration — juste une mise à jour de la colonne `generated always as`.

---

## Intégration OSM — Overpass API

### Requête type (lancée depuis le client)

```javascript
const query = `
  [out:json][timeout:15];
  (
    node["amenity"="police"](around:5000,${lat},${lng});
    node["amenity"="gendarmerie"](around:5000,${lat},${lng});
    node["amenity"="fire_station"](around:8000,${lat},${lng});
    node["emergency"="fire_hydrant"](around:500,${lat},${lng});
    way["highway"~"primary|secondary|tertiary"](around:300,${lat},${lng});
    node["public_transport"="stop_position"](around:500,${lat},${lng});
    way["power"="line"](around:200,${lat},${lng});
  );
  out body center;
`;
const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: 'data=' + encodeURIComponent(query)
});
const data = await res.json();
```

### Résultats parsés → contribution aux scores

| Donnée OSM | Impacte le critère |
|---|---|
| Distance police/gendarmerie | Répression (↑ distance = ↑ score) |
| Routes primaires à <500m | Accès |
| Caserne pompiers | Incendie |
| Bornes incendie | Incendie |
| Arrêts transport | Praticité |
| Lignes électriques | Praticité (infrastructure dispo) |

### Alternative auto-scoring

```javascript
function osmAutoScore(osmData) {
  const policeKm = osmData.police_distance / 1000;
  return {
    repression: Math.min(10, policeKm * 1.5),  // 0km=0, 6.7km=10
    incendie:   osmData.hydrant_distance < 200 ? 8 : 5,
    praticite:  osmData.transit_stops > 2 ? 8 : 5,
  };
}
```

---

## Intégration acoustique (module externe)

Le module de simulation acoustique s'intègre via une **Supabase Edge Function** ou un endpoint REST dédié :

```javascript
// Appel vers le module acoustique du projet SSH
const { data } = await supabase.functions.invoke('acoustic-analysis', {
  body: {
    lat, lng,
    radius: 500,        // Zone d'analyse en mètres
    obstacles: [],      // Bâtiments OSM injectés automatiquement
    frequency_range: [60, 120],  // Hz (basses sound system)
  }
});
// Retourne: { isolation_score, reverb_time, spillover_risk, ... }
```

---

## Authentification — Supabase Auth

### Configuration recommandée (outil privé)

```javascript
// supabase/config.toml
[auth]
site_url = "https://spotcheck.soundsystem.internal"
jwt_expiry = 3600           // 1h (renouvellement automatique)
enable_signup = false       // CRITIQUE: désactiver les inscriptions publiques
```

Seul un admin peut créer des comptes via le Dashboard Supabase ou l'API admin.

### Flux d'auth

```
Utilisateur → email/password → Supabase Auth
           → JWT (access_token + refresh_token)
           → Stocké en mémoire (pas localStorage pour sécurité)
           → Joint à chaque requête PostgREST
           → RLS vérifie le rôle dans auth.jwt() → profiles.role
```

### Niveaux de rôle

| Rôle | Permissions |
|---|---|
| `admin` | CRUD complet, gestion utilisateurs, suppression |
| `tech` | Lecture + création + modification spots/scores/notes |
| `viewer` | Lecture seule (pour partenaires externes ponctuels) |

---

## Génération PDF

Le PDF est généré **entièrement côté client** via jsPDF — zéro serveur, zéro fuite de données.

Contenu du rapport généré :
- En-tête branding SpotCheck + date
- Informations spot (nom, coordonnées, type, statut)
- Score global avec barre de progression colorée
- Détail des 5 critères avec barres de score
- Données OSM analysées
- Notes terrain
- Pied de page "CONFIDENTIEL — Usage interne"

Pour un PDF plus riche (photos intégrées, QR code, carte statique), on peut utiliser :
- **html2canvas** → screenshot du panel → intégration dans jsPDF
- **Puppeteer** côté serveur (Edge Function) pour un rendu parfait au pixel près

---

## Déploiement

### Option 1 — Vercel (recommandé pour commencer)

```bash
# Installation Vercel CLI
npm i -g vercel

# Depuis le dossier spotcheck/
vercel deploy

# Variables d'env à configurer dans Vercel Dashboard:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Avantages : HTTPS automatique, CDN mondial, déploiement en 30s, gratuit pour l'usage privé.

### Option 2 — Docker (self-hosted, full control)

```dockerfile
# Dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html/spotcheck/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html/spotcheck;
    index index.html;

    # Auth basique en complément (double couche)
    auth_basic "SpotCheck — Accès restreint";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Headers sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Content-Security-Policy "default-src 'self' https://*.supabase.co https://*.cartocdn.com https://overpass-api.de 'unsafe-inline' 'unsafe-eval'";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
}
```

```bash
docker build -t spotcheck .
docker run -p 8080:80 spotcheck

# Avec HTTPS via Traefik ou Caddy (recommandé en prod)
docker compose up -d
```

### Supabase self-hosted (optionnel)

```bash
git clone https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Éditer .env avec vos secrets
docker compose up -d
```

---

## Points d'attention

### Sécurité

- `enable_signup = false` dans Supabase pour bloquer tout accès non autorisé
- RLS activé sur toutes les tables (jamais de requête sans auth.uid())
- Ne jamais stocker le JWT dans localStorage — utiliser sessionStorage ou mémoire
- CSP strict pour limiter les domaines tiers autorisés
- Rotation des anon_key tous les 6 mois
- Logs d'audit via `spot_history` pour toute action sensible

### Maintenabilité

- Le fichier `index.html` actuel est un prototype — migrer vers **Vite + React** quand l'équipe dépasse 2-3 devs
- Supabase PostgREST + RLS = zéro code backend custom à maintenir
- Le schéma SQL est versionné dans ce repo — utiliser `supabase db push` pour les migrations

### Évolutivité prévue

- Module acoustique → Edge Function Supabase (isolation du calcul)
- Notifications terrain → Supabase Realtime (websockets)
- Mode offline → Service Worker + IndexedDB pour zones sans réseau
- Application mobile → mêmes APIs Supabase, Capacitor.js pour wrapper natif
- Multi-projet → ajout d'une table `projects` avec foreign key sur `spots`

---

## Fonctionnalités innovantes à prévoir (roadmap)

| Feature | Description | Priorité |
|---|---|---|
| Heatmap acoustique | Overlay Leaflet coloré par score acoustique de la zone | Haute |
| Mode offline | SW + IndexedDB pour terrain sans réseau | Haute |
| Scoring automatique OSM | Auto-remplissage des sliders depuis Overpass | Haute |
| Timeline historique | Voir l'évolution des scores d'un spot dans le temps | Moyenne |
| Partage de rapport | Lien temporaire signé pour partager un PDF à des tiers | Moyenne |
| Import KML/GPX | Importer des spots depuis un GPS ou Google Maps | Basse |
| Comparaison multi-spots | Tableau comparatif plus de 2 spots | Basse |
| Notifications push | Alerte si un spot change de statut | Basse |

---

*Document confidentiel — Projet SoundSystem Hardening · SpotCheck v1.0*
