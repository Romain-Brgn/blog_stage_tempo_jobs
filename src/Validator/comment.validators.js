// Validateurs pour les endpoints commentaires (express-validator).
// Sécurise et normalise les entrées côté API.
const { body, param, query } = require("express-validator");

// GET /posts/:postId/comments — pagination et filtres optionnels
const listCommentsValidators = [
  param("postId").isInt({ min: 1 }),
  query("page").optional().isInt({ min: 1 }),
  query("pageSize").optional().isInt({ min: 1, max: 100 }),
  query("onlyRoots").optional().isBoolean(),
];

// POST /posts/:postId/comments — champs requis pour création
const createCommentValidators = [
  param("postId").isInt({ min: 1 }),
  body("content").isString().trim().isLength({ min: 1, max: 2000 }),
  body("comment_parent_id").optional({ nullable: true }).isInt({ min: 1 }),
];

// PUT /comments/:id — tout est optionnel; id param requis
const updateCommentValidators = [
  param("id").isInt({ min: 1 }),
  body("content").optional().isString().trim().isLength({ min: 1, max: 2000 }),
  body("status_id").optional().isInt({ min: 1 }),
  body("comment_parent_id").optional({ nullable: true }).isInt({ min: 1 }),
];

module.exports = {
  listCommentsValidators,
  createCommentValidators,
  updateCommentValidators,
};


