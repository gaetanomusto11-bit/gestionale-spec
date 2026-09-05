import express from 'express';
import {
  getContatti,
  getContatto,
  createContatto,
  updateContatto,
  deleteContatto,
  searchContatti
} from '../controllers/contattiController.js';

const router = express.Router();

router.get('/', getContatti);
router.get('/search/:query', searchContatti);
router.get('/:id', getContatto);
router.post('/', createContatto);
router.put('/:id', updateContatto);
router.delete('/:id', deleteContatto);

export default router;