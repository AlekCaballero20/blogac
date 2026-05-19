import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  ADMIN_EMAIL
} from './firebase.js';
import {
  makePostId,
  estimateReadingTime,
  makeExcerpt,
  sortByDateDesc
} from './utils.js';

const POSTS_COLLECTION = 'posts';
const postsRef = collection(db, POSTS_COLLECTION);

function normalizePostSnapshot(snapshot) {
  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function getPublishedPosts() {
  const publishedQuery = query(postsRef, where('status', '==', 'published'));
  const snapshot = await getDocs(publishedQuery);
  const posts = snapshot.docs.map(normalizePostSnapshot);
  return sortByDateDesc(posts);
}

export async function getAllPostsForAdmin() {
  const snapshot = await getDocs(postsRef);
  const posts = snapshot.docs.map(normalizePostSnapshot);
  return sortByDateDesc(posts);
}

export async function getPostById(id) {
  if (!id) return null;
  const snapshot = await getDoc(doc(db, POSTS_COLLECTION, id));
  return snapshot.exists() ? normalizePostSnapshot(snapshot) : null;
}

export async function savePost({ id, title, category, excerpt, content, status, featured, tags }) {
  const cleanTitle = title.trim();
  const postId = id || makePostId(cleanTitle);
  const nowServerValue = serverTimestamp();
  const payload = {
    title: cleanTitle,
    category: category.trim(),
    excerpt: makeExcerpt(content, excerpt || ''),
    content: content.trim(),
    status,
    featured: Boolean(featured),
    tags: Array.isArray(tags) ? tags : [],
    readTime: estimateReadingTime(content),
    authorEmail: ADMIN_EMAIL,
    updatedAt: nowServerValue
  };

  if (!id) {
    payload.createdAt = nowServerValue;
  }

  if (status === 'published') {
    payload.publishedAt = nowServerValue;
  }

  await setDoc(doc(db, POSTS_COLLECTION, postId), payload, { merge: true });
  return postId;
}

export async function removePost(id) {
  if (!id) throw new Error('Falta el ID de la entrada.');
  await deleteDoc(doc(db, POSTS_COLLECTION, id));
}
