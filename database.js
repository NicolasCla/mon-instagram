const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('mabase.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL
  )
`);
// ↑ UNIQUE : empêche deux comptes d'avoir le même email.
//   mot_de_passe contiendra le mot de passe HACHÉ (via bcrypt),
//   jamais le mot de passe original tapé par l'utilisateur.

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auteur TEXT NOT NULL,
    texte TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    user_id INTEGER,
    image TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);
// ↑ image TEXT : stockera le NOM du fichier image (pas l'image elle-même
//   — les images ne se stockent jamais directement dans une base SQL
//   classique, seulement leur chemin/nom). Pas de NOT NULL : un post
//   peut exister sans image.

module.exports = db;