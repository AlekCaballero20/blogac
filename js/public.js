import { getPublishedPosts } from './posts.service.js';
import { formatDate, markdownToHtml, setYear } from './utils.js';

const state = {
  posts: [],
  activeCategory: 'Todos',
  search: ''
};

const postsList = document.getElementById('posts-list');
const emptyState = document.getElementById('empty-state');
const categoryFilter = document.getElementById('category-filter');
const notebookGrid = document.getElementById('notebook-grid');
const searchInput = document.getElementById('search-input');
const randomButton = document.getElementById('random-button');
const featuredSection = document.getElementById('featured-section');
const featuredPost = document.getElementById('featured-post');

init();

async function init() {
  setYear();
  setupEvents();
  renderLoading();

  try {
    state.posts = await getPublishedPosts();
    renderAll();
  } catch (error) {
    console.error(error);
    renderError('No se pudieron cargar las entradas. Revisa Firestore, reglas y conexión. Qué sorpresa: la nube también tiene días raros.');
  }
}

function setupEvents() {
  searchInput?.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderPosts();
  });

  randomButton?.addEventListener('click', () => {
    const visiblePosts = getFilteredPosts();
    if (!visiblePosts.length) return;
    const selected = visiblePosts[Math.floor(Math.random() * visiblePosts.length)];
    window.location.href = `post.html?id=${encodeURIComponent(selected.id)}`;
  });
}

function renderAll() {
  renderCategories();
  renderFeatured();
  renderPosts();
  renderNotebooks();
}

function renderLoading() {
  postsList.innerHTML = Array.from({ length: 3 }).map(() => `
    <article class="post-card skeleton-card">
      <div class="post-number">··</div>
      <div class="post-meta-col">
        <span class="post-category">Cargando</span>
        <h2 class="post-title">Leyendo desde Firestore</h2>
        <p class="post-excerpt">Un momento mientras el archivo despierta de su siesta digital.</p>
      </div>
      <div class="post-info"><span>···</span><span>···</span></div>
    </article>
  `).join('');
}

function renderError(message) {
  postsList.innerHTML = '';
  emptyState.hidden = false;
  emptyState.querySelector('h2').textContent = 'Algo no cargó.';
  emptyState.querySelector('p').textContent = message;
}

function renderCategories() {
  const categories = ['Todos', ...new Set(state.posts.map((post) => post.category).filter(Boolean))];

  categoryFilter.innerHTML = categories.map((category) => `
    <button class="filter-pill ${category === state.activeCategory ? 'active' : ''}" type="button" data-category="${category}">${category}</button>
  `).join('');

  categoryFilter.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      renderCategories();
      renderPosts();
    });
  });
}

function renderFeatured() {
  const featured = state.posts.find((post) => post.featured);
  if (!featured) {
    featuredSection.hidden = true;
    featuredPost.innerHTML = '';
    return;
  }

  featuredSection.hidden = false;
  featuredPost.innerHTML = `
    <a class="featured-card" href="post.html?id=${encodeURIComponent(featured.id)}">
      <span class="post-category">${featured.category || 'Sin cuaderno'}</span>
      <h2>${featured.title}</h2>
      <p>${featured.excerpt || ''}</p>
      <small>${formatDate(featured.publishedAt || featured.createdAt)} · ${featured.readTime || ''}</small>
    </a>
  `;
}

function renderPosts() {
  const posts = getFilteredPosts();
  postsList.innerHTML = '';
  emptyState.hidden = posts.length > 0;

  if (!posts.length) return;

  posts.forEach((post, index) => {
    const card = document.createElement('a');
    card.className = 'post-card';
    card.href = `post.html?id=${encodeURIComponent(post.id)}`;
    card.style.animationDelay = `${0.05 * index}s`;
    card.innerHTML = `
      <div class="post-number">${String(index + 1).padStart(2, '0')}</div>
      <div class="post-meta-col">
        <span class="post-category">${post.category || 'Sin cuaderno'}</span>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-excerpt">${post.excerpt || ''}</p>
      </div>
      <div class="post-info">
        <span>${formatDate(post.publishedAt || post.createdAt)}</span>
        <span>${post.readTime || ''}</span>
      </div>
    `;
    postsList.appendChild(card);
  });
}

function renderNotebooks() {
  const counts = state.posts.reduce((acc, post) => {
    const category = post.category || 'Sin cuaderno';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categories = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));

  if (!categories.length) {
    notebookGrid.innerHTML = '<p class="section-note">Todavía no hay cuadernos publicados.</p>';
    return;
  }

  notebookGrid.innerHTML = categories.map(([category, count]) => `
    <button class="notebook-card" type="button" data-category="${category}">
      <span>${category}</span>
      <small>${count} ${count === 1 ? 'entrada' : 'entradas'}</small>
    </button>
  `).join('');

  notebookGrid.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      renderCategories();
      renderPosts();
      document.getElementById('archivo')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function getFilteredPosts() {
  return state.posts.filter((post) => {
    const matchesCategory = state.activeCategory === 'Todos' || post.category === state.activeCategory;
    const haystack = [post.title, post.excerpt, post.category, ...(post.tags || []), post.content]
      .join(' ')
      .toLowerCase();
    const matchesSearch = !state.search || haystack.includes(state.search);
    return matchesCategory && matchesSearch;
  });
}

// Se conserva para que el parser quede incluido en builds estáticos raros que eliminan imports no usados.
void markdownToHtml;
