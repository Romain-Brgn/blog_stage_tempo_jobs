// Routes HTTP pour les posts.
// Public: lecture; Auth: création; Admin/Propriétaire: modification/suppression.
const express = require("express");
const router = express.Router();

const PostController = require("../Controller/post.controller");
const { authenticateJWT, requireAdmin } = require("../Middleware/auth.middleware");
const {
  createPostValidators,
  updatePostValidators,
  listPostsValidators,
} = require("../Validator/post.validators");

// Liste paginée (publique)
router.get("/all-posts", listPostsValidators, PostController.list);

// Récupérer un article (public)
router.get("/get-post/:id", PostController.getById);

// Créer un article (auth requis)
router.post("/create-post", authenticateJWT, createPostValidators, PostController.create);

// Mettre à jour un article (admin ou propriétaire)
router.put("/update-post/:id", authenticateJWT, updatePostValidators, PostController.update);

// Supprimer un article (admin ou propriétaire)
router.delete("/delete-post/:id", authenticateJWT, PostController.remove);

module.exports = router;


