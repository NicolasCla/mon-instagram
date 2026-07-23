const { DatabaseSync } = require('node:sqlite');
// ↑ Module SQLite intégré à Node.js : pas d'installation, pas de compilation.
//   (On l'a préféré à `better-sqlite3`, qui échouait au déploiement car il
//   nécessite Python pour être compilé — absent sur l'hébergement Hostinger.)

const db = new DatabaseSync('mabase.db');
// ↑ Ouvre (ou crée) le fichier de base de données `mabase.db`.

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auteur TEXT NOT NULL,
    texte TEXT NOT NULL,
    likes INTEGER DEFAULT 0
  )
`);
// ↑ Nouvelle colonne "likes", de type nombre entier, avec 0 comme
//   valeur par défaut si elle n'est pas précisée à l'insertion.
// ↑ Requête SQL qui crée la table "posts" si elle n'existe pas déjà.
//   - id : identifiant unique auto-généré (clé primaire)
//   - auteur, texte : colonnes texte, obligatoires (NOT NULL)

const nombrePosts = db.prepare('SELECT COUNT(*) AS total FROM posts').get();
// ↑ Compte le nombre de lignes dans la table. .get() renvoie une seule ligne.

if (nombrePosts.total === 0) {
  const insererPost = db.prepare('INSERT INTO posts (auteur, texte) VALUES (?, ?)');
  // ↑ Requête SQL préparée pour insérer une ligne. Les "?" sont des
  //   paramètres, remplis ensuite par .run() — ça évite les injections SQL.
  insererPost.run('Alice', 'Mon premier post en SQL !');
  insererPost.run('Bob', 'La base de données fonctionne');
}

module.exports = db;
// ↑ Rend cette connexion à la base disponible pour les autres fichiers
//   (notamment server.js, via require('./database')).