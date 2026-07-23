const express = require('express');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const session = require('express-session');

app.use(session({
  secret: 'change-moi-en-vrai-secret',
  resave: false,
  saveUninitialized: false
}));

const bcrypt = require('bcrypt');

app.post('/api/inscription', async (req, res) => {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: 'Email et mot de passe obligatoires' });
  }

  try {
    const motDePasseHache = await bcrypt.hash(motDePasse, 10);
    // ↑ bcrypt.hash transforme le mot de passe en une empreinte illisible
    //   et irréversible. Le "10" est le "coût" du hachage (plus il est
    //   élevé, plus c'est lent à calculer — donc plus dur à casser par
    //   force brute, mais aussi plus lent pour ton serveur : 10 est un
    //   bon compromis standard).

    const inscrire = db.prepare('INSERT INTO users (email, mot_de_passe) VALUES (?, ?)');
    const resultat = inscrire.run(email, motDePasseHache);

    req.session.userId = resultat.lastInsertRowid;
    // ↑ Dès l'inscription, on connecte directement l'utilisateur en
    //   stockant son id dans la session (côté serveur, liée à un cookie
    //   envoyé automatiquement au navigateur).

    res.json({ email });
  } catch (erreur) {
    if (erreur.message.includes('UNIQUE')) {
      // ↑ Si l'email existe déjà, SQLite renvoie une erreur mentionnant
      //   la contrainte UNIQUE qu'on a définie sur la colonne email.
      return res.status(400).json({ erreur: 'Cet email est déjà utilisé' });
    }
    console.error('Erreur inscription :', erreur);
    res.status(500).json({ erreur: 'Impossible de créer le compte' });
  }
});

app.post('/api/connexion', async (req, res) => {
  const { email, motDePasse } = req.body;

  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: 'Email et mot de passe obligatoires' });
  }

  try {
    const utilisateur = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!utilisateur) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }
    // ↑ status(401) = code HTTP standard pour "non autorisé / authentification
    //   échouée". On reste volontairement VAGUE dans le message ("email ou
    //   mot de passe incorrect", sans préciser lequel) : dire "cet email
    //   n'existe pas" donnerait à un attaquant une info exploitable pour
    //   deviner quels comptes existent.

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
    // ↑ bcrypt.compare vérifie si le mot de passe tapé correspond au hash
    //   stocké — sans jamais "déhacher" le hash (c'est irréversible par
    //   design). Il recalcule un hash à partir du mot de passe fourni et
    //   compare les deux empreintes.

    if (!motDePasseValide) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }

    req.session.userId = utilisateur.id;
    // ↑ On stocke l'id de l'utilisateur dans la session : c'est ce qui
    //   permettra, sur les prochaines requêtes, de savoir "qui" est
    //   connecté (le cookie envoyé par le navigateur retrouve la session
    //   correspondante côté serveur).

    res.json({ email: utilisateur.email });
  } catch (erreur) {
    console.error('Erreur connexion :', erreur);
    res.status(500).json({ erreur: 'Erreur lors de la connexion' });
  }
});

app.get('/api/moi', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ connecte: false });
  }
  const utilisateur = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.session.userId);
  res.json({ connecte: true, utilisateur });
  // ↑ SELECT id, email (sans mot_de_passe) : on ne renvoie JAMAIS le hash
  //   du mot de passe au client, même haché — aucune raison qu'il quitte
  //   le serveur.
});

app.post('/api/deconnexion', (req, res) => {
  req.session.destroy(() => {
    res.json({ deconnecte: true });
  });
  // ↑ req.session.destroy() supprime la session côté serveur — le cookie
  //   du navigateur ne correspondra plus à rien, l'utilisateur est déconnecté.
});

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