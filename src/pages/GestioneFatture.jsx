import { useEffect, useState } from 'react';
import { getFatture, createFattura, registraPagamentoFornitore } from '../services/api';

export default function GestioneFatture() {
  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormFattura, setShowFormFattura] = useState(false);
  const [showFormPagamento, setShowFormPagamento] = useState(false);
  const [selectedFattura, setSelectedFattura] = useState(null);
  
  const [formFattura, setFormFattura] = useState({
    numero_fattura: '',
    data_fattura: new Date().toISOString().split('T')[0],
    fornitore: '',
    importo_lordo: '',
    referente: ''
  });

  const [formPagamento, setFormPagamento] = useState({
    numero_fattura: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    importo: '',
    metodo_pagamento: 'Bonifico'
  });

  useEffect(() => {
    fetchFatture();
  }, []);

  const fetchFatture = async () => {
    try {
      const data = await getFatture();
      setFatture(data.data);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFattura = async (e) => {
    e.preventDefault();
    try {
      await createFattura(formFattura);
      setFormFattura({
        numero_fattura: '',
        data_fattura: new Date().toISOString().split('T')[0],
        fornitore: '',
        importo_lordo: '',
        referente: ''
      });
      setShowFormFattura(false);
      fetchFatture();
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  };

  const handleCreatePagamento = async (e) => {
    e.preventDefault();
    try {
      await registraPagamentoFornitore(formPagamento);
      setFormPagamento({
        numero_fattura: '',
        data_pagamento: new Date().toISOString().split('T')[0],
        importo: '',
        metodo_pagamento: 'Bonifico'
      });
      setShowFormPagamento(false);
      setSelectedFattura(null);
      fetchFatture();
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  };

  if (loading) return <div className="text-center">Caricamento...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📄 Gestione Fatture Fornitori</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowFormFattura(!showFormFattura)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showFormFattura ? 'Annulla' : '+ Nuova Fattura'}
        </button>
      </div>

      {/* Form Fattura */}
      {showFormFattura && (
        <form onSubmit={handleCreateFattura} className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Crea Nuova Fattura</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Numero Fattura"
              value={formFattura.numero_fattura}
              onChange={(e) => setFormFattura({ ...formFattura, numero_fattura: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={formFattura.data_fattura}
              onChange={(e) => setFormFattura({ ...formFattura, data_fattura: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Fornitore"
              value={formFattura.fornitore}
              onChange={(e) => setFormFattura({ ...formFattura, fornitore: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Importo Lordo"
              value={formFattura.importo_lordo}
              onChange={(e) => setFormFattura({ ...formFattura, importo_lordo: e.target.value })}
              required
              className="border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Referente"
              value={formFattura.referente}
              onChange={(e) => setFormFattura({ ...formFattura, referente: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Crea Fattura
          </button>
        </form>
      )}

      {/* Tabella Fatture */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Numero</th>
              <th className="px-4 py-2 text-left">Fornitore</th>
              <th className="px-4 py-2 text-right">Importo</th>
              <th className="px-4 py-2 text-right">Pagato</th>
              <th className="px-4 py-2 text-right">Residuo</th>
              <th className="px-4 py-2 text-center">Stato</th>
              <th className="px-4 py-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {fatture.map((fat) => (
              <tr key={fat.id_fattura} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{fat.numero_fattura}</td>
                <td className="px-4 py-2">{fat.fornitore}</td>
                <td className="px-4 py-2 text-right">€{fat.importo_totale.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">€{fat.importo_pagato_calcolato.toFixed(2)}</td>
                <td className="px-4 py-2 text-right text-red-600 font-bold">€{fat.importo_residuo.toFixed(2)}</td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded text-white text-xs font-bold ${
                    fat.stato_pagamento === 'Saldato' ? 'bg-green-500' :
                    fat.stato_pagamento === 'Saldante' ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}>
                    {fat.stato_pagamento}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => {
                      setSelectedFattura(fat);
                      setFormPagamento({ ...formPagamento, numero_fattura: fat.numero_fattura });
                      setShowFormPagamento(true);
                    }}
                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                  >
                    Registra Pagamento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Pagamento */}
      {showFormPagamento && selectedFattura && (
        <form onSubmit={handleCreatePagamento} className="bg-white rounded-lg shadow p-6 mt-6 max-w-xl">
          <h2 className="text-lg font-bold mb-4">Registra Pagamento - {selectedFattura.numero_fattura}</h2>
          <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
            <p><strong>Importo Totale:</strong> €{selectedFattura.importo_totale.toFixed(2)}</p>
            <p><strong>Già Pagato:</strong> €{selectedFattura.importo_pagato_calcolato.toFixed(2)}</p>
            <p className="font-bold text-red-600">Residuo: €{selectedFattura.importo_residuo.toFixed(2)}</p>
          </div>
          <div className="space-y-4">
            <input
              type="number"
              placeholder="Importo Pagamento"
              value={formPagamento.importo}
              onChange={(e) => setFormPagamento({ ...formPagamento, importo: e.target.value })}
              required
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="date"
              value={formPagamento.data_pagamento}
              onChange={(e) => setFormPagamento({ ...formPagamento, data_pagamento: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
            <select
              value={formPagamento.metodo_pagamento}
              onChange={(e) => setFormPagamento({ ...formPagamento, metodo_pagamento: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            >
              <option>Bonifico</option>
              <option>Contanti</option>
              <option>Assegno</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Registra
              </button>
              <button
                type="button"
                onClick={() => setShowFormPagamento(false)}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Annulla
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}