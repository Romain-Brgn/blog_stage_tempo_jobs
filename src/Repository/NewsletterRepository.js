import pool from '../Config/db.js';

export const NewsletterModel = {
  // 🔹 Récupérer toutes les campagnes
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM Newsletter_campaigns');
    return rows;
  },

  // 🔹 Récupérer une campagne par ID
  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM Newsletter_campaigns WHERE id = ?', [id]);
    return rows[0];
  },

  // 🔹 Créer une nouvelle campagne
  async create(data) {
    const {
      status_id,
      created_by_user,
      list_id_brevo,
      subject,
      body_html,
      body_text,
      scheduled_at,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO Newsletter_campaigns 
      (status_id, created_by_user, list_id_brevo, subject, body_html, body_text, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [status_id, created_by_user, list_id_brevo, subject, body_html, body_text, scheduled_at]
    );

    return { id: result.insertId, ...data };
  },

  // 🔹 Mettre à jour une campagne
  async update(id, data) {
    const fields = [];
    const values = [];

    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }

    const query = `UPDATE Newsletter_campaigns SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  // 🔹 Supprimer une campagne
  async delete(id) {
    const [result] = await pool.query('DELETE FROM Newsletter_campaigns WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};
