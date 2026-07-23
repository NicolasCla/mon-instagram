let utilisateurConnecte = null;
// ↑ Variable globale qui garde en mémoire, côté navigateur, qui est
//   actuellement connecté (ou null si personne).

async function verifierConnexion() {
  const reponse = await fetch('/api/moi');
  if (reponse.ok) {
    // ↑ reponse.ok est vrai si le code de statut HTTP est entre 200-299
    //   (donc PAS pour un 401 "non connecté").
    const data = await reponse.json();
    utilisateurConnecte = data.utilisateur;
  } else {
    utilisateurConnecte = null;
  }
  afficherZoneAuth();
}

function afficherZoneAuth() {
  const zone = document.getElementById('zone-auth');
  const formPost = document.getElementById('form-post');

  if (utilisateurConnecte) {
    zone.innerHTML = `
      <p>Connecté en tant que <strong>${utilisateurConnecte.email}</strong>
      <button id="btn-deconnexion">Se déconnecter</button></p>
    `;
    formPost.style.display = 'flex';
    // ↑ On affiche le formulaire de post uniquement si connecté.

    document.getElementById('btn-deconnexion').addEventListener('click', async () => {
      await fetch('/api/deconnexion', { method: 'POST' });
      utilisateurConnecte = null;
      afficherZoneAuth();
    });
  } else {
    zone.innerHTML = `
      <form id="form-auth">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="motDePasse" placeholder="Mot de passe" required>
        <button type="submit" data-action="connexion">Se connecter</button>
        <button type="submit" data-action="inscription">S'inscrire</button>
      </form>
    `;
    formPost.style.display = 'none';

    document.getElementById('form-auth').addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const motDePasse = document.getElementById('motDePasse').value;
      const action = event.submitter.dataset.action;
      // ↑ event.submitter : indique QUEL bouton a déclenché l'envoi du
      //   formulaire (utile ici puisqu'il y a 2 boutons submit différents).

      const reponse = await fetch(`/api/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse })
      });

      if (reponse.ok) {
        verifierConnexion();
      } else {
        const erreur = await reponse.json();
        alert(erreur.erreur);
      }
    });
  }
}

async function chargerPosts() {
  const reponse = await fetch('/api/posts');
  const posts = await reponse.json();

  const conteneur = document.getElementById('fil-posts');
  conteneur.innerHTML = '';

  posts.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <strong>${post.auteur}</strong>
      <p>${post.texte}</p>
      <button class="btn-like" data-id="${post.id}">❤️ ${post.likes}</button>
    `;
    conteneur.appendChild(div);
  });

  document.querySelectorAll('.btn-like').forEach(bouton => {
    bouton.addEventListener('click', async () => {
      const id = bouton.dataset.id;
      await fetch(`/api/posts/${id}/like`, { method: 'POST' });
      chargerPosts();
    });
  });
}

document.getElementById('form-post').addEventListener('submit', async (event) => {
  event.preventDefault();

  const texte = document.getElementById('texte').value;

  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auteur: utilisateurConnecte.email, texte })
    // ↑ On n'a plus besoin de demander le nom : on utilise l'email de
    //   l'utilisateur connecté, qu'on a déjà en mémoire.
  });

  document.getElementById('form-post').reset();
  chargerPosts();
});

verifierConnexion();
chargerPosts();