// Repository d'accès aux données `comments` (MySQL via mysql2/promise).
// Encapsule les requêtes SQL et gère les relations commentaires-posts.
const db = require("../db");

// Liste paginée de commentaires pour un post donné, avec option pour n'afficher que les commentaires racine
async function listByPost(postId, { page = 1, pageSize = 10, onlyRoots = false }) {
  const offset = (page - 1) * pageSize;
  const where = ["c.post_id = ?"]; // filtre obligatoire par post
  const params = [postId];
  
  // Option pour n'afficher que les commentaires racine (sans parent)
  if (onlyRoots) {
    where.push("c.comment_parent_id IS NULL");
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  // Deux requêtes: 1) COUNT pour total, 2) SELECT paginé
  const countSql = `SELECT COUNT(*) AS total FROM comments c ${whereSql}`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0]?.total || 0;

  const sql = `
    SELECT c.id, c.post_id, c.user_id, c.status_id, c.comment_parent_id, c.content, c.created_at
    FROM comments c
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?`;
  const [rows] = await db.query(sql, [...params, pageSize, offset]);
  return { items: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// Récupère un commentaire par son ID (ou null si absent)
async function findById(id) {
  const [rows] = await db.query(
    `SELECT id, post_id, user_id, status_id, comment_parent_id, content, created_at FROM comments WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Crée un nouveau commentaire et renvoie l'objet avec l'ID nouvellement créé
async function create(comment) {
  const sql = `
    INSERT INTO comments (post_id, user_id, status_id, comment_parent_id, content, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())`;
  const params = [
    comment.post_id,
    comment.user_id,
    comment.status_id,
    comment.comment_parent_id ?? null,
    comment.content,
  ];
  const [result] = await db.query(sql, params);
  return { id: result.insertId, ...comment };
}

// Met à jour un commentaire avec les champs autorisés uniquement
async function update(id, fields) {
  const allowed = ["status_id", "content", "comment_parent_id"];
  const sets = [];
  const values = [];
  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (sets.length === 0) return false;
  const sql = `UPDATE comments SET ${sets.join(", ")} WHERE id = ?`;
  values.push(id);
  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
}

// Supprime un commentaire par son ID; renvoie true si une ligne a été affectée
async function remove(id) {
  const [result] = await db.query(`DELETE FROM comments WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

module.exports = {
  listByPost,
  findById,
  create,
  update,
  remove,
};


