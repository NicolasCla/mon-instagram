const express = require('express');
// ↑ Bibliothèque qui simplifie la création d'un serveur web.

const db = require('./database');
// ↑ Importe la connexion à la base de données créée dans database.js
//   (le fichier s'exécute une fois, crée la table si besoin, puis on
//   récupère l'objet `db` prêt à l'emploi via module.exports).

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
// ↑ Sert automatiquement les fichiers du dossier public (HTML, CSS, JS).

app.use(express.json());
// ↑ Middleware qui permet à Express de comprendre du JSON envoyé dans le
//   corps (body) d'une requête. Sans ça, req.body serait vide dans la
//   route POST ci-dessous.

app.get('/api/posts', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all();
  // ↑ SELECT *      : on lit toutes les colonnes
  //   ORDER BY id DESC : du post le plus récent (id le plus grand) au plus ancien
  //   .all()         : renvoie TOUTES les lignes (contrairement à .get())
  res.json(posts);
  // ↑ Renvoie les données au navigateur au format JSON.
});
// ↑ Route GET : par convention, GET sert à LIRE des données.
//   Le préfixe /api/ signale une route qui renvoie des données, pas une page.

app.post('/api/posts', (req, res) => {
  const { auteur, texte } = req.body;
  // ↑ Récupère les champs envoyés par le client (déstructuration d'objet).

  const insererPost = db.prepare('INSERT INTO posts (auteur, texte) VALUES (?, ?)');
  const resultat = insererPost.run(auteur, texte);
  // ↑ Insère une nouvelle ligne dans la table posts.

  res.json({ id: resultat.lastInsertRowid, auteur, texte });
  // ↑ lastInsertRowid : l'id auto-généré pour la ligne qu'on vient de créer.
  //   On renvoie le post créé, avec son id, au client.
});
// ↑ Route POST : par convention, POST sert à CRÉER/ENVOYER des données.

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});