import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEdit, faTrash, faUsers, faTimes, faCheckCircle } from '../utils/icons';
import { Client } from '../types';
import { deleteClient, getClients, saveClient } from '../services/database';

interface ClientsPageProps {
  theme?: 'dark' | 'light';
}

export const ClientsPage: React.FC<ClientsPageProps> = ({ theme = 'dark' }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

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
      alert('Error al guardar el cliente.');
    }
  };

  const handleDeleteClient = async (id: number, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a "${name}"?`)) {
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

  const cardBgClass = isDark
    ? 'bg-black border-slate-800/80 shadow-xl text-white'
    : 'bg-white border-slate-200 shadow-md text-slate-900';

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
            className={`w-full pl-11 pr-4 py-2.5 rounded-2xl border text-sm focus:outline-none focus:border-blue-500 transition-colors ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 text-white placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 transition-transform hover:scale-105"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Añadir Cliente</span>
        </button>
      </div>

      {/* Clients Table Card */}
      <div className={`border rounded-3xl p-6 backdrop-blur-xl shadow-xl ${cardBgClass}`}>
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Directorio de Clientes
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total de clientes registrados: {filteredClients.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-blue-500 font-medium">Cargando clientes...</div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No se encontraron clientes. Haz clic en "Añadir Cliente" para registrar el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={`text-xs uppercase border-b ${
                  isDark
                    ? 'text-slate-400 bg-black/40 border-slate-800'
                    : 'text-slate-500 bg-slate-100 border-slate-200'
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">NIF / CIF</th>
                  <th className="py-3.5 px-4">Nombre / Razón Social</th>
                  <th className="py-3.5 px-4">Dirección Fiscal</th>
                  <th className="py-3.5 px-4">Correo Electrónico</th>
                  <th className="py-3.5 px-4 text-center">Retención IRPF</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                }`}
              >
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td
                      className={`py-3.5 px-4 font-mono font-semibold ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}
                    >
                      {client.nif}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-semibold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{client.name}</span>
                        {client.id === 1 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isDark
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            Por defecto
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-xs truncate max-w-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {client.address || '-'}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {client.email || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {client.default_retention_irpf ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${
                            isDark
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" /> Sí (15%)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                        }`}
                        title="Editar cliente"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      {client.id === 1 ? (
                        <button
                          disabled
                          className={`p-2 rounded-lg cursor-not-allowed ${
                            isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'
                          }`}
                          title="El cliente por defecto no se puede eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                          }`}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={`border rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark
                  ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 border-slate-800'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500'
              }`}
            >
              <h3 className="text-lg font-bold">
                {editingClient.id ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-blue-700/50 text-white hover:bg-blue-800'
                }`}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  NIF / CIF *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. B35999888"
                  value={editingClient.nif || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, nif: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Nombre / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Empresa Ejemplo S.L."
                  value={editingClient.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  placeholder="ej. Calle Gran Vía 12, Madrid"
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ej. facturacion@cliente.es"
                  value={editingClient.email || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
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
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700"
                />
                <label htmlFor="default_retention_irpf" className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Aplicar retención IRPF por defecto (15%) en facturas
                </label>
              </div>

              <div className={`pt-4 flex justify-end gap-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0055ff] to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-950/50"
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
