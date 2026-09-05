import { useEffect, useState } from 'react';
import { getIscrizioniAttive, getContatti, createIscrizione, updateIscrizione, deleteIscrizione } from '../services/api';

export default function GestioneIscrizioni() {
  const [iscrizioni, setIscrizioni] = useState([]);
  const [corsisti, setCorsisti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id_corsista: '',
    nome_corso: '',
    edizione_corso: '',
    importo_da_versare: '',
    data_iscrizione: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [iscData, corsData] = await Promise.all([
        getIscrizioniAttive(),
        getContatti()
      ]);
      setIscrizioni(iscData.data);
      setCorsisti(corsData.data);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateIscrizione(editingId, formData);
      } else {
        await createIscrizione(formData);
      }
      setFormData({
        id_corsista: '',
        nome_corso: '',
        edizione_corso: '',
        importo_da_versare: '',
        data_iscrizione: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  };

  const handleEdit = (iscrizione) => {
    setFormData({
      id_corsista: iscrizione.id_corsista,
      nome_corso: iscrizione.nome_corso,
      edizione_corso: iscrizione.edizione_corso,
      importo_da_versare: iscrizione.importo_da_versare,
      data_iscrizione: iscrizione.data_iscrizione
    });
    setEditingId(iscrizione.id_iscrizione);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Confermi eliminazione?')) {
      try {
        await deleteIscrizione(id);
        fetchData();
      } catch (error) {
        alert('Errore: ' + error.message);
      }
    }
  };

  if (loading) return <div className="text-center">Caricamento...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📝 Iscrizioni Attive</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              id_corsista: '',
              nome_corso: '',
              edizione_corso: '',
              importo_da_versare: '',
              data_iscrizione: new Date().toISOString().split('T')[0]
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Annulla' : '+ Nuova Iscrizione'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.id_corsista}
              onChange={(e) => setFormData({ ...formData, id_corsista: e.target.value })}
              required
              className="border rounded px-3 py-2"
            >
              <option value="">Seleziona Corsista</option>
              {corsisti.map((c) => (
                <option key={c.id_corsista} value={c.id_corsista}>
                  {c.nome} {c.cognome}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nome Corso"
              value={formData.nome_corso}
              onChange={(e) => setFormData({ ...formData, nome_corso: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Edizione (es: 2024-01)"
              value={formData.edizione_corso}
              onChange={(e) => setFormData({ ...formData, edizione_corso: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Importo da Versare"
              value={formData.importo_da_versare}
              onChange={(e) => setFormData({ ...formData, importo_da_versare: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={formData.data_iscrizione}
              onChange={(e) => setFormData({ ...formData, data_iscrizione: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            {editingId ? 'Aggiorna' : 'Crea'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Corsista</th>
              <th className="px-4 py-2 text-left">Corso</th>
              <th className="px-4 py-2 text-right">Importo</th>
              <th className="px-4 py-2 text-right">Pagato</th>
              <th className="px-4 py-2 text-center">Stato</th>
              <th className="px-4 py-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {iscrizioni.map((isc) => (
              <tr key={isc.id_iscrizione} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{isc.nome} {isc.cognome}</td>
                <td className="px-4 py-2">{isc.nome_corso}</td>
                <td className="px-4 py-2 text-right">€{isc.importo_da_versare.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">€{isc.importo_pagato_calcolato.toFixed(2)}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-white text-xs font-bold ${
                    isc.stato_pagamento === 'Saldato' ? 'bg-green-500' :
                    isc.stato_pagamento === 'Saldante' ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}>
                    {isc.stato_pagamento}
                  </span>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(isc)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(isc.id_iscrizione)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}