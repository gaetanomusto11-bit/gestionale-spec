import { useEffect, useState } from 'react';
import { getIscrizioniStoriche } from '../services/api';

export default function DashboardStorico() {
  const [iscrizioni, setIscrizioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCorso, setFilterCorso] = useState('');

  useEffect(() => {
    fetchIscrizioni();
  }, []);

  const fetchIscrizioni = async () => {
    try {
      const data = await getIscrizioniStoriche();
      setIscrizioni(data.data);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterCorso 
    ? iscrizioni.filter(i => i.nome_corso.toLowerCase().includes(filterCorso.toLowerCase()))
    : iscrizioni;

  if (loading) return <div className="text-center">Caricamento...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">📚 Dashboard Storico</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Filtra per corso..."
          value={filterCorso}
          onChange={(e) => setFilterCorso(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Corsista</th>
              <th className="px-4 py-2 text-left">Codice</th>
              <th className="px-4 py-2 text-left">Corso</th>
              <th className="px-4 py-2 text-left">Edizione</th>
              <th className="px-4 py-2 text-right">Importo</th>
              <th className="px-4 py-2 text-right">Pagato</th>
              <th className="px-4 py-2 text-center">Stato</th>
              <th className="px-4 py-2 text-left">Data Completamento</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((isc) => (
              <tr key={isc.id_iscrizione_storica} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-semibold">{isc.nome} {isc.cognome}</td>
                <td className="px-4 py-2 font-mono text-xs">{isc.codice_corsista}</td>
                <td className="px-4 py-2">{isc.nome_corso}</td>
                <td className="px-4 py-2">{isc.edizione_corso}</td>
                <td className="px-4 py-2 text-right">€{isc.importo_da_versare.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">€{isc.importo_pagato_totale.toFixed(2)}</td>
                <td className="px-4 py-2 text-center">
                  <span className="px-2 py-1 rounded text-white text-xs font-bold bg-green-500">
                    ✓ Completato
                  </span>
                </td>
                <td className="px-4 py-2">{isc.data_frequenza_confermata || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-6 text-gray-600">Nessun dato disponibile</div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <p className="text-sm"><strong>Totale Iscrizioni Storiche:</strong> {filtered.length}</p>
        <p className="text-sm"><strong>Importo Totale Pagato:</strong> €{filtered.reduce((sum, i) => sum + i.importo_pagato_totale, 0).toFixed(2)}</p>
      </div>
    </div>
  );
}