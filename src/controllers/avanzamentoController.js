import { queryOne, queryAll, execute } from '../config/database.js';
import { calculateAvanzamentoPercorso } from '../services/rulesEngine.js';

export async function getAvanzamentiPercorso(req, res) {
  try {
    const avanzamenti = await queryAll(
      `SELECT * FROM avanzamento_percorso ORDER BY percentuale_avanzamento DESC`
    );

    res.json({
      success: true,
      data: avanzamenti,
      count: avanzamenti.length
    });
  } catch (error) {
    console.error('Errore getAvanzamentiPercorso:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero avanzamenti',
      message: error.message
    });
  }
}

export async function getAvanzamentoCorsista(req, res) {
  try {
    const { idCorsista } = req.params;

    const avanzamento = await queryOne(
      `SELECT * FROM avanzamento_percorso WHERE id_corsista = ?`,
      [idCorsista]
    );

    if (!avanzamento) {
      return res.status(404).json({
        success: false,
        error: 'Avanzamento non trovato per questo corsista'
      });
    }

    res.json({
      success: true,
      data: avanzamento
    });
  } catch (error) {
    console.error('Errore getAvanzamentoCorsista:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero avanzamento',
      message: error.message
    });
  }
}

export async function calculateAvanzamento(req, res) {
  try {
    const { idCorsista } = req.body;

    if (!idCorsista) {
      return res.status(400).json({
        success: false,
        error: 'ID corsista è obbligatorio'
      });
    }

    // Calcola avanzamento (Regola 7)
    const resultado = await calculateAvanzamentoPercorso(idCorsista);

    // Recupera record aggiornato
    const avanzamento = await queryOne(
      `SELECT * FROM avanzamento_percorso WHERE id_corsista = ?`,
      [idCorsista]
    );

    res.json({
      success: true,
      message: `✓ Avanzamento calcolato: ${resultado.tappe_completate}/11 tappe (${resultado.percentuale_avanzamento}%)`,
      data: avanzamento
    });
  } catch (error) {
    console.error('Errore calculateAvanzamento:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel calcolo avanzamento',
      message: error.message
    });
  }
}

export async function getTopCorsisti(req, res) {
  try {
    const topCorsisti = await queryAll(
      `SELECT 
        id_corsista, 
        codice_corsista, 
        nome, 
        cognome, 
        totale_tappe_completate, 
        percentuale_avanzamento 
       FROM avanzamento_percorso 
       ORDER BY percentuale_avanzamento DESC 
       LIMIT 10`
    );

    res.json({
      success: true,
      message: 'Top 10 corsisti per avanzamento',
      data: topCorsisti
    });
  } catch (error) {
    console.error('Errore getTopCorsisti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero top corsisti',
      message: error.message
    });
  }
}

export async function getTappeDettaglio(req, res) {
  try {
    const { idCorsista } = req.params;

    const avanzamento = await queryOne(
      `SELECT * FROM avanzamento_percorso WHERE id_corsista = ?`,
      [idCorsista]
    );

    if (!avanzamento) {
      return res.status(404).json({
        success: false,
        error: 'Avanzamento non trovato'
      });
    }

    const tappe = [
      { numero: 1, nome: 'Presentazione SPEC', completata: avanzamento.tappa_1_presentazione_spec },
      { numero: 2, nome: 'Serate', completata: avanzamento.tappa_2_serate },
      { numero: 3, nome: 'Radici I', completata: avanzamento.tappa_3_radici_1 },
      { numero: 4, nome: 'Radici II', completata: avanzamento.tappa_4_radici_2 },
      { numero: 5, nome: 'Radici III', completata: avanzamento.tappa_5_radici_3 },
      { numero: 6, nome: 'Radici IV', completata: avanzamento.tappa_6_radici_4 },
      { numero: 7, nome: 'Rami I', completata: avanzamento.tappa_7_rami_1 },
      { numero: 8, nome: 'Rami II', completata: avanzamento.tappa_8_rami_2 },
      { numero: 9, nome: 'Rami III', completata: avanzamento.tappa_9_rami_3 },
      { numero: 10, nome: 'Rami IV', completata: avanzamento.tappa_10_rami_4 },
      { numero: 11, nome: 'Semi', completata: avanzamento.tappa_11_semi }
    ];

    res.json({
      success: true,
      data: {
        corsista: `${avanzamento.nome} ${avanzamento.cognome}`,
        codice: avanzamento.codice_corsista,
        percentuale_avanzamento: avanzamento.percentuale_avanzamento,
        tappe: tappe
      }
    });
  } catch (error) {
    console.error('Errore getTappeDettaglio:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dettaglio tappe',
      message: error.message
    });
  }
}

export default {
  getAvanzamentiPercorso,
  getAvanzamentoCorsista,
  calculateAvanzamento,
  getTopCorsisti,
  getTappeDettaglio
};