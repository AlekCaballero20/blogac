import { getPostById } from './posts.service.js';
import { formatDate, markdownToHtml, setYear } from './utils.js';

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const shell = document.getElementById('post-shell');
const empty = document.getElementById('post-empty');
const progressBar = document.getElementById('progress-bar');

init();

async function init() {
  setYear();

  if (!id) {
    showEmpty();
    return;
  }

  try {
    const post = await getPostById(id);
    if (!post || post.status !== 'published') {
      showEmpty();
      return;
    }

    renderPost(post);
    setupProgressBar();
  } catch (error) {
    console.error(error);
    showEmpty();
  }
}

function renderPost(post) {
  document.title = `${post.title} — AC`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', post.excerpt || 'Entrada del archivo AC.');

  document.getElementById('post-category').textContent = post.category || 'Sin cuaderno';
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-excerpt').textContent = post.excerpt || '';
  document.getElementById('post-date').textContent = formatDate(post.publishedAt || post.createdAt);
  document.getElementById('post-read').textContent = post.readTime || '';
  document.getElementById('post-body').innerHTML = markdownToHtml(post.content || '');

  shell.hidden = false;
  empty.hidden = true;
}

function showEmpty() {
  shell.hidden = true;
  empty.hidden = false;
}

function setupProgressBar() {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.body.scrollHeight - window.innerHeight;
    const progress = total > 0 ? (scrolled / total) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  }, { passive: true });
}
