import { Router } from 'express';
import { NewsletterController } from '../Controller/newsletterController.js';

const router = Router();

router.get('/', NewsletterController.getAll);
router.get('/:id', NewsletterController.getById);
router.post('/', NewsletterController.create);
router.put('/:id', NewsletterController.update);
router.delete('/:id', NewsletterController.delete);

export default router;
no