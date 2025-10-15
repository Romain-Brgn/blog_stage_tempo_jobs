// Repository d'accès aux données `posts` (MySQL via mysql2/promise).
// Encapsule les requêtes SQL et laisse le contrôleur gérer la logique HTTP.
const db = require("../db");

// Liste paginée avec filtres optionnels (status, auteur, texte, catégorie)
async function list({ page = 1, pageSize = 10, status, search, categoryId, authorId }) {
  const offset = (page - 1) * pageSize;
  const where = [];
  const params = [];

  if (typeof status !== "undefined") {
    where.push("p.status = ?");
    params.push(status);
  }
  if (typeof authorId !== "undefined") {
    where.push("p.user_id = ?");
    params.push(authorId);
  }
  if (search) {
    where.push("(p.title LIKE ? OR p.excerpt LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (typeof categoryId !== "undefined") {
    where.push("EXISTS (SELECT 1 FROM posts_categories pc WHERE pc.post_id = p.id AND pc.category_id = ?)");
    params.push(categoryId);
  }

  // Construit dynamiquement le WHERE et le réutilise pour COUNT et SELECT
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT p.id, p.title, p.slug, p.excerpt, p.cover_img_url, p.published_at, p.created_at, p.updated_at, p.status,
           p.user_id, p.is_featured, p.views_count
    FROM posts p
    ${whereSql}
    ORDER BY COALESCE(p.published_at, p.created_at) DESC
    LIMIT ? OFFSET ?`;

  const countSql = `SELECT COUNT(*) AS total FROM posts p ${whereSql}`;

  // Deux requêtes: 1) COUNT pour total, 2) SELECT paginé
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0]?.total || 0;

  const [rows] = await db.query(sql, [...params, pageSize, offset]);
  return { items: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// Récupère un post par id (ou null si absent)
async function findById(id) {
  const [rows] = await db.query(
    `SELECT id, user_id, status, title, slug, excerpt, cover_img_url, html_content, scheduled_at, published_at, is_featured, created_at, updated_at, views_count FROM posts WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Récupère un post par slug (pour vérifier l'unicité)
async function findBySlug(slug) {
  const [rows] = await db.query(
    `SELECT id, user_id, status, title, slug, excerpt, cover_img_url, html_content, scheduled_at, published_at, is_featured, created_at, updated_at, views_count FROM posts WHERE slug = ? LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

// Insère un post et renvoie l'objet avec l'id nouvellement créé
async function create(post) {
  const sql = `
    INSERT INTO posts (user_id, status, title, slug, excerpt, cover_img_url, html_content, scheduled_at, published_at, is_featured, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const params = [
    post.user_id,
    post.status,
    post.title,
    post.slug,
    post.excerpt ?? null,
    post.cover_img_url ?? null,
    post.html_content,
    post.scheduled_at ?? null,
    post.published_at ?? null,
    post.is_featured ? 1 : 0,
  ];
  const [result] = await db.query(sql, params);
  return { id: result.insertId, ...post };
}

// Met à jour des champs autorisés uniquement; force updated_at = NOW()
async function update(id, fields) {
  const allowed = [
    "status",
    "title",
    "slug",
    "excerpt",
    "cover_img_url",
    "html_content",
    "scheduled_at",
    "published_at",
    "is_featured",
    "views_count",
  ];
  const sets = [];
  const values = [];
  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = ?`);
      values.push(key === "is_featured" ? (fields[key] ? 1 : 0) : fields[key]);
    }
  }
  if (sets.length === 0) return false;
  sets.push("updated_at = NOW()");
  const sql = `UPDATE posts SET ${sets.join(", ")} WHERE id = ?`;
  values.push(id);
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
}

// Supprime un post par id; renvoie true si une ligne a été affectée
async function remove(id) {
  const [result] = await db.query(`DELETE FROM posts WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

module.exports = {
  list,
  findById,
  findBySlug,
  create,
  update,
  remove,
};


