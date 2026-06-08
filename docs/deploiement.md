# Déploiement

## Hébergement : Vercel

Le site est hébergé sur **Vercel**, une plateforme spécialisée dans le déploiement de sites statiques et d'applications JavaScript. Vercel est l'éditeur d'Astro, ce qui garantit une compatibilité parfaite.

**Pourquoi Vercel :**
- Déploiement automatique à chaque push sur la branche `main` de GitHub
- CDN mondial (Content Delivery Network) : le site est servi depuis le datacenter le plus proche du visiteur
- HTTPS automatique avec certificat Let's Encrypt renouvelé sans intervention
- Offre gratuite suffisante pour un projet de cette taille
- Vercel Speed Insights intégré nativement

---

## Pipeline de déploiement

```
Modification d'un fichier
        ↓
git commit + git push → GitHub (branche main)
        ↓
Vercel détecte le push automatiquement (webhook GitHub)
        ↓
Vercel lance : npm run build → astro build
        ↓
Astro génère le dossier /dist/ avec tout le HTML/CSS/JS statique
        ↓
Vercel déploie /dist/ sur son CDN mondial
        ↓
Site mis à jour en ~60 secondes après le push
```

---

## Commandes locales

Pour travailler sur le projet en local :

```bash
# Installer les dépendances (à faire une seule fois)
npm install

# Lancer le serveur de développement
npm run dev
# → Site disponible sur http://localhost:4321

# Générer le build de production
npm run build
# → Génère le dossier /dist/

# Prévisualiser le build de production en local
npm run preview
```

---

## Ce que fait `astro build`

1. Astro lit `astro.config.mjs` pour connaître les intégrations actives (Tailwind, MDX, Sitemap)
2. Il exécute `getStaticPaths()` dans `[slug].astro` pour lister toutes les pages wiki à générer
3. Il exécute `search-index.json.ts` pour générer l'index de recherche
4. Il compile tous les fichiers `.astro` en HTML statique
5. Tailwind génère le CSS minimal correspondant aux classes utilisées
6. Les fichiers du dossier `public/` sont copiés tels quels dans `/dist/`
7. `@astrojs/sitemap` génère `/sitemap-index.xml`

Le résultat dans `/dist/` est un dossier de fichiers statiques qui peut être servi par n'importe quel hébergeur web (Apache, Nginx, Vercel, Netlify, GitHub Pages...).

---

## Nom de domaine

Le site est accessible via `soundsystemhardening.fr`. Le nom de domaine est configuré dans Vercel (DNS pointant vers les serveurs Vercel), et dans `astro.config.mjs` :

```javascript
export default defineConfig({
  site: 'https://soundsystemhardening.fr',
  // ...
});
```

Cette URL est utilisée par `@astrojs/sitemap` pour générer les URLs absolues du sitemap, et par le layout pour les balises `canonical` et Open Graph.

---

## Sécurité du déploiement

- **Pas de secrets dans le code** : aucune clé API, aucun token, aucun mot de passe dans le repository. Tout est statique.
- **Pas de backend** : aucun serveur applicatif, aucune base de données exposée. La surface d'attaque est réduite au minimum.
- **HTTPS forcé** : Vercel redirige automatiquement toute requête HTTP vers HTTPS.
- **Headers de sécurité** : Vercel applique des headers de sécurité par défaut (X-Frame-Options, X-Content-Type-Options).

---

## Contribuer au wiki

Ajouter ou modifier une page wiki ne nécessite aucune compétence en développement :

1. Aller sur le repository GitHub
2. Naviguer dans `src/content/wiki/`
3. Cliquer sur un fichier `.md` ou créer un nouveau fichier via l'interface GitHub
4. Éditer en Markdown directement dans le navigateur
5. Cliquer "Commit changes" sur la branche `main`
6. Vercel détecte le changement et redéploie automatiquement

Le wiki entier est donc éditable sans jamais toucher à une ligne de code ou ouvrir un terminal.
