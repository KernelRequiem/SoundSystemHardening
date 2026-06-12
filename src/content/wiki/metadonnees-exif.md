# Métadonnées et EXIF

> Résumé : comprendre et neutraliser les données cachées des fichiers, le vecteur de fuite le plus sous-estimé.
> Statut : stable
> Mise à jour : juin 2026
> Dossier : cyber-opsec

Une photo ne contient pas que l'image. Elle embarque des métadonnées : modèle de l'appareil, date, parfois coordonnées GPS précises. Un document texte ou un PDF conserve souvent le nom de l'auteur et l'historique des modifications. Partager un fichier sans le nettoyer, c'est risquer de livrer le lieu, l'heure et l'identité que l'on croyait protéger.

---

## En bref

* Les métadonnées EXIF d'une photo peuvent contenir la position GPS exacte de la prise de vue.
* Le nettoyage doit précéder tout partage public, sur réseaux sociaux comme en messagerie.
* Une capture d'écran de l'image, ou un outil dédié, suffit souvent à supprimer ces données.

## Ce que contient un fichier

Les métadonnées varient selon le format. Pour une image, le standard EXIF stocke notamment :

```
Appareil et objectif      marque, modèle, réglages
Horodatage                date et heure exactes
Position GPS              latitude et longitude, parfois altitude
Logiciel                  application de retouche utilisée
Vignette                  miniature parfois non mise à jour après recadrage
```

Les documents bureautiques et les PDF ajoutent l'auteur, l'organisation et un historique de révisions qui peut révéler des contenus supprimés.

## Pourquoi c'est dangereux

Une seule photo géolocalisée publiée depuis un lieu de préparation ou un site de rassemblement peut suffire à le situer. L'agrégation de plusieurs clichés permet de reconstituer des trajets et des habitudes. C'est une fuite passive, invisible à l'œil, qui contredit tous les efforts d'anonymisation par ailleurs.

## Nettoyer ses fichiers

Plusieurs approches existent, du plus simple au plus complet.

La capture d'écran d'une image supprime l'essentiel des métadonnées d'origine, au prix d'une légère perte de qualité. C'est la méthode la plus accessible.

Sur ordinateur, des outils dédiés font le travail proprement. MAT2 efface les métadonnées de nombreux formats. ExifTool permet un contrôle fin et la vérification du résultat.

```
exiftool -all= image.jpg        supprime toutes les métadonnées
exiftool image.jpg              affiche les métadonnées présentes
mat2 document.pdf               nettoie et crée une copie épurée
```

Sur mobile, des applications comme Scrambled Exif nettoient avant partage. Pensez aussi à désactiver l'enregistrement de la position dans les réglages de l'appareil photo.

## Réflexe à acquérir

Le nettoyage doit devenir systématique, intégré à la chaîne de publication. La meilleure règle est simple : aucun fichier ne quitte un appareil vers l'extérieur sans être passé par une étape d'épuration. L'outil StripMeta du site automatise cette épuration côté navigateur.

## Voir aussi

* [[Sécurite-Numerique]]
* [[surveillance-mobile]]
* [[threat-model]]
