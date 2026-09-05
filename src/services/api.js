import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Crea istanza axios con baseURL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================================================
// CONTATTI (Corsisti) - REGOLA 1
// ============================================================================

export async function getContatti() {
  try {
    const response = await apiClient.get('/contatti');
    return response.data;
  } catch (error) {
    console.error('Errore getContatti:', error);
    throw error;
  }
}

export async function getContatto(id) {
  try {
    const response = await apiClient.get(`/contatti/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore getContatto:', error);
    throw error;
  }
}

export async function createContatto(data) {
  try {
    const response = await apiClient.post('/contatti', data);
    return response.data;
  } catch (error) {
    console.error('Errore createContatto:', error);
    throw error;
  }
}

export async function updateContatto(id, data) {
  try {
    const response = await apiClient.put(`/contatti/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Errore updateContatto:', error);
    throw error;
  }
}

export async function deleteContatto(id) {
  try {
    const response = await apiClient.delete(`/contatti/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore deleteContatto:', error);
    throw error;
  }
}

export async function searchContatti(query) {
  try {
    const response = await apiClient.get(`/contatti/search/${query}`);
    return response.data;
  } catch (error) {
    console.error('Errore searchContatti:', error);
    throw error;
  }
}

// ============================================================================
// ISCRIZIONI ATTIVE - REGOLE 2-4
// ============================================================================

export async function getIscrizioniAttive(filters = {}) {
  try {
    const response = await apiClient.get('/iscrizioni-attive', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Errore getIscrizioniAttive:', error);
    throw error;
  }
}

export async function getIscrizione(id) {
  try {
    const response = await apiClient.get(`/iscrizioni-attive/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore getIscrizione:', error);
    throw error;
  }
}

export async function createIscrizione(data) {
  try {
    const response = await apiClient.post('/iscrizioni-attive', data);
    return response.data;
  } catch (error) {
    console.error('Errore createIscrizione:', error);
    throw error;
  }
}

export async function updateIscrizione(id, data) {
  try {
    const response = await apiClient.put(`/iscrizioni-attive/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Errore updateIscrizione:', error);
    throw error;
  }
}

export async function deleteIscrizione(id) {
  try {
    const response = await apiClient.delete(`/iscrizioni-attive/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore deleteIscrizione:', error);
    throw error;
  }
}

export async function refreshPagamenti(id) {
  try {
    const response = await apiClient.post(`/iscrizioni-attive/${id}/refresh-pagamenti`);
    return response.data;
  } catch (error) {
    console.error('Errore refreshPagamenti:', error);
    throw error;
  }
}

// ============================================================================
// PAGAMENTI RICEVUTI
// ============================================================================

export async function getPagamenti(filters = {}) {
  try {
    const response = await apiClient.get('/pagamenti-ricevuti', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Errore getPagamenti:', error);
    throw error;
  }
}

export async function createPagamento(data) {
  try {
    const response = await apiClient.post('/pagamenti-ricevuti', data);
    return response.data;
  } catch (error) {
    console.error('Errore createPagamento:', error);
    throw error;
  }
}

export async function updatePagamento(id, data) {
  try {
    const response = await apiClient.put(`/pagamenti-ricevuti/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Errore updatePagamento:', error);
    throw error;
  }
}

export async function deletePagamento(id) {
  try {
    const response = await apiClient.delete(`/pagamenti-ricevuti/${id}`);
    return response.data;
  } catch (error) {
    console.error('Errore deletePagamento:', error);
    throw error;
  }
}

// ============================================================================
// ISCRIZIONI STORICHE - REGOLE 5-6
// ============================================================================

export async function getIscrizioniStoriche(filters = {}) {
  try {
    const response = await apiClient.get('/iscrizioni-storiche', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Errore getIscrizioniStoriche:', error);
    throw error;
  }
}

export async function getDashboardSummary() {
  try {
    const response = await apiClient.get('/iscrizioni-storiche/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Errore getDashboardSummary:', error);
    throw error;
  }
}

export async function archiveIscrizione(idIscrizione) {
  try {
    const response = await apiClient.post('/iscrizioni-storiche/archive', { idIscrizione });
    return response.data;
  } catch (error) {
    console.error('Errore archiveIscrizione:', error);
    throw error;
  }
}

// ============================================================================
// AVANZAMENTO PERCORSO - REGOLA 7
// ============================================================================

export async function getAvanzamenti() {
  try {
    const response = await apiClient.get('/avanzamento');
    return response.data;
  } catch (error) {
    console.error('Errore getAvanzamenti:', error);
    throw error;
  }
}

export async function getAvanzamentoCorsista(idCorsista) {
  try {
    const response = await apiClient.get(`/avanzamento/${idCorsista}`);
    return response.data;
  } catch (error) {
    console.error('Errore getAvanzamentoCorsista:', error);
    throw error;
  }
}

export async function getTappeDettaglio(idCorsista) {
  try {
    const response = await apiClient.get(`/avanzamento/${idCorsista}/tappe`);
    return response.data;
  } catch (error) {
    console.error('Errore getTappeDettaglio:', error);
    throw error;
  }
}

export async function calculateAvanzamento(idCorsista) {
  try {
    const response = await apiClient.post('/avanzamento/calculate', { idCorsista });
    return response.data;
  } catch (error) {
    console.error('Errore calculateAvanzamento:', error);
    throw error;
  }
}

export async function getTopCorsisti() {
  try {
    const response = await apiClient.get('/avanzamento/top');
    return response.data;
  } catch (error) {
    console.error('Errore getTopCorsisti:', error);
    throw error;
  }
}

// ============================================================================
// FATTURE FORNITORI - REGOLE 8-9
// ============================================================================

export async function getFatture(filters = {}) {
  try {
    const response = await apiClient.get('/fatture', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Errore getFatture:', error);
    throw error;
  }
}

export async function getFattura(numeroFattura) {
  try {
    const response = await apiClient.get(`/fatture/${numeroFattura}`);
    return response.data;
  } catch (error) {
    console.error('Errore getFattura:', error);
    throw error;
  }
}

export async function createFattura(data) {
  try {
    const response = await apiClient.post('/fatture', data);
    return response.data;
  } catch (error) {
    console.error('Errore createFattura:', error);
    throw error;
  }
}

export async function registraPagamentoFornitore(data) {
  try {
    const response = await apiClient.post('/fatture/pagamento/registra', data);
    return response.data;
  } catch (error) {
    console.error('Errore registraPagamentoFornitore:', error);
    throw error;
  }
}

export async function getPoolReferente(referente) {
  try {
    const response = await apiClient.get(`/fatture/pool/${referente}`);
    return response.data;
  } catch (error) {
    console.error('Errore getPoolReferente:', error);
    throw error;
  }
}

export default apiClient;