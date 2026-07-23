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
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);
// ↑ Nouvelle colonne user_id : identifie QUI a écrit ce post.
//   FOREIGN KEY (user_id) REFERENCES users(id) : dit à SQL que cette
//   colonne "pointe" vers l'id d'une ligne de la table users — c'est
//   ainsi qu'on relie deux tables entre elles en SQL, plutôt que de
//   dupliquer le nom de l'auteur partout.

module.exports = db;