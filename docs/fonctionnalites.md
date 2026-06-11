# Fonctionnalités

Je décris ici chaque fonctionnalité du site : ce qu'elle fait, et comment elle fonctionne techniquement. L'objectif est qu'un contributeur comprenne le mécanisme sous le capot.

## 1. Wiki : du Markdown vers des pages HTML

**Fichiers :** `src/pages/wiki/[slug].astro`, `src/content/wiki/*.md`

Chaque fichier Markdown du wiki devient une page web. Un visiteur qui ouvre `/wiki/Contacts-Allies` reçoit une page HTML complète, mise en forme, avec table des matières et navigation.

Le fichier `[slug].astro` contient une fonction qui s'exécute à la construction : elle liste les fichiers Markdown et déclare une page à générer pour chacun. C'est le principe de la génération de site statique. Le Markdown est converti en HTML par la bibliothèque `marked`, puis injecté dans le layout commun.

L'intérêt : aucune dépendance à un système de gestion de contenu. Les fichiers Markdown sont la source de vérité, éditables directement sur GitHub par n'importe qui, sans toucher au code.

---

## 2. Recherche fulltext sans serveur

**Fichiers :** `src/pages/search.astro`, `src/pages/search-index.json.ts`

Un champ de recherche permet de trouver n'importe quelle information dans les pages du wiki, avec tolérance aux fautes de frappe.

À la construction, je génère un fichier `/search-index.json` qui contient, pour chaque page, son titre, ses sous-titres et un extrait de contenu. Quand un visiteur ouvre la recherche, le navigateur télécharge cet index une fois, et la bibliothèque Fuse.js effectue toutes les recherches localement, en mémoire.

L'avantage est double : la recherche fonctionne même hors ligne une fois la page chargée, et aucune requête de recherche n'est jamais envoyée à un serveur ni enregistrée. Ce que cherche un visiteur ne quitte jamais son navigateur.

---

## 3. Carte interactive des incidents

**Fichiers :** `src/pages/map.astro`, `src/data/incidents.json`

Une carte de France affiche les incidents répressifs documentés. Chaque marqueur est cliquable, et la carte est filtrable par type et par département.

Leaflet est chargé uniquement sur la page carte, pas sur tout le site, pour ne pas alourdir le reste. Les tuiles de fond viennent d'OpenStreetMap, sans clé API ni tracking publicitaire. Les marqueurs sont créés dynamiquement à partir d'`incidents.json`. Ajouter un incident revient à ajouter un objet dans ce fichier et à pusher sur GitHub : le site se met à jour au déploiement suivant.

---

## 4. Arbre de décision interactif

**Fichiers :** `src/pages/decision.astro`, `src/data/decision.ts`

Une interface guidée pose des questions (avant, pendant, après un contrôle) et mène l'utilisateur vers des conseils adaptés à sa situation exacte : contrôle d'identité, fouille, interpellation, garde à vue.

L'arbre est un graphe orienté : chaque nœud a un identifiant, un texte, et des choix qui pointent vers le nœud suivant.

```typescript
{
  id: "fouille-consentement",
  text: "As-tu ouvert le véhicule toi-même ?",
  choices: [
    { label: "Oui", next: "fouille-consentie" },
    { label: "Non", next: "fouille-forcee" }
  ]
}
```

Le moteur JavaScript affiche le nœud courant et remplace le contenu à chaque clic, sans rechargement de page. Les types TypeScript garantissent qu'un nœud mal formé ajouté par un contributeur déclenche une erreur dès la construction.

---

## 5. RIG-LOCK : générateur de manifeste de saisie

**Fichier :** `src/pages/rig-lock.astro`

RIG-LOCK génère un PDF horodaté de manifeste de saisie (matériel confisqué, identité des agents, circonstances, valeur estimée), destiné à servir de pièce dans un recours.

Tout se passe dans le navigateur, côté client. Le formulaire collecte les informations, et une bibliothèque de génération PDF produit le fichier en mémoire, proposé ensuite au téléchargement. Aucune donnée n'est envoyée à un serveur. Un outil de surveillance réseau ne peut donc pas intercepter le contenu du manifeste, puisqu'il n'y a aucune requête lors de la génération.

---

## 6. InfoCrypt : chiffrement de messages côté client

**Fichier :** `src/pages/infocrypt.astro`

InfoCrypt chiffre et déchiffre un message à partir d'un mot de passe partagé. C'est l'outil le plus solide du site sur le plan cryptographique, et il sert de référence pour ce qu'une implémentation correcte doit être.

Il utilise la Web Crypto API native du navigateur : chiffrement AES-GCM 256 bits, dérivation de clé PBKDF2 sur SHA-256 avec 250 000 itérations, sel et vecteur d'initialisation régénérés aléatoirement à chaque chiffrement. Aucune bibliothèque tierce, aucun envoi réseau, aucun stockage du mot de passe. Le mot de passe ne quitte jamais le navigateur.

