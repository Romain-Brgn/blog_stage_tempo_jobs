// Routes HTTP pour les posts.
// Public: lecture; Admin: écriture (création/màj/suppression).
const express = require("express");
const router = express.Router();

const PostController = require("../Controller/post.controller");
const {
  authenticateJWT,
  requireAdmin,
} = require("../Middleware/auth.middleware");
const {
  createPostValidators,
  updatePostValidators,
  listPostsValidators,
} = require("../Validator/post.validators");

// Liste paginée (publique)
router.get("/", listPostsValidators, PostController.list);

// Récupérer un article (public)
router.get("/:id", PostController.getById);

// Créer un article (admin)
router.post(
  "/",
  authenticateJWT,
  requireAdmin,
  createPostValidators,
  PostController.create
);

// Mettre à jour un article (admin)
router.put(
  "/:id",
  authenticateJWT,
  requireAdmin,
  updatePostValidators,
  PostController.update
);

// Supprimer un article (admin)
router.delete("/:id", authenticateJWT, requireAdmin, PostController.remove);

module.exports = router;
