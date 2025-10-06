const db = require("../db");

async function findByEmailOrPseudonyme(email, pseudonyme) {
  const [rows] = await db.query(
    "SELECT id FROM users WHERE email = ? OR pseudonyme = ? LIMIT 1",
    [email, pseudonyme]
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
      (id, role_id, status_id, email, pseudonyme, hash, confirm_token, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
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

module.exports = {
  findByEmailOrPseudonyme,
  getRoleIdByName,
  getStatusIdByName,
  insert,
};
