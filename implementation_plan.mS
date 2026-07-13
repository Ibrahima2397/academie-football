# Plan de Configuration Live Server

L'objectif est de permettre au projet de se lancer directement sur la page d'accueil lorsqu'on clique sur "Go Live" dans VS Code.

## Révision Utilisateur Requise

> [!IMPORTANT]
> J'ai déplacé `index.html` à la racine du projet. Les autres pages restent dans le dossier `html/`.

## Changements Proposés

### [Structure]
#### [DÉPLACER] [index.html](file:///c:/Users/Ibrahima%20Sory%20Bald%C3%A9/Documents/Academie/index.html)
- Déplacé de `html/index.html` vers la racine `/`.
- Mise à jour des chemins vers le CSS (`css/styles.css`) et le JS (`js/script.js`).
- Mise à jour des liens vers les autres pages (`html/programmes.html`, etc.).

### [HTML]
#### [MODIFIER] Pages dans `html/`
- Mise à jour du lien "Accueil" pour pointer vers `../index.html`.
- Fichiers concernés : `programmes.html`, `equipes.html`, `entrainements.html`, `galerie.html`, `contact.html`.

## Plan de Vérification

### Tests Automatisés
- Utiliser le navigateur pour vérifier que `index.html` à la racine s'affiche correctement avec son style et ses scripts.
- Vérifier la navigation entre la racine et le dossier `html/`.

### Vérification Manuelle
- Cliquer sur "Go Live" et confirmer que la page d'accueil s'ouvre immédiatement.
