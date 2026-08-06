import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEdit, faTrash, faUsers, faTimes, faCheckCircle } from '../utils/icons';
import { Client } from '../types';
import { deleteClient, getClients, saveClient } from '../services/database';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClientsList = async () => {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientsList();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingClient({
      nif: '',
      name: '',
      address: '',
      email: '',
      default_retention_irpf: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient({ ...client });
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.nif || !editingClient.name) return;

    try {
      await saveClient({
        id: editingClient.id,
        nif: editingClient.nif,
        name: editingClient.name,
        address: editingClient.address || '',
        email: editingClient.email || '',
        default_retention_irpf: Boolean(editingClient.default_retention_irpf),
      });
      setIsModalOpen(false);
      setEditingClient(null);
      await loadClientsList();
    } catch (err) {
      console.error('Error guardando cliente:', err);
      alert('Error guardando los datos del cliente');
    }
  };

  const handleDeleteClient = async (id: number, name: string) => {
    if (id === 1) {
      alert('El cliente por defecto del sistema no se puede eliminar.');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar al cliente "${name}"?`)) {
      try {
        const res = await deleteClient(id);
        if (!res.success) {
          alert(res.message);
        } else {
          await loadClientsList();
        }
      } catch (err) {
        console.error('Error eliminando cliente:', err);
        alert('No se pudo eliminar el cliente.');
      }
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nif.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
          <input
            type="text"
            placeholder="Buscar por Nombre o NIF/CIF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 text-sm"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Añadir Cliente</span>
        </button>
      </div>

      {/* Clients Table Card */}
      <div className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Directorio de Clientes</h2>
            <p className="text-xs text-slate-400">
              Total de clientes registrados: {filteredClients.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-purple-400 font-medium">Cargando clientes...</div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No se encontraron clientes. Haz clic en "Añadir Cliente" para registrar el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-purple-900/30">
                <tr>
                  <th className="py-3.5 px-4">NIF / CIF</th>
                  <th className="py-3.5 px-4">Nombre / Razón Social</th>
                  <th className="py-3.5 px-4">Dirección Fiscal</th>
                  <th className="py-3.5 px-4">Correo Electrónico</th>
                  <th className="py-3.5 px-4 text-center">Retención IRPF</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/20">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-purple-300 font-semibold">
                      {client.nif}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{client.name}</span>
                        {client.id === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
                            Por defecto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 truncate max-w-xs">
                      {client.address || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{client.email || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      {client.default_retention_irpf ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" /> Sí (15%)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-colors"
                        title="Editar cliente"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      {client.id === 1 ? (
                        <button
                          disabled
                          className="p-2 rounded-lg bg-slate-800 text-slate-600 cursor-not-allowed"
                          title="El cliente por defecto no se puede eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Eliminar cliente"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form: Crear / Editar Cliente */}
      {isModalOpen && editingClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-950/90">
            <div className="p-6 bg-gradient-to-r from-purple-950/50 to-pink-950/30 border-b border-purple-500/20 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingClient.id ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                  NIF / CIF *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. B35999888"
                  value={editingClient.nif || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, nif: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Comercio Insular Canarias S.L."
                  value={editingClient.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  placeholder="ej. Av. Marítima 12, Las Palmas de Gran Canaria"
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-300 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ej. facturacion@cliente.es"
                  value={editingClient.email || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="default_retention_irpf"
                  checked={editingClient.default_retention_irpf || false}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      default_retention_irpf: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-950"
                />
                <label htmlFor="default_retention_irpf" className="text-xs text-slate-300">
                  Aplicar retención IRPF por defecto (15%) en facturas
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-purple-900/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-sm font-semibold shadow-lg shadow-purple-950/50"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
