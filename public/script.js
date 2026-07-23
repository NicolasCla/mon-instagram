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
    // ↑ data-id : un attribut personnalisé qui stocke l'id du post
    //   directement sur le bouton, pour le récupérer facilement au clic.
    conteneur.appendChild(div);
  });

  document.querySelectorAll('.btn-like').forEach(bouton => {
    bouton.addEventListener('click', async () => {
      const id = bouton.dataset.id;
      // ↑ dataset.id lit l'attribut data-id qu'on a posé plus haut.

      await fetch(`/api/posts/${id}/like`, { method: 'POST' });
      // ↑ Envoie une requête POST vers la route qu'on vient de créer.

      chargerPosts();
      // ↑ Recharge la liste pour afficher le nouveau compteur de likes.
    });
  });
  // ↑ querySelectorAll récupère TOUS les boutons ".btn-like" de la page,
  //   et on attache un clic à chacun individuellement.
}

document.getElementById('form-post').addEventListener('submit', async (event) => {
  event.preventDefault();

  const auteur = document.getElementById('auteur').value;
  const texte = document.getElementById('texte').value;

  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auteur, texte })
  });

  document.getElementById('form-post').reset();
  chargerPosts();
});

chargerPosts();