async function chargerPosts() {
  const reponse = await fetch('/api/posts');
  // ↑ fetch() envoie une requête au serveur depuis le navigateur.
  //   await : on attend la réponse avant de continuer (fetch est asynchrone).
  const posts = await reponse.json();
  // ↑ Convertit la réponse brute (JSON texte) en tableau JavaScript utilisable.

  const conteneur = document.getElementById('fil-posts');
  conteneur.innerHTML = '';
  // ↑ On vide le conteneur avant de le remplir, pour ne pas dupliquer
  //   les posts à chaque appel de cette fonction.

  posts.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `<strong>${post.auteur}</strong><p>${post.texte}</p>`;
    conteneur.appendChild(div);
    // ↑ Pour chaque post : on crée un élément <div>, on le remplit avec
    //   son contenu, puis on l'ajoute dans la page.
  });
}
// ↑ "async function" : cette fonction peut contenir des "await"
//   (des étapes qu'on doit attendre, comme une requête réseau).

document.getElementById('form-post').addEventListener('submit', async (event) => {
  event.preventDefault();
  // ↑ Empêche le comportement par défaut d'un formulaire HTML, qui est
  //   de recharger toute la page à la soumission.

  const auteur = document.getElementById('auteur').value;
  const texte = document.getElementById('texte').value;
  // ↑ Récupère ce que l'utilisateur a tapé dans les champs du formulaire.

  await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auteur, texte })
    // ↑ On envoie les données au serveur, converties en texte JSON.
  });

  document.getElementById('form-post').reset();
  // ↑ Vide le formulaire après l'envoi.
  chargerPosts();
  // ↑ Recharge la liste, pour que le nouveau post apparaisse immédiatement.
});

chargerPosts();
// ↑ Appel initial : charge les posts dès que la page se charge.