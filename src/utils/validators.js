export function validateContatto(data) {
  const errors = {};

  if (!data.nome || data.nome.trim().length === 0) {
    errors.nome = 'Nome è obbligatorio';
  } else if (data.nome.length < 2 || data.nome.length > 100) {
    errors.nome = 'Nome deve essere tra 2 e 100 caratteri';
  }

  if (!data.cognome || data.cognome.trim().length === 0) {
    errors.cognome = 'Cognome è obbligatorio';
  } else if (data.cognome.length < 2 || data.cognome.length > 100) {
    errors.cognome = 'Cognome deve essere tra 2 e 100 caratteri';
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Email non valida';
  }

  if (data.telefono && !isValidPhone(data.telefono)) {
    errors.telefono = 'Numero di telefono non valido';
  }

  if (data.codice_corsista && !isValidCodiceCorsista(data.codice_corsista)) {
    errors.codice_corsista = 'Formato codice corsista non valido (es: MARO_01)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: normalizeContatto(data)
  };
}

export function validateIscrizione(data) {
  const errors = {};

  if (!data.id_corsista || data.id_corsista.trim().length === 0) {
    errors.id_corsista = 'ID corsista è obbligatorio';
  }

  if (!data.nome_corso || data.nome_corso.trim().length === 0) {
    errors.nome_corso = 'Nome corso è obbligatorio';
  } else if (data.nome_corso.length > 150) {
    errors.nome_corso = 'Nome corso non può superare 150 caratteri';
  }

  if (!data.edizione_corso || data.edizione_corso.trim().length === 0) {
    errors.edizione_corso = 'Edizione corso è obbligatoria';
  } else if (data.edizione_corso.length > 50) {
    errors.edizione_corso = 'Edizione corso non può superare 50 caratteri';
  }

  if (!data.importo_da_versare && data.importo_da_versare !== 0) {
    errors.importo_da_versare = 'Importo da versare è obbligatorio';
  } else if (typeof data.importo_da_versare !== 'number' || data.importo_da_versare < 0) {
    errors.importo_da_versare = 'Importo da versare deve essere un numero positivo';
  }

  if (data.data_iscrizione && !isValidDate(data.data_iscrizione)) {
    errors.data_iscrizione = 'Data iscrizione non valida';
  }

  if (data.frequenza && !['SI', 'NO', ''].includes(data.frequenza)) {
    errors.frequenza = 'Frequenza deve essere SI, NO o vuoto';
  }

  if (data.note_iscrizione && data.note_iscrizione.length > 500) {
    errors.note_iscrizione = 'Note iscrizione non possono superare 500 caratteri';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: normalizeIscrizione(data)
  };
}

export function validatePagamento(data) {
  const errors = {};

  if (!data.data_pagamento || !isValidDate(data.data_pagamento)) {
    errors.data_pagamento = 'Data pagamento è obbligatoria e deve essere valida';
  }

  if (!data.importo && data.importo !== 0) {
    errors.importo = 'Importo è obbligatorio';
  } else if (typeof data.importo !== 'number' || data.importo <= 0) {
    errors.importo = 'Importo deve essere un numero positivo';
  }

  const metodiValidi = ['Bonifico', 'Contanti', 'PayPal', 'Assegno', 'Carta', 'Altro'];
  if (data.metodo_pagamento && !metodiValidi.includes(data.metodo_pagamento)) {
    errors.metodo_pagamento = `Metodo pagamento non valido. Validi: ${metodiValidi.join(', ')}`;
  }

  if (data.note && data.note.length > 500) {
    errors.note = 'Note non possono superare 500 caratteri';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: normalizePagamento(data)
  };
}

function normalizeContatto(data) {
  return {
    nome: data.nome?.trim() || '',
    cognome: data.cognome?.trim() || '',
    email: data.email?.trim().toLowerCase() || null,
    telefono: data.telefono?.trim() || null,
    note: data.note?.trim() || null,
    codice_corsista: data.codice_corsista?.toUpperCase().trim() || null,
    data_iscrizione: data.data_iscrizione || new Date().toISOString().split('T')[0],
    attivo: data.attivo !== undefined ? Boolean(data.attivo) : true
  };
}

function normalizeIscrizione(data) {
  return {
    id_corsista: data.id_corsista?.trim() || '',
    nome_corso: data.nome_corso?.trim() || '',
    edizione_corso: data.edizione_corso?.trim() || '',
    importo_da_versare: parseFloat(data.importo_da_versare) || 0,
    data_iscrizione: data.data_iscrizione || new Date().toISOString().split('T')[0],
    frequenza: (data.frequenza || '').toUpperCase(),
    note_iscrizione: data.note_iscrizione?.trim() || null
  };
}

function normalizePagamento(data) {
  return {
    data_pagamento: data.data_pagamento,
    importo: parseFloat(data.importo) || 0,
    metodo_pagamento: data.metodo_pagamento?.trim() || 'Bonifico',
    note: data.note?.trim() || null
  };
}

export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isValidPhone(phone) {
  const regex = /^[\d\s+\-()]+$/;
  return regex.test(phone) && phone.replace(/\D/g, '').length >= 9;
}

export function isValidCodiceCorsista(codice) {
  const regex = /^[A-Z]{3}_\d{2}$/;
  return regex.test(codice);
}

export function isValidDate(date) {
  if (!date) return false;

  if (typeof date === 'string') {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;

    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  if (date instanceof Date) {
    return !isNaN(date);
  }

  return false;
}

export function isValidUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 1000);
}

export function isValidImporto(importo) {
  if (typeof importo !== 'number' || importo < 0) return false;
  return Number.isFinite(importo) && (importo * 100) % 1 === 0;
}

export default {
  validateContatto,
  validateIscrizione,
  validatePagamento,
  isValidEmail,
  isValidPhone,
  isValidCodiceCorsista,
  isValidDate,
  isValidUUID,
  sanitizeString,
  isValidImporto
};