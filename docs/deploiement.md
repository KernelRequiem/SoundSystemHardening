# Déploiement

J'explique ici comment le site passe de mon code à une page accessible sur internet. Cette doc reste volontairement au niveau des principes : les détails opérationnels sensibles (configuration serveur précise, secrets) ne figurent pas dans ce dossier public.

## Hébergement : serveur auto-hébergé

Le site n'est plus hébergé sur une plateforme clé en main. Je l'héberge sur mon propre serveur (un VPS), ce qui me donne le contrôle total sur les données qui transitent et sur la sécurité de la machine.

Concrètement, l'application tourne dans un conteneur Docker, orchestré par un outil de déploiement qui gère aussi le reverse proxy et les certificats HTTPS. Le reverse proxy est la porte d'entrée : il reçoit les requêtes des visiteurs sur le web, applique le HTTPS, et les transmet à l'application qui tourne à l'intérieur.

Pourquoi ce choix plutôt qu'un hébergeur gratuit :

J'ai quitté l'hébergement sur plateforme tierce pour une raison de cohérence avec la mission du projet. Sur une plateforme clé en main, c'est le prestataire qui voit passer le trafic et qui détient une partie des leviers de sécurité. En auto-hébergeant, je décide moi-même de chaque flux réseau, je supprime les outils de mesure tiers qui voyaient l'IP des visiteurs, et je durcis le serveur selon mes propres règles. Le passage en application serveur (et non plus en site purement statique) me permet aussi d'avoir des formulaires qui envoient des emails ou enregistrent des signalements sans dépendre d'un service externe qui lirait ces données.

---

## Pipeline de déploiement

```
Je modifie un fichier
        ↓
git commit + git push → GitHub
        ↓
Le serveur détecte le changement (webhook protégé par secret)
        ↓
Construction de l'image Docker :
  étape 1 : installation des dépendances + npm run build
  étape 2 : image finale légère avec seulement le nécessaire
        ↓
Le reverse proxy route le domaine vers le conteneur à jour
        ↓
HTTPS automatique, redirection de http vers https
```

Le site est mis à jour quelques dizaines de secondes après le push.

---

## Commandes locales

Pour travailler sur le projet sur ma machine :

```bash
# Installer les dépendances (une seule fois)
npm install

# Lancer le serveur de développement
npm run dev
# → Site disponible sur http://localhost:4321

# Construire la version de production
npm run build

# Prévisualiser la production en local
npm run preview
```

---

## Ce que fait la construction (`npm run build`)

1. Astro lit sa configuration pour connaître les intégrations actives (Tailwind, MDX, Sitemap)
2. Il liste toutes les pages wiki à générer à partir des fichiers Markdown
3. Il génère l'index de recherche
4. Il compile les pages statiques en HTML, et prépare les routes serveur (formulaires)
5. Tailwind génère le CSS minimal
6. Les fichiers du dossier `public/` (polices, favicons, manifest) sont copiés tels quels
7. Le plan du site est généré

Le résultat est un dossier `dist/` contenant l'application prête à être lancée dans le conteneur.

---

## Nom de domaine

Le site est accessible via `soundsystemhardening.fr`. Le domaine pointe vers mon serveur, et l'URL est déclarée dans la configuration Astro pour générer les liens absolus du plan de site et les balises de prévisualisation sociale.

---

## Sécurité du déploiement

Le détail de la sécurité figure dans le fichier `SECURITY.md` à la racine du projet. En résumé pour cette doc :

Aucun secret n'est dans le code. Les identifiants (email, jeton de base de données) vivent uniquement dans la configuration du serveur, en variables d'environnement, et le fichier `.env` local est exclu de git. Le HTTPS est forcé. Le serveur est durci (accès administrateur restreint, pare-feu, protection contre le brute-force, mises à jour de sécurité automatiques). Les détails opérationnels précis ne sont pas dans ce dossier public, par principe.

---

## Contribuer au wiki

Ajouter ou modifier une page wiki ne demande aucune compétence en développement :

1. Aller sur le dépôt GitHub
2. Naviguer dans `src/content/wiki/`
3. Éditer un fichier `.md` existant ou en créer un nouveau via l'interface GitHub
4. Valider le changement (« Commit changes »)
5. Le serveur reconstruit et redéploie automatiquement

Le wiki entier est donc modifiable sans jamais ouvrir un terminal.
