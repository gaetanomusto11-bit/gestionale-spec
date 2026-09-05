import { queryOne, queryAll, execute } from '../config/database.js';
import { calculateImportoPagato, calculatePagamentoStatus } from '../services/rulesEngine.js';

export async function getPagamenti(req, res) {
  try {
    const { corsista, corso, edizione } = req.query;

    let sql = `SELECT * FROM pagamenti_ricevuti WHERE 1=1`;
    const params = [];

    if (corsista) {
      sql += ` AND id_corsista = ?`;
      params.push(corsista);
    }
    if (corso) {
      sql += ` AND nome_corso LIKE ?`;
      params.push(`%${corso}%`);
    }
    if (edizione) {
      sql += ` AND edizione_corso = ?`;
      params.push(edizione);
    }

    sql += ` ORDER BY data_pagamento DESC`;

    const pagamenti = await queryAll(sql, params);

    res.json({
      success: true,
      data: pagamenti,
      count: pagamenti.length
    });
  } catch (error) {
    console.error('Errore getPagamenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero pagamenti',
      message: error.message
    });
  }
}

export async function createPagamento(req, res) {
  try {
    const { id_corsista, nome_corso, edizione_corso, data_pagamento, importo, metodo_pagamento, referente, note } = req.body;

    if (!id_corsista || !nome_corso || !edizione_corso || !data_pagamento || !importo) {
      return res.status(400).json({
        success: false,
        error: 'Campi obbligatori mancanti: id_corsista, nome_corso, edizione_corso, data_pagamento, importo'
      });
    }

    const corsista = await queryOne(`SELECT * FROM contatti WHERE id_corsista = ?`, [id_corsista]);
    if (!corsista) {
      return res.status(404).json({
        success: false,
        error: 'Corsista non trovato'
      });
    }

    const idPagamento = generateUUID();

    const result = await execute(
      `INSERT INTO pagamenti_ricevuti (
        id_pagamento, id_corsista, codice_corsista, nome_corso, edizione_corso,
        data_pagamento, importo, metodo_pagamento, referente, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idPagamento,
        id_corsista,
        corsista.codice_corsista,
        nome_corso,
        edizione_corso,
        data_pagamento,
        importo,
        metodo_pagamento || 'Bonifico',
        referente || null,
        note || null
      ]
    );

    if (!result.success) {
      throw new Error('Inserimento pagamento fallito');
    }

    // Ricalcola stato pagamento sull'iscrizione attiva collegata (REGOLA 3-4)
    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_corsista = ? AND nome_corso = ? AND edizione_corso = ?`,
      [id_corsista, nome_corso, edizione_corso]
    );

    let iscrizioneAggiornata = null;
    if (iscrizione) {
      const importoPagato = await calculateImportoPagato(id_corsista, nome_corso, edizione_corso);
      const statusData = calculatePagamentoStatus(iscrizione.importo_da_versare, importoPagato);

      await execute(
        `UPDATE iscrizioni_attive
         SET importo_pagato_calcolato = ?, importo_residuo = ?, stato_pagamento = ?, data_modifica = CURRENT_TIMESTAMP
         WHERE id_iscrizione = ?`,
        [importoPagato, statusData.importoResiduo, statusData.statoPagamento, iscrizione.id_iscrizione]
      );

      iscrizioneAggiornata = await queryOne(
        `SELECT * FROM iscrizioni_attive WHERE id_iscrizione = ?`,
        [iscrizione.id_iscrizione]
      );
    }

    res.status(201).json({
      success: true,
      message: `✓ Pagamento di €${importo} registrato per ${corsista.nome} ${corsista.cognome}`,
      data: {
        id_pagamento: idPagamento,
        iscrizione_aggiornata: iscrizioneAggiornata
      }
    });
  } catch (error) {
    console.error('Errore createPagamento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella registrazione pagamento',
      message: error.message
    });
  }
}

export async function updatePagamento(req, res) {
  try {
    const { id } = req.params;
    const { data_pagamento, importo, metodo_pagamento, note } = req.body;

    const pagamento = await queryOne(
      `SELECT * FROM pagamenti_ricevuti WHERE id_pagamento = ?`,
      [id]
    );

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        error: 'Pagamento non trovato'
      });
    }

    await execute(
      `UPDATE pagamenti_ricevuti 
       SET data_pagamento = ?, importo = ?, metodo_pagamento = ?, note = ?
       WHERE id_pagamento = ?`,
      [
        data_pagamento || pagamento.data_pagamento,
        importo || pagamento.importo,
        metodo_pagamento || pagamento.metodo_pagamento,
        note !== undefined ? note : pagamento.note,
        id
      ]
    );

    // Ricalcola stato pagamento sull'iscrizione collegata (REGOLA 3-4)
    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_corsista = ? AND nome_corso = ? AND edizione_corso = ?`,
      [pagamento.id_corsista, pagamento.nome_corso, pagamento.edizione_corso]
    );

    if (iscrizione) {
      const importoPagato = await calculateImportoPagato(pagamento.id_corsista, pagamento.nome_corso, pagamento.edizione_corso);
      const statusData = calculatePagamentoStatus(iscrizione.importo_da_versare, importoPagato);

      await execute(
        `UPDATE iscrizioni_attive
         SET importo_pagato_calcolato = ?, importo_residuo = ?, stato_pagamento = ?, data_modifica = CURRENT_TIMESTAMP
         WHERE id_iscrizione = ?`,
        [importoPagato, statusData.importoResiduo, statusData.statoPagamento, iscrizione.id_iscrizione]
      );
    }

    const updated = await queryOne(
      `SELECT * FROM pagamenti_ricevuti WHERE id_pagamento = ?`,
      [id]
    );

    res.json({
      success: true,
      message: '✓ Pagamento aggiornato',
      data: updated
    });
  } catch (error) {
    console.error('Errore updatePagamento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiornamento pagamento',
      message: error.message
    });
  }
}

export async function deletePagamento(req, res) {
  try {
    const { id } = req.params;

    const pagamento = await queryOne(
      `SELECT * FROM pagamenti_ricevuti WHERE id_pagamento = ?`,
      [id]
    );

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        error: 'Pagamento non trovato'
      });
    }

    await execute(
      `DELETE FROM pagamenti_ricevuti WHERE id_pagamento = ?`,
      [id]
    );

    // Ricalcola stato pagamento sull'iscrizione collegata (REGOLA 3-4)
    const iscrizione = await queryOne(
      `SELECT * FROM iscrizioni_attive WHERE id_corsista = ? AND nome_corso = ? AND edizione_corso = ?`,
      [pagamento.id_corsista, pagamento.nome_corso, pagamento.edizione_corso]
    );

    if (iscrizione) {
      const importoPagato = await calculateImportoPagato(pagamento.id_corsista, pagamento.nome_corso, pagamento.edizione_corso);
      const statusData = calculatePagamentoStatus(iscrizione.importo_da_versare, importoPagato);

      await execute(
        `UPDATE iscrizioni_attive
         SET importo_pagato_calcolato = ?, importo_residuo = ?, stato_pagamento = ?, data_modifica = CURRENT_TIMESTAMP
         WHERE id_iscrizione = ?`,
        [importoPagato, statusData.importoResiduo, statusData.statoPagamento, iscrizione.id_iscrizione]
      );
    }

    res.json({
      success: true,
      message: '✓ Pagamento eliminato'
    });
  } catch (error) {
    console.error('Errore deletePagamento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'eliminazione pagamento',
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

export default { getPagamenti, createPagamento, updatePagamento, deletePagamento };