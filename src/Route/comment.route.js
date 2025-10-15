// Routes HTTP pour les commentaires.
// Public: lecture; Auth: création; Propriétaire/Admin: modification/suppression.
const express = require("express");
const router = express.Router();

const CommentController = require("../Controller/comment.controller");
const { authenticateJWT, requireAdmin } = require("../Middleware/auth.middleware");
const {
  listCommentsValidators,
  createCommentValidators,
  updateCommentValidators,
} = require("../Validator/comment.validators");

// Liste paginée des commentaires d'un post (public)
router.get("/posts/:postId/comments", listCommentsValidators, CommentController.listByPost);

// Créer un commentaire (auth requis, statut "pending" par défaut)
router.post("/posts/:postId/comments", authenticateJWT, createCommentValidators, CommentController.create);

// Mettre à jour un commentaire (propriétaire ou admin uniquement)
router.put("/comments/:id", authenticateJWT, updateCommentValidators, CommentController.update);

// Supprimer un commentaire (propriétaire ou admin uniquement)
router.delete("/comments/:id", authenticateJWT, CommentController.remove);

module.exports = router;


