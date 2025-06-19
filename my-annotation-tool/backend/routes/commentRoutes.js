import express from 'express';
import { getComments, createComment, deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.get('/:annotationId', getComments);
router.post('/', createComment);
router.delete('/:id', deleteComment);

export default router;
