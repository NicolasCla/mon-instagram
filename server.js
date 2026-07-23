const express = require('express');
// ↑ On importe la bibliothèque Express, installée via `npm install express`

const app = express();
// ↑ On crée l'application serveur

const PORT = process.env.PORT || 3000;
// ↑ On utilise le port fourni par l'hébergeur (variable d'environnement PORT)
//   s'il existe, sinon 3000 en local. Ça rend le code compatible partout.

app.use(express.static('public'));
// ↑ Middleware : sert automatiquement tous les fichiers du dossier `public`
//   (HTML, CSS, JS...) sans avoir à écrire une route pour chacun.

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
// ↑ Démarre le serveur, qui reste actif et "écoute" les requêtes entrantes.