Le guide intégré est honnête sur les limites : l'outil chiffre le contenu mais ne cache pas les métadonnées (le fait que vous communiquez), et la sécurité dépend entièrement de la force du mot de passe et du canal par lequel vous le partagez.

---

## 7. StripMeta : nettoyage des métadonnées d'images

**Fichier :** `src/pages/stripmeta.astro`

Une photo prise au téléphone contient souvent des métadonnées invisibles (données EXIF) : coordonnées GPS du lieu, modèle d'appareil, date et heure précises. Publier une telle photo peut révéler où et quand elle a été prise. StripMeta retire ces données.

Le traitement est entièrement local, dans le navigateur. L'image est chargée, ré-encodée sans ses métadonnées, et proposée au téléchargement. L'image originale ne quitte jamais l'appareil. C'est un outil OpSec direct : il neutralise un vecteur de déanonymisation très courant.

---

## 8. TimeSeal : horodatage de document

**Fichier :** `src/pages/timeseal.astro`

TimeSeal produit une preuve d'existence d'un document à une date donnée, utile pour dater une pièce avant un recours. Le traitement se fait côté client, sans envoi du document à un serveur.

---

## 9. Page urgence avec accordéons

**Fichier :** `src/pages/urgence.astro`

La page urgence propose des scénarios de terrain (contrôle routier, fouille, saisie, garde à vue, besoin d'avocat). Cliquer sur un scénario l'ouvre et affiche immédiatement les réflexes, les phrases exactes à dire, et les contacts cliquables, sans navigation vers une autre page.

L'interface est un accordéon exclusif piloté par une classe CSS basculée en JavaScript : ouvrir une carte ferme les autres. Tout le contenu est embarqué dans le HTML, donc aucun appel réseau à l'ouverture. Les numéros utilisent des liens natifs `tel:` et `mailto:` : sur mobile, un clic lance l'appel directement. Cette page fait partie des ressources mises en cache hors ligne (voir PWA).

---

## 10. PWA et fonctionnement hors ligne

**Fichiers :** `public/manifest.json`, `public/sw.js`

Le site peut être installé sur un téléphone comme une application, avec une icône sur l'écran d'accueil et un affichage plein écran sans barre d'adresse.

Surtout, un service worker (`sw.js`) met en cache les ressources critiques dès la première visite : l'accueil, les pages d'urgence et de sécurité numérique, la stratégie, le modus operandi. Une fois ces pages chargées une fois, elles restent disponibles même sans connexion. C'est une décision opérationnelle : en rave, en zone blanche ou après une coupure réseau, les informations vitales restent accessibles.

---

## 11. Sidebar avec accordéons de navigation

**Fichier :** `src/layouts/Layout.astro`

La sidebar contient les sections de navigation, chacune sous forme d'accordéon. La section contenant la page visitée s'ouvre automatiquement : à la construction, Astro marque le lien correspondant à l'URL courante comme actif, et au chargement, le JavaScript ouvre la section qui contient ce lien actif.

---

## 12. Barre de progression de lecture

**Fichier :** `src/layouts/Layout.astro`

Une ligne en haut de page avance avec le scroll pour indiquer la progression de lecture.

```javascript
const update = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (scrollTop / docHeight * 100) + '%';
};
window.addEventListener('scroll', update, { passive: true });
```

L'écouteur est déclaré en `{ passive: true }` : il ne peut jamais bloquer le rendu, ce qui est une bonne pratique de performance.

---

## 13. Formulaires serveur : contact et signalement

**Fichiers :** `src/pages/api/contact.ts`, `src/pages/api/signalement.ts`

Ce sont les seules parties du site qui s'exécutent côté serveur, parce qu'elles ont besoin d'agir au-delà du navigateur.

Le formulaire de contact envoie un email via un serveur SMTP, avec des identifiants stockés uniquement côté serveur. Il intègre un piège anti-robot : un champ caché invisible pour un humain mais souvent rempli par les bots. Si ce champ est rempli, la requête est ignorée silencieusement.

Le formulaire de signalement enregistre un incident dans Airtable avec le statut « En attente », jusqu'à validation manuelle avant publication sur la carte. Le jeton utilisé est limité à l'écriture seule.

---

## 14. SEO et prévisualisations sociales

**Fichier :** `src/layouts/Layout.astro`

Chaque page a des métadonnées adaptées aux moteurs de recherche et aux prévisualisations quand on partage un lien (sur Signal, Telegram, etc.). Le layout génère les balises de description, les balises Open Graph (titre, image), et une balise canonique qui désigne l'URL officielle de la page. Le plan de site généré automatiquement liste toutes les URLs pour faciliter l'indexation.
