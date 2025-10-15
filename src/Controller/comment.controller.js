// Contrôleur des commentaires de blog.
// Gère la logique HTTP: validation, vérification des permissions, appels aux repositories et réponses JSON.
const { validationResult } = require("express-validator");
const CommentRepository = require("../Repository/CommentRepository");
const PostRepository = require("../Repository/PostRepository");

// Centralise la gestion des erreurs de validation (express-validator).
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
}

module.exports = {
  // GET /posts/:postId/comments — liste paginée des commentaires d'un post (public)
  async listByPost(req, res) {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      const postId = Number(req.params.postId);
      const post = await PostRepository.findById(postId);
      if (!post) return res.status(404).json({ message: "Post introuvable" });

      const { page = 1, pageSize = 10, onlyRoots } = req.query;
      const result = await CommentRepository.listByPost(postId, {
        page: Number(page),
        pageSize: Number(pageSize),
        onlyRoots: onlyRoots === "true" || onlyRoots === true,
      });
      return res.status(200).json(result);
    } catch (e) {
      console.error("COMMENT_LIST_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // POST /posts/:postId/comments — création d'un commentaire (auth requis, statut "pending" par défaut)
  async create(req, res) {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      const postId = Number(req.params.postId);
      const post = await PostRepository.findById(postId);
      if (!post) return res.status(404).json({ message: "Post introuvable" });

      // Récupère l'ID utilisateur depuis le JWT (req.user.sub)
      const userId = req.user?.sub || req.body.user_id;
      if (!userId) return res.status(401).json({ message: "Non autorisé" });

      const { content, comment_parent_id } = req.body;
      const status_id = 1; // "pending" par défaut (voir seeds status_comments)
      const created = await CommentRepository.create({
        post_id: postId,
        user_id: userId,
        status_id,
        comment_parent_id,
        content,
      });
      return res.status(201).json(created);
    } catch (e) {
      console.error("COMMENT_CREATE_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // PUT /comments/:id — mise à jour d'un commentaire (propriétaire ou admin uniquement)
  async update(req, res) {
    const err = handleValidation(req, res);
    if (err) return;
    try {
      const id = Number(req.params.id);
      const found = await CommentRepository.findById(id);
      if (!found) return res.status(404).json({ message: "Commentaire introuvable" });

      // Vérification des permissions: admin (role_id=1) ou propriétaire du commentaire
      const isAdmin = req.user?.role_id === 1;
      const isOwner = req.user?.sub && req.user.sub === found.user_id;
      if (!isAdmin && !isOwner) return res.status(403).json({ message: "Interdit" });

      const updated = await CommentRepository.update(id, req.body);
      if (!updated) return res.status(422).json({ message: "Aucune modification" });
      const refreshed = await CommentRepository.findById(id);
      return res.status(200).json(refreshed);
    } catch (e) {
      console.error("COMMENT_UPDATE_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // DELETE /comments/:id — suppression d'un commentaire (propriétaire ou admin uniquement)
  async remove(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await CommentRepository.findById(id);
      if (!found) return res.status(404).json({ message: "Commentaire introuvable" });

      const isAdmin = req.user?.role_id === 1;
      const isOwner = req.user?.sub && req.user.sub === found.user_id;
      if (!isAdmin && !isOwner) return res.status(403).json({ message: "Interdit" });

      const ok = await CommentRepository.remove(id);
      if (!ok) return res.status(500).json({ message: "Erreur lors de la suppression" });
      return res.status(204).send();
    } catch (e) {
      console.error("COMMENT_DELETE_ERROR:", e.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },
};


