# SoundSystemHardening - Site Web

Site Astro statique pour le wiki SoundSystemHardening.

## Stack

- **Astro 4.16** (Static Site Generator)
- **Tailwind CSS** (Styling)
- **Markdown** (Contenu wiki)
- **Zero backend** (Statique, zéro SQL)

## Démarrage

```bash
# Cloner le wiki
git clone https://github.com/KernelRequiem/SoundSystemHardening.wiki.git wiki-content
cp wiki-content/*.md src/content/wiki/
rm -rf wiki-content

# Installer les dépendances
npm install

# Dev local
npm run dev
# → http://localhost:4321

# Build production
npm run build
```

## Structure

```
src/
├── pages/
│   ├── index.astro          # Homepage
│   └── wiki/
│       ├── index.astro      # Index du wiki
│       └── [slug].astro     # Pages dynamiques wiki
├── content/wiki/            # Fichiers .md du wiki
├── layouts/
│   └── Layout.astro         # Layout principal + sidebar
└── styles/
    └── global.css           # Styles DedSec
```

## Mise à jour du wiki

```bash
cd wiki-content
git pull
cp *.md ../src/content/wiki/
cd ..
git add .
git commit -m "update: wiki content"
git push
```

## Déploiement Netlify

1. Connecter le repo GitHub
2. Build command : `npm run build`
3. Publish directory : `dist`
4. Deploy

Auto-deploy à chaque `git push`.

## Licence

CC BY-SA 4.0
