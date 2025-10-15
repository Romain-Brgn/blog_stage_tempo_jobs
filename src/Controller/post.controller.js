// Contrôleur des posts de blog.
// Regroupe la logique HTTP: validation, lecture de l'utilisateur, appels au repository et réponses JSON.
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const PostRepository = require("../Repository/PostRepository");

// Centralise la gestion des erreurs de validation (express-validator).
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
}

module.exports = {
  // GET /posts — Liste paginée avec filtres (public)
  async list(req, res) {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      const { page = 1, pageSize = 10, status, search, categoryId, authorId } = req.query;
      const result = await PostRepository.list({
        page: Number(page),
        pageSize: Number(pageSize),
        status: typeof status !== "undefined" ? Number(status) : undefined,
        search,
        categoryId: typeof categoryId !== "undefined" ? Number(categoryId) : undefined,
        authorId,
      });
      return res.status(200).json(result);
    } catch (e) {
      console.error("POST_LIST_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // GET /posts/:id — Détail d'un post (public)
  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const post = await PostRepository.findById(id);
      if (!post) return res.status(404).json({ message: "Article introuvable" });
      return res.status(200).json(post);
    } catch (e) {
      console.error("POST_GET_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // POST /posts — Création (admin): lit l'id user du JWT, vérifie l'unicité du slug
  async create(req, res) {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      // user id depuis JWT
      const userId = req.user?.sub || req.body.user_id; // fallback utile si route non protégée
      if (!userId) return res.status(401).json({ message: "Non autorisé" });

      const {
        status,
        title,
        slug,
        excerpt,
        cover_img_url,
        html_content,
        scheduled_at,
        published_at,
        is_featured,
      } = req.body;

      const exists = await PostRepository.findBySlug(slug);
      if (exists) return res.status(409).json({ message: "Slug déjà utilisé" });

      const created = await PostRepository.create({
        user_id: userId,
        status,
        title,
        slug,
        excerpt,
        cover_img_url,
        html_content,
        scheduled_at,
        published_at,
        is_featured: !!is_featured,
      });
      return res.status(201).json(created);
    } catch (e) {
      console.error("POST_CREATE_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // PUT /posts/:id — Mise à jour (admin): vérifie l'existence puis renvoie le post mis à jour
  async update(req, res) {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      const id = Number(req.params.id);
      const found = await PostRepository.findById(id);
      if (!found) return res.status(404).json({ message: "Article introuvable" });

      const updated = await PostRepository.update(id, req.body);
      if (!updated) return res.status(400).json({ message: "Aucune modification" });
      const refreshed = await PostRepository.findById(id);
      return res.status(200).json(refreshed);
    } catch (e) {
      console.error("POST_UPDATE_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // DELETE /posts/:id — Suppression (admin): 204 si OK
  async remove(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await PostRepository.remove(id);
      if (!ok) return res.status(404).json({ message: "Article introuvable" });
      return res.status(204).send();
    } catch (e) {
      console.error("POST_DELETE_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },
};


