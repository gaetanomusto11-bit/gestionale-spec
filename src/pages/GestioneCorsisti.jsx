import { useEffect, useState } from 'react';
import { getContatti, createContatto, updateContatto, deleteContatto } from '../services/api';

export default function GestioneCorsisti() {
  const [corsisti, setCorsisti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', cognome: '', email: '', telefono: '', note: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCorsisti();
  }, []);

  const fetchCorsisti = async () => {
    try {
      const data = await getContatti();
      setCorsisti(data.data);
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
        await updateContatto(editingId, formData);
      } else {
        await createContatto(formData);
      }
      setFormData({ nome: '', cognome: '', email: '', telefono: '', note: '' });
      setShowForm(false);
      setEditingId(null);
      fetchCorsisti();
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  };

  const handleEdit = (corsista) => {
    setFormData({
      nome: corsista.nome,
      cognome: corsista.cognome,
      email: corsista.email || '',
      telefono: corsista.telefono || '',
      note: corsista.note || ''
    });
    setEditingId(corsista.id_corsista);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Confermi eliminazione?')) {
      try {
        await deleteContatto(id);
        fetchCorsisti();
      } catch (error) {
        alert('Errore: ' + error.message);
      }
    }
  };

  if (loading) return <div className="text-center">Caricamento...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">👥 Gestione Corsisti</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ nome: '', cognome: '', email: '', telefono: '', note: '' });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Annulla' : '+ Nuovo Corsista'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Cognome"
              value={formData.cognome}
              onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="tel"
              placeholder="Telefono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="border rounded px-3 py-2 w-full mt-4"
            rows="3"
          />
          <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            {editingId ? 'Aggiorna' : 'Crea'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Codice</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Cognome</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {corsisti.map((corsista) => (
              <tr key={corsista.id_corsista} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-sm">{corsista.codice_corsista}</td>
                <td className="px-4 py-2">{corsista.nome}</td>
                <td className="px-4 py-2">{corsista.cognome}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{corsista.email || '-'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(corsista)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(corsista.id_corsista)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
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