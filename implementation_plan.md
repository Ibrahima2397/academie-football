# Plan de Conversion Multi-page

L'objectif est de diviser l'actuel `index.html` (page unique) en plusieurs pages distinctes pour chaque section (Accueil, Programmes, Équipes, Entraînements, Contact).

## Révision Utilisateur Requise

> [!IMPORTANT]
> Ce changement transformera le site d'une expérience de défilement sur une seule page en une expérience multi-page. La navigation rechargera la page au lieu de simplement défiler.

## Changements Proposés

### [HTML]
#### [MODIFIER] [index.html](file:///c:/Users/Ibrahima%20Sory%20Bald%C3%A9/Documents/Academie/html/index.html)
- Mettre à jour les liens de navigation pour pointer vers les fichiers `.html`.
- Supprimer toutes les sections sauf la section "Hero" (Accueil).
- Ajouter la classe "active" au lien "Accueil".

#### [NOUVEAU] [programmes.html](file:///c:/Users/Ibrahima%20Sory%20Bald%C3%A9/Documents/Academie/html/programmes.html)
- Créer une nouvelle page pour la section Programmes.
- Inclure la barre de navigation et le pied de page.
- Ajouter la classe "active" au lien "Programmes".

#### [NOUVEAU] [equipes.html](file:///c:/Users/Ibrahima%20Sory%20Bald%C3%A9/Documents/Academie/html/equipes.html)
- Créer une nouvelle page pour la section Équipes.
- Inclure la barre de navigation et le pied de page.
- Ajouter la classe "active" au lien "Équipes".

#### [NOUVEAU] [entrainements.html](file:///c:/Users/Ibrahima%20Sory%20Bald%C3%A9/Documents/Academie/html/entrainements.html)
- Créer une nouvelle page pour la section Entraînements.
- Inclure la barre de navigation et le pied de page.
- Ajouter la classe "active" au lien "Entraînements".

#### [NOUVEAU] [contact.html](file:///c:/Users/Ibrahima%20Sory%20Bald%C3%A9/Documents/Academie/html/contact.html)
- Créer une nouvelle page pour les sections Tarifs et Contact.
- Inclure la barre de navigation et le pied de page.
- Ajouter la classe "active" au lien "Contact".

### [JavaScript]
#### [MODIFIER] [script.js](file:///c:/Users/Ibrahima%20Sory%20Bald%C3%A9/Documents/Academie/js/script.js)
- Supprimer la logique de lien actif basée sur le défilement (car les pages sont maintenant séparées).
- Conserver la fonctionnalité du menu hamburger et la gestion du formulaire de contact.

## Plan de Vérification

### Tests Automatisés
- Utiliser l'outil de navigation pour vérifier que chaque lien mène à la bonne page et que le contenu s'affiche correctement.

### Vérification Manuelle
- Vérifier que le menu hamburger fonctionne sur toutes les pages.
- Vérifier que le formulaire de contact s'envoie toujours correctement sur la page contact.
