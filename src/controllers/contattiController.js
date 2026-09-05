import { queryOne, queryAll, execute } from '../config/database.js';
import { 
  applyRule1_GenerateCodiceCorsista,
  generateCodiceCorsista 
} from '../services/rulesEngine.js';
import { 
  validateContatto, 
  isValidUUID, 
  sanitizeString 
} from '../utils/validators.js';

export async function getContatti(req, res) {
  try {
    const contatti = await queryAll(
      `SELECT * FROM contatti WHERE attivo = 1 ORDER BY cognome, nome`
    );

    res.json({
      success: true,
      data: contatti,
      count: contatti.length
    });
  } catch (error) {
    console.error('Errore getContatti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero contatti',
      message: error.message
    });
  }
}

export async function getContatto(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id) && id.length !== 32) {
      return res.status(400).json({
        success: false,
        error: 'ID corsista non valido'
      });
    }

    const contatto = await queryOne(
      `SELECT * FROM contatti WHERE id_corsista = ?`,
      [id]
    );

    if (!contatto) {
      return res.status(404).json({
        success: false,
        error: 'Corsista non trovato'
      });
    }

    res.json({
      success: true,
      data: contatto
    });
  } catch (error) {
    console.error('Errore getContatto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero contatto',
      message: error.message
    });
  }
}

export async function createContatto(req, res) {
  try {
    const { nome, cognome, email, telefono, note, codice_corsista } = req.body;

    const validation = validateContatto({
      nome, cognome, email, telefono, note, codice_corsista
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validazione fallita',
        errors: validation.errors
      });
    }

    const data = validation.data;

    if (!data.codice_corsista) {
      try {
        data.codice_corsista = await generateCodiceCorsista(data.nome, data.cognome);
      } catch (error) {
        console.error('Errore generazione codice:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore generazione codice corsista',
          message: error.message
        });
      }
    }

    const existing = await queryOne(
      `SELECT id_corsista FROM contatti WHERE codice_corsista = ?`,
      [data.codice_corsista]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Codice corsista già esistente',
        code: 'DUPLICATE_CODE'
      });
    }

    const idCorsista = generateUUID();

    const result = await execute(
      `INSERT INTO contatti 
       (id_corsista, codice_corsista, nome, cognome, email, telefono, note, data_iscrizione, attivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idCorsista,
        data.codice_corsista,
        data.nome,
        data.cognome,
        data.email,
        data.telefono,
        data.note,
        data.data_iscrizione,
        data.attivo ? 1 : 0
      ]
    );

    if (!result.success) {
      throw new Error('Inserimento nel database fallito');
    }

    const corsista = await queryOne(
      `SELECT * FROM contatti WHERE id_corsista = ?`,
      [idCorsista]
    );

    res.status(201).json({
      success: true,
      message: `✓ Corsista creato con codice ${data.codice_corsista}`,
      data: corsista
    });
  } catch (error) {
    console.error('Errore createContatto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella creazione corsista',
      message: error.message
    });
  }
}

export async function updateContatto(req, res) {
  try {
    const { id } = req.params;
    const { nome, cognome, email, telefono, note, attivo } = req.body;

    if (!isValidUUID(id) && id.length !== 32) {
      return res.status(400).json({
        success: false,
        error: 'ID corsista non valido'
      });
    }

    const existing = await queryOne(
      `SELECT * FROM contatti WHERE id_corsista = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Corsista non trovato'
      });
    }

    const updateData = {
      nome: nome || existing.nome,
      cognome: cognome || existing.cognome,
      email: email !== undefined ? email : existing.email,
      telefono: telefono !== undefined ? telefono : existing.telefono,
      note: note !== undefined ? note : existing.note,
      attivo: attivo !== undefined ? attivo : existing.attivo
    };

    const validation = validateContatto(updateData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validazione fallita',
        errors: validation.errors
      });
    }

    const data = validation.data;

    await execute(
      `UPDATE contatti 
       SET nome = ?, cognome = ?, email = ?, telefono = ?, note = ?, attivo = ?, data_modifica = CURRENT_TIMESTAMP
       WHERE id_corsista = ?`,
      [
        data.nome,
        data.cognome,
        data.email,
        data.telefono,
        data.note,
        data.attivo ? 1 : 0,
        id
      ]
    );

    const updated = await queryOne(
      `SELECT * FROM contatti WHERE id_corsista = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '✓ Corsista aggiornato',
      data: updated
    });
  } catch (error) {
    console.error('Errore updateContatto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento corsista',
      message: error.message
    });
  }
}

export async function deleteContatto(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id) && id.length !== 32) {
      return res.status(400).json({
        success: false,
        error: 'ID corsista non valido'
      });
    }

    const existing = await queryOne(
      `SELECT * FROM contatti WHERE id_corsista = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Corsista non trovato'
      });
    }

    await execute(
      `UPDATE contatti SET attivo = 0, data_modifica = CURRENT_TIMESTAMP WHERE id_corsista = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '✓ Corsista disattivato'
    });
  } catch (error) {
    console.error('Errore deleteContatto:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella disattivazione corsista',
      message: error.message
    });
  }
}

export async function searchContatti(req, res) {
  try {
    const { query } = req.params;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query di ricerca deve avere almeno 2 caratteri'
      });
    }

    const searchTerm = `%${sanitizeString(query)}%`;

    const risultati = await queryAll(
      `SELECT * FROM contatti 
       WHERE attivo = 1 AND (
         nome LIKE ? OR 
         cognome LIKE ? OR 
         codice_corsista LIKE ? OR
         email LIKE ?
       )
       ORDER BY cognome, nome
       LIMIT 50`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json({
      success: true,
      query,
      data: risultati,
      count: risultati.length
    });
  } catch (error) {
    console.error('Errore searchContatti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella ricerca',
      message: error.message
    });
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default {
  getContatti,
  getContatto,
  createContatto,
  updateContatto,
  deleteContatto,
  searchContatti
};