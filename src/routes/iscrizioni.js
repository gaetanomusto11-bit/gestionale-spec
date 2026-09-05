import express from 'express';
import {
  getIscrizioniAttive,
  getIscrizione,
  createIscrizione,
  updateIscrizione,
  deleteIscrizione,
  refreshPagamenti
} from '../controllers/iscrizioniController.js';

const router = express.Router();

router.get('/', getIscrizioniAttive);
router.get('/:id', getIscrizione);
router.post('/', createIscrizione);
router.put('/:id', updateIscrizione);
router.delete('/:id', deleteIscrizione);
router.post('/:id/refresh-pagamenti', refreshPagamenti);

export default router;