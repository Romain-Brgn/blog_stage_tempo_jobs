// Validateurs pour les endpoints posts (express-validator).
// Sécurise et normalise les entrées côté API.
const { body, param, query } = require("express-validator");

// POST /posts — champs requis et formats
const createPostValidators = [
  body("title").isString().trim().isLength({ min: 3, max: 100 }),
  body("slug").isString().trim().isLength({ min: 3, max: 100 }),
  body("html_content").isString().isLength({ min: 1 }),
  body("status").isInt({ min: 1 }),
  body("excerpt").optional({ nullable: true }).isString(),
  body("cover_img_url").optional({ nullable: true }).isURL().bail(),
  body("scheduled_at").optional({ nullable: true }).isISO8601(),
  body("published_at").optional({ nullable: true }).isISO8601(),
  body("is_featured").optional().isBoolean(),
];

// PUT /posts/:id — tout est optionnel; id param requis
const updatePostValidators = [
  param("id").isInt({ min: 1 }),
  body("title").optional().isString().trim().isLength({ min: 3, max: 100 }),
  body("slug").optional().isString().trim().isLength({ min: 3, max: 100 }),
  body("html_content").optional().isString().isLength({ min: 1 }),
  body("status").optional().isInt({ min: 1 }),
  body("excerpt").optional({ nullable: true }).isString(),
  body("cover_img_url").optional({ nullable: true }).isURL().bail(),
  body("scheduled_at").optional({ nullable: true }).isISO8601(),
  body("published_at").optional({ nullable: true }).isISO8601(),
  body("is_featured").optional().isBoolean(),
  body("views_count").optional().isInt({ min: 0 }),
];

// GET /posts — pagination & filtres optionnels
const listPostsValidators = [
  query("page").optional().isInt({ min: 1 }),
  query("pageSize").optional().isInt({ min: 1, max: 100 }),
  query("status").optional().isInt({ min: 1 }),
  query("authorId").optional().isString().isLength({ min: 1, max: 50 }),
  query("categoryId").optional().isInt({ min: 1 }),
  query("search").optional().isString().trim().isLength({ min: 1, max: 100 }),
];

module.exports = {
  createPostValidators,
  updatePostValidators,
  listPostsValidators,
};


