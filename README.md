# Académie Elite Football - Site Web

Un site web moderne et professionnel pour l'Académie Elite Football, conçu pour présenter les programmes, les équipes, les entraînements et permettre aux visiteurs de prendre contact.

## 🌟 Caractéristiques

- **Design Moderne et Responsif**: Interface élégante qui s'adapte à tous les appareils (mobiles, tablettes, ordinateurs)
- **Navigation Fluide**: Menu hamburger mobile et navigation smooth scroll
- **Sections Complètes**:
  - Accueil avec appel à l'action
  - Programmes de formation (Enfants, Jeunes, Élite)
  - Présentation des équipes
  - Calendrier des entraînements
  - Formulaire de contact
- **Animations**: Effets visuels attrayants au scroll et au hover
- **Formulaire de Contact**: Gestion complète avec validation

## 📁 Structure des Fichiers

```
Academie/
├── index.html      # Page principale (HTML)
├── styles.css      # Feuille de styles (CSS)
├── script.js       # Interactions dynamiques (JavaScript)
└── README.md       # Documentation
```

## 🎨 Couleurs et Style

- **Couleur Primaire**: Bleu foncé (#1e3a8a)
- **Couleur Secondaire**: Rouge (#dc2626)
- **Couleur d'Accent**: Or (#f59e0b)
- **Font**: Segoe UI, Tahoma, Geneva, Verdana, sans-serif

## 🚀 Comment Utiliser

1. **Ouvrir le site**: Double-cliquez sur `index.html` ou ouvrez-le dans votre navigateur
2. **Navigation**: Utilisez le menu pour naviguer vers les différentes sections
3. **Formulaire**: Remplissez le formulaire de contact pour les demandes de renseignements
4. **Responsive**: Vérifiez le site sur mobile en utilisant la vue responsive de votre navigateur

## 📱 Responsive Design

Le site est complètement responsive et fonctionne sur:
- **Desktop**: Résolution complète
- **Tablette**: Optimisé pour 768px et plus
- **Mobile**: Optimisé pour 480px et plus avec menu hamburger

## ⚙️ Fonctionnalités JavaScript

1. **Menu Hamburger**: Affiche/cache le menu sur mobile
2. **Smooth Scroll**: Défilement fluide vers les sections
3. **Formulaire de Contact**: Validation et affichage de messages de confirmation
4. **Navigation Active**: Surligne le lien actif au scroll
5. **Animations au Scroll**: Les cartes s'animent en arrivant en vue

## 🖼️ Galerie, publications et direct

- Les onglets **Tout**, **Photos**, **Vidéos**, **Matchs**, **Entraînements** et **Direct** ouvrent chacun leur page dédiée.
- Après connexion, un administrateur peut publier des images JPG, PNG ou WebP (12 Mo maximum) et des vidéos MP4 ou WebM (100 Mo maximum), puis les classer par type et catégorie. Il peut aussi supprimer une publication.
- Pour lancer le direct sur le site, démarrez d’abord la diffusion sur YouTube ou Facebook, puis indiquez son titre et son lien dans la page **Direct**. Le bouton d’arrêt retire l’intégration du site ; il n’arrête pas la diffusion sur la plateforme.
- Les fichiers sont stockés sur le serveur dans `uploads/gallery/` par défaut, et leurs informations dans `academie.db`. En hébergement, configurez un volume persistant pour ces deux emplacements.

### Démarrer le serveur

Le site et sa galerie dynamique doivent être servis par le backend Express (et non ouverts directement depuis GitHub Pages ou `file://`) :

```powershell
$env:ADMIN_BOOTSTRAP_PASSWORD = "choisir-un-secret-de-16-caracteres-minimum"
npm install
npm start
```

Connectez-vous avec `admin@academiefady.com` et le mot de passe défini dans `ADMIN_BOOTSTRAP_PASSWORD`. Ne publiez jamais ce secret dans le dépôt. Si le site et l’API sont hébergés sur des origines différentes, définissez `window.ACADEMIE_API_URL` avant le chargement de `js/script.js` et configurez CORS pour l’origine du site.

Les connexions administrateur délivrent une session temporaire en mémoire (12 heures), révoquée à la déconnexion ou au redémarrage du serveur. L’inscription publique crée toujours un compte joueur ; elle ne permet pas de choisir le rôle administrateur.

Pour placer la base et les médias sur un volume persistant différent, définissez `ACADEMIE_DB_PATH` et `GALLERY_UPLOAD_DIR` avant `npm start`.

Le calendrier public présente toujours les jours du lundi au dimanche et conserve un aperçu des créneaux de la capture si le serveur est indisponible. Les administrateurs peuvent activer ou désactiver chaque jour dans **Mon espace → Administration du Club** ; l’ajout d’un créneau active aussi automatiquement le jour choisi. Les entraînements utilisent les terrains **Grand Stade Régional de Labé**, **Terrain de Tata** et **Terrain de Fadi**. Le lien Google Maps de chaque créneau ouvre l’itinéraire vers le terrain sélectionné, depuis la position de départ choisie dans Maps.

## 🔧 Personalisation

Vous pouvez facilement modifier:
- **Logo**: Changez le contenu du `.logo h1`
- **Couleurs**: Modifiez les variables CSS dans `:root`
- **Contenu**: Éditez les textes et les informations de contact
- **Images**: Ajoutez des images en remplaçant les emojis
- **Catégories sportives**: Gérez les catégories depuis l'administration
- **Horaires**: Modifiez le calendrier des entraînements

## 📧 Contact

Pour modifier les informations de contact:
1. Éditez la section "Contact" dans `index.html`
2. Mettez à jour l'adresse, le téléphone et l'email
3. Modifiez le lien du formulaire pour pointer vers un vrai service d'email si nécessaire

## 📝 Notes

- Le formulaire de contact affiche actuellement une alerte de confirmation (vous pouvez l'intégrer à un service backend)
- Pour un vrai formulaire, intégrez un service comme Formspree, EmailJS ou créez un backend
- Les images/photos peuvent être ajoutées pour améliorer l'apparence

## 🌐 Déploiement

Pour déployer le site:
1. Uploadez les trois fichiers sur un serveur web
2. Assurez-vous qu'`index.html` est la page par défaut
3. Testez tous les liens et le formulaire

## 📞 Support

Pour toute question ou modification, éditez directement les fichiers HTML, CSS et JavaScript selon vos besoins.

---

**Créé le**: 10 Décembre 2025  
**Version**: 1.0  
**Académie Elite Football** ⚽
