const db = require("../db");

async function findByEmail(email) {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0];
}

async function findByPseudonyme(pseudonyme) {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE pseudonyme = ? LIMIT 1",
    [pseudonyme]
  );
  return rows[0];
}

async function getRoleIdByName(name) {
  const [rows] = await db.query(
    "SELECT id FROM role_users WHERE name = ? LIMIT 1",
    [name]
  );
  return rows[0]?.id;
}

async function getStatusIdByName(name) {
  const [rows] = await db.query(
    "SELECT id FROM status_users WHERE name = ? LIMIT 1",
    [name]
  );
  return rows[0]?.id;
}

async function insert(user) {
  const sql = `
    INSERT INTO users
      (id, role_id, status_id, email, pseudonyme, hash, confirm_token, confirm_token_expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?,DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW())
  `;
  await db.query(sql, [
    user.id,
    user.role_id,
    user.status_id,
    user.email,
    user.pseudonyme,
    user.hash,
    user.confirm_token,
  ]);
}
//Recuperation de id et confirmed_at du user par le token,
// servira dans le controller pour définir si le token
// a déjà été confirmer ou pas (si oui confirmed_at != null)
async function findByToken(token) {
  const [rows] = await db.query(
    `SELECT id, confirmed_at, confirm_token_expires_at FROM users WHERE confirm_token = ? LIMIT 1`,
    [token]
  );
  return rows[0];
}

async function tokenConfirmation(userId) {
  const [result] = await db.query(
    `UPDATE users SET confirmed_at = NOW(), confirm_token = null WHERE id = ?`,
    [userId]
  );
  return result.affectedRows === 1;
}

async function findByEmailDetailed(email) {
  const [rows] = await db.query(
    `
    SELECT id, confirmed_at, confirm_token, confirm_token_expires_at FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0];
}

async function refreshConfirmToken(userId, newToken) {
  const [result] = await db.query(
    `UPDATE users SET confirm_token = ?, confirm_token_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE id = ?`,
    [newToken, userId]
  );
  return result.affectedRows === 1;
}

async function findForLoginByEmail(email) {
  const [rows] = await db.query(
    `SELECT id, email, pseudonyme, hash, confirmed_at, role_id, status_id FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}
async function findForLoginByPseudonyme(pseudonyme) {
  const [rows] = await db.query(
    `SELECT id, email, pseudonyme, hash, confirmed_at, role_id, status_id FROM users WHERE pseudonyme = ? LIMIT 1 `,
    [pseudonyme]
  );
  return rows[0] || null;
}

async function setLastLogin(userId) {
  const [result] = await db.query(
    `UPDATE users SET last_login = NOW() WHERE id = ?`,
    [userId]
  );
  return result.affectedRows === 1;
}

/**Ici je crée un autre token
 * qui aura 30 jours avant d'expirer
 * qui permet de préserver la connexion
 * sur un ou plusieurs device
 * sans avoir besoin de retaper un password
 * + pour l'ux
 */
async function createRefreshToken({
  user_id,
  token_hash,
  expires_at,
  user_agent,
  ip,
}) {
  const sql = `
    INSERT INTO user_refresh_tokens
      (user_id, token_hash, expires_at, user_agent, ip)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    user_id,
    token_hash,
    expires_at,
    user_agent ?? null,
    ip ?? null,
  ]);
  return result.affectedRows === 1;
}
//ici je recupere via post/auth/refresh le hash du client et le compare en bdd pour savoir
//si il est toujours actif et si il n'a pas été révoqué
async function findValidRefreshToken(token_hash) {
  const [rows] = await db.query(
    `SELECT *
     FROM user_refresh_tokens
     WHERE token_hash = ?
       AND revoked_at IS NULL
       AND expires_at >= NOW()
     LIMIT 1`,
    [token_hash]
  );
  return rows[0] || null;
}
// ici on peux révoqué (rotation donc création d'un nouveau token, ou bien logout)
async function revokeRefreshToken(token_hash) {
  const [result] = await db.query(
    `UPDATE user_refresh_tokens
     SET revoked_at = NOW()
     WHERE token_hash = ?
       AND revoked_at IS NULL`,
    [token_hash]
  );
  return result.affectedRows === 1;
}

async function findByIdForClaims(userId) {
  const [rows] = await db.query(
    "SELECT id, role_id, status_id FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  findByEmail,
  findByPseudonyme,
  getRoleIdByName,
  getStatusIdByName,
  insert,
  findByToken,
  tokenConfirmation,
  findByEmailDetailed,
  refreshConfirmToken,
  findForLoginByEmail,
  findForLoginByPseudonyme,
  setLastLogin,
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  findByIdForClaims,
};
