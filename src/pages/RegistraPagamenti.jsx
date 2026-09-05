import { useEffect, useMemo, useState } from 'react';
import { Plus, TrendingDown, Clock, Percent, Wallet, Trash2, Edit2 } from 'lucide-react';
import { getIscrizioniAttive, getPagamenti, createPagamento, updatePagamento, deletePagamento } from '../services/api';
import { PageHeader, Button, Table, StatCard, Select, Input, Modal, EmptyState } from '../components/ui';
import { formatEuro, formatDate } from '../utils/format';

const METODI = ['Bonifico', 'Contanti', 'Assegno', 'Carta di Credito'];

export default function RegistraPagamenti() {
  const [iscrizioni, setIscrizioni] = useState([]);
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [formData, setFormData] = useState({ id_iscrizione: '', importo: '', data_pagamento: new Date().toISOString().split('T')[0], metodo_pagamento: 'Bonifico' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const iscData = await getIscrizioniAttive();
      setIscrizioni(iscData.data || []);
    } catch (error) {
      console.error('Errore iscrizioni:', error);
    }
    try {
      const pagData = await getPagamenti();
      setPagamenti(pagData.data || []);
      setEndpointMissing(false);
    } catch (error) {
      setEndpointMissing(true);
    } finally {
      setLoading(false);
    }
  };

  const totali = useMemo(() => {
    const incassato = iscrizioni.reduce((s, i) => s + (i.importo_pagato_calcolato || 0), 0);
    const daIncassare = iscrizioni.reduce((s, i) => s + (i.importo_residuo || 0), 0);
    const tasso = incassato + daIncassare > 0 ? Math.round((incassato / (incassato + daIncassare)) * 100) : 0;
    return { incassato, daIncassare, tasso };
  }, [iscrizioni]);

  const selectedIscrizione = iscrizioni.find((i) => i.id_iscrizione === formData.id_iscrizione);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIscrizione && !editingId) return;
    setSaving(true);
    try {
      if (editingId) {
        // UPDATE
        await updatePagamento(editingId, {
          data_pagamento: formData.data_pagamento,
          importo: formData.importo,
          metodo_pagamento: formData.metodo_pagamento,
        });
      } else {
        // CREATE
        await createPagamento({
          id_corsista: selectedIscrizione.id_corsista,
          nome_corso: selectedIscrizione.nome_corso,
          edizione_corso: selectedIscrizione.edizione_corso,
          importo: formData.importo,
          data_pagamento: formData.data_pagamento,
          metodo_pagamento: formData.metodo_pagamento,
        });
      }
      setFormData({ id_iscrizione: '', importo: '', data_pagamento: new Date().toISOString().split('T')[0], metodo_pagamento: 'Bonifico' });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert('Errore: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pagamento) => {
    setEditingId(pagamento.id_pagamento);
    setFormData({
      id_iscrizione: '', // non usato in edit
      importo: pagamento.importo,
      data_pagamento: pagamento.data_pagamento,
      metodo_pagamento: pagamento.metodo_pagamento,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Confermi eliminazione del pagamento?')) return;
    try {
      await deletePagamento(id);
      fetchData();
    } catch (error) {
      alert('Errore: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <PageHeader
        title="Pagamenti Ricevuti"
        subtitle="Registro incassi per corso ed edizione"
        action={
          <Button onClick={() => {
            setEditingId(null);
            setFormData({ id_iscrizione: '', importo: '', data_pagamento: new Date().toISOString().split('T')[0], metodo_pagamento: 'Bonifico' });
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4" /> Registra Pagamento
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Wallet} iconBg="#dcfce7" iconColor="#16a34a" label="TOTALE INCASSATO" value={formatEuro(totali.incassato)} hint={`${pagamenti.length || ''} transazioni`.trim()} />
        <StatCard icon={Clock} iconBg="#fffbeb" iconColor="#d97706" label="DA INCASSARE" value={formatEuro(totali.daIncassare)} hint="su iscrizioni attive" />
        <StatCard icon={Percent} iconBg="#ede9fe" iconColor="#7c3aed" label="TASSO INCASSO" value={`${totali.tasso}%`} hint="del totale da versare" />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Caricamento...</div>
      ) : endpointMissing ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={TrendingDown}
            title="Registro pagamenti non ancora collegato"
            subtitle="Aggiungi l'endpoint backend /api/pagamenti-ricevuti fornito a parte per vedere qui lo storico delle transazioni."
          />
        </div>
      ) : pagamenti.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={Wallet} title="Nessun pagamento registrato" subtitle="I pagamenti registrati appariranno qui." />
        </div>
      ) : (
        <>
          <Table
            columns={[
              { label: 'NR.' },
              { label: 'ID CORSISTA' },
              { label: 'CORSO' },
              { label: 'EDIZIONE' },
              { label: 'DATA PAGAMENTO' },
              { label: 'IMPORTO VERSATO', align: 'right' },
              { label: 'METODO' },
              { label: '' },
            ]}
          >
            {pagamenti.map((p, idx) => (
              <tr key={p.id_pagamento} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5 text-gray-400">{idx + 1}</td>
                <td className="px-5 py-3.5 font-bold text-violet-600 whitespace-nowrap">{p.codice_corsista}</td>
                <td className="px-5 py-3.5 text-gray-700">{p.nome_corso}</td>
                <td className="px-5 py-3.5 text-gray-500">{p.edizione_corso}</td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(p.data_pagamento)}</td>
                <td className="px-5 py-3.5 text-right text-green-600 font-semibold">{formatEuro(p.importo)}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-block bg-gray-100 text-gray-600 text-[12px] font-medium px-2.5 py-1 rounded-full">{p.metodo_pagamento}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      title="Modifica pagamento"
                      className="text-gray-300 hover:text-violet-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id_pagamento)}
                      title="Elimina pagamento"
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <div className="flex justify-end mt-3 pr-2 text-[14px]">
            <span className="text-gray-500 mr-2">TOTALE INCASSATO</span>
            <span className="font-bold text-green-600">{formatEuro(pagamenti.reduce((s, p) => s + (p.importo || 0), 0))}</span>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ id_iscrizione: '', importo: '', data_pagamento: new Date().toISOString().split('T')[0], metodo_pagamento: 'Bonifico' });
      }} title={editingId ? 'Modifica Pagamento' : 'Registra Pagamento'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingId && (
            <div>
              <label className="text-[13px] font-medium text-gray-600 mb-1 block">Iscrizione *</label>
              <Select required value={formData.id_iscrizione} onChange={(e) => setFormData({ ...formData, id_iscrizione: e.target.value })}>
                <option value="">Seleziona iscrizione</option>
                {iscrizioni.map((i) => (
                  <option key={i.id_iscrizione} value={i.id_iscrizione}>
                    {i.nome} {i.cognome} — {i.nome_corso} ({i.edizione_corso})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {selectedIscrizione && !editingId && (
            <div className="bg-violet-50/60 border border-violet-100 rounded-xl p-3.5 text-[13px] space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Importo dovuto</span><span className="font-medium">{formatEuro(selectedIscrizione.importo_da_versare)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Già pagato</span><span className="font-medium">{formatEuro(selectedIscrizione.importo_pagato_calcolato)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Residuo</span><span className="font-bold text-red-500">{formatEuro(selectedIscrizione.importo_residuo)}</span></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-gray-600 mb-1 block">Importo (€) *</label>
              <Input required type="number" step="0.01" value={formData.importo} onChange={(e) => setFormData({ ...formData, importo: e.target.value })} />
            </div>
            <div>
              <label className="text-[13px] font-medium text-gray-600 mb-1 block">Data Pagamento *</label>
              <Input required type="date" value={formData.data_pagamento} onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-medium text-gray-600 mb-1 block">Metodo Pagamento</label>
            <Select value={formData.metodo_pagamento} onChange={(e) => setFormData({ ...formData, metodo_pagamento: e.target.value })}>
              {METODI.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData({ id_iscrizione: '', importo: '', data_pagamento: new Date().toISOString().split('T')[0], metodo_pagamento: 'Bonifico' });
            }}>Annulla</Button>
            <Button type="submit" disabled={saving || (!selectedIscrizione && !editingId)}>{saving ? (editingId ? 'Aggiornamento...' : 'Registrazione...') : (editingId ? 'Aggiorna Pagamento' : 'Registra Pagamento')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}