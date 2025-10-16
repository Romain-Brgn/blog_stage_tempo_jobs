const express = require('express');
const { NewsletterController } = require('../Controller/newsletter.controller.js');
const router = express.Router();

router.get('/', NewsletterController.getAll);
router.get('/:id', NewsletterController.getById);
router.post('/', NewsletterController.create);
router.put('/:id', NewsletterController.update);
router.delete('/:id', NewsletterController.delete);

module.exports = router;
