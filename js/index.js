document.addEventListener('DOMContentLoaded', () => {
  renderPosts();
  setupSubscribe();
  animateHeader();
});

function renderPosts() {
  const list = document.getElementById('posts-list');

  POSTS.forEach((post, i) => {
    const num = String(i + 1).padStart(2, '0');
    const card = document.createElement('a');
    card.className = 'post-card';
    card.href = `post.html?id=${post.id}`;
    card.style.animationDelay = `${0.08 * i + 0.1}s`;
    card.innerHTML = `
      <div class="post-number">${num}</div>
      <div class="post-meta-col">
        <span class="post-category">${post.category}</span>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-excerpt">${post.excerpt}</p>
      </div>
      <div class="post-info">
        <span class="post-date">${post.date}</span>
        <span class="post-read">${post.readTime}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

function setupSubscribe() {
  const form = document.getElementById('subscribe-form');
  const note = document.getElementById('form-note');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    // TODO: guardar en Firestore
    console.log('Nuevo suscriptor:', email);
    note.textContent = '✓ Listo. Te avisamos cuando haya algo nuevo.';
    document.getElementById('email-input').value = '';
    setTimeout(() => (note.textContent = ''), 5000);
  });
}

function animateHeader() {
  const title = document.querySelector('.site-title');
  title.style.opacity = '0';
  title.style.transform = 'translateY(30px)';
  setTimeout(() => {
    title.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
    title.style.opacity = '1';
    title.style.transform = 'translateY(0)';
  }, 50);
}
