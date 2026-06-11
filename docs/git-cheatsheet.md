# Git — Cheatsheet SoundSystemHardening

Remote : `https://github.com/KernelRequiem/SoundSystemHardening.git`
Branche principale : `main`

---

## Pull — récupérer les changements distants

```bash
# Cas standard : récupérer et fusionner
git pull origin main

# Si tu as des modifications locales non commitées, stashe-les d'abord
git stash
git pull origin main
git stash pop
```

---

## Push — envoyer tes commits

```bash
# Push standard
git push origin main

# Si la branche locale n'a pas encore de tracking upstream (premier push)
git push -u origin main
```

---

## Workflow complet avant un push

```bash
# 1. Voir l'état du dépôt
git status

# 2. Ajouter les fichiers modifiés/nouveaux
git add .
# ou fichier par fichier :
git add src/pages/infocrypt.astro
git add src/layouts/Layout.astro

# 3. Committer avec un message conventionnel
git commit -m "feat(infocrypt): ajout page InfoCrypt + guide modal + topbar"

# 4. Pousser
git push origin main
```

---

## Commande pour le push actuel

Fichiers en attente :
- `src/layouts/Layout.astro` (modifié)
- `src/pages/infocrypt.astro` (nouveau)
- `infocrypt.html` (nouveau, standalone)

> ⚠ Toujours vérifier que tu es dans le bon dossier avant de lancer git.
> Si tu es dans `~` (home), git voit un autre dépôt et les chemins ne correspondent à rien.

```bash
# Aller dans le projet d'abord — obligatoire
cd ~/sound-system-hardening-new

git add src/layouts/Layout.astro src/pages/infocrypt.astro infocrypt.html

git commit -m "feat(infocrypt): outil de chiffrement AES-GCM client-side + guide modal"

git push origin main
```

---

## Commandes utiles en complément

```bash
# Voir les commits récents
git log --oneline -10

# Annuler le dernier commit (garde les fichiers modifiés)
git reset --soft HEAD~1

# Voir ce qui a changé avant de committer
git diff

# Voir l'historique d'un fichier
git log --oneline -- src/pages/infocrypt.astro
```
