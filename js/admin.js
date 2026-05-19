import {
  auth,
  provider,
  ADMIN_EMAIL,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from './firebase.js';
import { getAllPostsForAdmin, savePost, removePost } from './posts.service.js';
import { markdownToHtml, formatDate, parseTags, tagsToString } from './utils.js';

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const loginNote = document.getElementById('login-note');
const editorNote = document.getElementById('editor-note');
const postsList = document.getElementById('admin-posts-list');
const form = document.getElementById('post-form');
const newPostButton = document.getElementById('new-post-button');
const deleteButton = document.getElementById('delete-button');
const previewButton = document.getElementById('preview-button');
const previewCard = document.getElementById('preview-card');
const previewBody = document.getElementById('preview-body');

const fields = {
  id: document.getElementById('post-id'),
  title: document.getElementById('title-input'),
  category: document.getElementById('category-input'),
  excerpt: document.getElementById('excerpt-input'),
  status: document.getElementById('status-input'),
  featured: document.getElementById('featured-input'),
  tags: document.getElementById('tags-input'),
  content: document.getElementById('content-input')
};

let cachedPosts = [];

setupEvents();
watchAuth();

function setupEvents() {
  loginButton.addEventListener('click', handleLogin);
  logoutButton.addEventListener('click', () => signOut(auth));
  newPostButton.addEventListener('click', resetEditor);
  form.addEventListener('submit', handleSave);
  deleteButton.addEventListener('click', handleDelete);
  previewButton.addEventListener('click', renderPreview);
  fields.content.addEventListener('input', () => {
    if (!previewCard.hidden) renderPreview();
  });
}

function watchAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showLogin();
      return;
    }

    if (user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      showLogin(`Este correo no tiene acceso: ${user.email}. Firebase puede ser frío, pero al menos es coherente.`);
      return;
    }

    showAdmin();
    await loadAdminPosts();
  });
}

async function handleLogin() {
  loginNote.textContent = 'Abriendo Google…';

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    loginNote.textContent = 'No se pudo iniciar sesión. Revisa que Google Auth esté activado en Firebase.';
  }
}

function showLogin(message = '') {
  loginView.hidden = false;
  adminView.hidden = true;
  logoutButton.hidden = true;
  loginNote.textContent = message;
}

function showAdmin() {
  loginView.hidden = true;
  adminView.hidden = false;
  logoutButton.hidden = false;
  editorNote.textContent = '';
}

async function loadAdminPosts() {
  postsList.innerHTML = '<p class="section-note">Cargando entradas…</p>';

  try {
    cachedPosts = await getAllPostsForAdmin();
    renderAdminList();

    if (!fields.id.value && cachedPosts.length) {
      fillEditor(cachedPosts[0]);
    } else if (!cachedPosts.length) {
      resetEditor();
    }
  } catch (error) {
    console.error(error);
    postsList.innerHTML = '<p class="section-note">No se pudieron cargar las entradas. Revisa reglas de Firestore.</p>';
  }
}

function renderAdminList() {
  if (!cachedPosts.length) {
    postsList.innerHTML = '<p class="section-note">No hay entradas todavía. Terrible tragedia, corregible con un botón.</p>';
    return;
  }

  postsList.innerHTML = cachedPosts.map((post) => `
    <button class="admin-post-item ${post.id === fields.id.value ? 'active' : ''}" type="button" data-id="${post.id}">
      <strong>${post.title || 'Sin título'}</strong>
      <span>${post.status || 'draft'} · ${post.category || 'Sin cuaderno'}</span>
      <small>${formatDate(post.updatedAt || post.createdAt)}</small>
    </button>
  `).join('');

  postsList.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const post = cachedPosts.find((item) => item.id === button.dataset.id);
      if (post) fillEditor(post);
    });
  });
}

function fillEditor(post) {
  fields.id.value = post.id || '';
  fields.title.value = post.title || '';
  fields.category.value = post.category || '';
  fields.excerpt.value = post.excerpt || '';
  fields.status.value = post.status || 'draft';
  fields.featured.checked = Boolean(post.featured);
  fields.tags.value = tagsToString(post.tags || []);
  fields.content.value = post.content || '';
  deleteButton.hidden = !post.id;
  editorNote.textContent = `Editando: ${post.id}`;
  previewCard.hidden = true;
  renderAdminList();
}

function resetEditor() {
  fields.id.value = '';
  fields.title.value = '';
  fields.category.value = '';
  fields.excerpt.value = '';
  fields.status.value = 'draft';
  fields.featured.checked = false;
  fields.tags.value = '';
  fields.content.value = '';
  deleteButton.hidden = true;
  previewCard.hidden = true;
  editorNote.textContent = 'Nueva entrada lista. Ahora toca escribir, esa parte tan inconveniente de tener una voz propia.';
  renderAdminList();
  fields.title.focus();
}

async function handleSave(event) {
  event.preventDefault();
  editorNote.textContent = 'Guardando…';

  try {
    const id = await savePost({
      id: fields.id.value,
      title: fields.title.value,
      category: fields.category.value,
      excerpt: fields.excerpt.value,
      status: fields.status.value,
      featured: fields.featured.checked,
      tags: parseTags(fields.tags.value),
      content: fields.content.value
    });

    fields.id.value = id;
    editorNote.textContent = fields.status.value === 'published'
      ? 'Publicado. Ya existe en el archivo público.'
      : 'Guardado. Sigue invisible para visitantes mientras no esté publicado.';

    await loadAdminPosts();
    const savedPost = cachedPosts.find((post) => post.id === id);
    if (savedPost) fillEditor(savedPost);
  } catch (error) {
    console.error(error);
    editorNote.textContent = 'No se pudo guardar. Revisa permisos, reglas o conexión. La nube exige tributos, como siempre.';
  }
}

async function handleDelete() {
  const id = fields.id.value;
  if (!id) return;

  const confirmed = window.confirm('¿Eliminar esta entrada definitivamente? Mejor archivar si solo quieres ocultarla.');
  if (!confirmed) return;

  editorNote.textContent = 'Eliminando…';

  try {
    await removePost(id);
    editorNote.textContent = 'Entrada eliminada.';
    resetEditor();
    await loadAdminPosts();
  } catch (error) {
    console.error(error);
    editorNote.textContent = 'No se pudo eliminar la entrada.';
  }
}

function renderPreview() {
  const title = fields.title.value.trim() || 'Sin título';
  const category = fields.category.value.trim() || 'Sin cuaderno';
  const excerpt = fields.excerpt.value.trim();
  const content = fields.content.value.trim();

  previewBody.innerHTML = `
    <p class="post-category">${category}</p>
    <h1>${title}</h1>
    ${excerpt ? `<p class="post-header-excerpt">${excerpt}</p>` : ''}
    ${markdownToHtml(content || 'Escribe algo primero. El vacío es profundo, pero tampoco exageremos.')}
  `;
  previewCard.hidden = false;
}
