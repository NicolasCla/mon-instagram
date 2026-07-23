const express = require('express');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/api/posts', (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all();
    res.json(posts);
  } catch (erreur) {
    console.error('Erreur lors de la lecture des posts :', erreur);
    res.status(500).json({ erreur: 'Impossible de récupérer les posts' });
  }
  // ↑ try/catch : si la requête SQL échoue pour une raison quelconque
  //   (base corrompue, colonne manquante...), on ne fait pas planter
  //   tout le serveur — on renvoie une erreur propre au client.
  //   status(500) = code HTTP standard pour "erreur côté serveur".
});

app.post('/api/posts', (req, res) => {
  const { auteur, texte } = req.body;

  if (!auteur || !texte || auteur.trim() === '' || texte.trim() === '') {
    return res.status(400).json({ erreur: 'Auteur et texte sont obligatoires' });
  }
  // ↑ Validation : on vérifie que les champs existent ET ne sont pas
  //   juste des espaces vides (.trim() enlève les espaces au début/fin).
  //   status(400) = code HTTP standard pour "requête invalide côté client".
  //   Sans ce contrôle, quelqu'un pourrait envoyer une requête vide
  //   directement (sans passer par ton formulaire) et polluer la base.

  try {
    const insererPost = db.prepare('INSERT INTO posts (auteur, texte) VALUES (?, ?)');
    const resultat = insererPost.run(auteur.trim(), texte.trim());
    res.json({ id: resultat.lastInsertRowid, auteur, texte, likes: 0 });
  } catch (erreur) {
    console.error('Erreur lors de la création du post :', erreur);
    res.status(500).json({ erreur: 'Impossible de créer le post' });
  }
});

app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;

  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);

    if (!post) {
      return res.status(404).json({ erreur: 'Post introuvable' });
    }
    // ↑ status(404) = code HTTP standard pour "ressource non trouvée".
    //   Sans ce contrôle, liker un id inexistant renverrait `undefined`
    //   sans prévenir personne.

    db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(id);
    const postMisAJour = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    res.json(postMisAJour);
  } catch (erreur) {
    console.error('Erreur lors du like :', erreur);
    res.status(500).json({ erreur: 'Impossible de liker ce post' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});