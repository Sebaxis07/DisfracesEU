import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { Cliente, Arriendo, Reserva, Disfraz } from '../types';
import { Users, UserPlus, Search, MapPin, MessageCircle, Edit, FileText, Clock, Star } from 'lucide-react';

interface ClientesModuleProps {
  onStateChanged?: () => void;
  onNavigateToNuevoArriendo?: (clienteId: string) => void;
}

export const ClientesModule: React.FC<ClientesModuleProps> = ({ onStateChanged, onNavigateToNuevoArriendo }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [arriendos, setArriendos] = useState<Arriendo[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [disfraces, setDisfraces] = useState<Disfraz[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Activos' | 'Frecuentes'>('Todos');

  // Modal Cliente 360
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null);

  // Modal Crear/Editar
  const [showModalForm, setShowModalForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Campos formulario
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  const loadData = () => {
    setClientes(StorageService.getClientes());
    setArriendos(StorageService.getArriendos());
    setReservas(StorageService.getReservas());
    setDisfraces(StorageService.getDisfraces());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openFormModal = (cli?: Cliente) => {
    if (cli) {
      setEditingCliente(cli);
      setNombre(cli.nombre);
      setTelefono(cli.telefono);
      setDireccion(cli.direccion || '');
      setNotas(cli.notas || '');
    } else {
      setEditingCliente(null);
      setNombre('');
      setTelefono('');
      setDireccion('');
      setNotas('');
    }
    setShowModalForm(true);
  };

  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      alert('Por favor ingresa al menos el Nombre y Teléfono del cliente.');
      return;
    }

    await StorageService.saveClienteAsync({
      id: editingCliente?.id,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      notas: notas.trim(),
    });

    setShowModalForm(false);
    loadData();
    if (onStateChanged) onStateChanged();
  };

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const getClienteStats = (cliId: string) => {
    const arrs = arriendos.filter(a => a.clienteId === cliId);
    const resv = reservas.filter(r => r.clienteId === cliId);
    const enCurso = arrs.filter(a => a.estado === 'Activo' || a.estado === 'Atrasado');
    const dañados = arrs.filter(a => a.estado === 'Dañado' || a.resolucionGarantia === 'Retenida_Total' || a.resolucionGarantia === 'Retenida_Parcial');
    const atrasados = arrs.filter(a => a.estado === 'Atrasado');

    let scoring: 'Puntual' | 'Atrasos' | 'Alertas' = 'Puntual';
    if (dañados.length > 0) scoring = 'Alertas';
    else if (atrasados.length > 0) scoring = 'Atrasos';

    return {
      totalArriendos: arrs.length,
      totalReservas: resv.length,
      arriendosEnCurso: enCurso.length,
      scoring,
      arrs,
      resv,
    };
  };

  const clientesFiltrados = clientes.filter(cli => {
    const matchesSearch =
      cli.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.telefono.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cli.direccion.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const stats = getClienteStats(cli.id);
    if (filterTipo === 'Activos') return stats.arriendosEnCurso > 0;
    if (filterTipo === 'Frecuentes') return stats.totalArriendos >= 2;
    return true;
  });

  return (
    <div>
      {/* CABECERA Y BOTÓN */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="module-title">Directorio de Clientes & CRM 360°</h1>
          <p className="module-desc">
            Expedientes de clientes, historial de arriendos, scoring de puntualidad y contacto directo por WhatsApp.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => openFormModal()}>
          <UserPlus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* TARJETAS DE KPIs */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clientes Registrados
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            {clientes.length} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>personas</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Base de datos unificada
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clientes con Arriendo Activo
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-arrendado-bg)', color: 'var(--status-arrendado)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-arrendado)' }}>
            {clientes.filter(c => getClienteStats(c.id).arriendosEnCurso > 0).length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Con disfraz actualmente en su poder
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clientes VIP / Frecuentes
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-disponible-bg)', color: 'var(--status-disponible)' }}>
              <Star size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-disponible)' }}>
            {clientes.filter(c => getClienteStats(c.id).totalArriendos >= 2).length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Con 2 o más arriendos realizados
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem' }}>
            <Search size={18} color="var(--color-text-muted)" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', padding: '0.2rem 0', minHeight: 'auto' }}
              placeholder="Buscar por nombre, teléfono o dirección..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${filterTipo === 'Todos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
              onClick={() => setFilterTipo('Todos')}
            >
              Todos ({clientes.length})
            </button>
            <button
              type="button"
              className={`btn ${filterTipo === 'Activos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
              onClick={() => setFilterTipo('Activos')}
            >
              Con Arriendo Activo ({clientes.filter(c => getClienteStats(c.id).arriendosEnCurso > 0).length})
            </button>
            <button
              type="button"
              className={`btn ${filterTipo === 'Frecuentes' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
              onClick={() => setFilterTipo('Frecuentes')}
            >
              VIP / Frecuentes ({clientes.filter(c => getClienteStats(c.id).totalArriendos >= 2).length})
            </button>
          </div>
        </div>
      </div>

      {/* LISTA DE CLIENTES */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {clientesFiltrados.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No se encontraron clientes registrados en este filtro.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Cliente</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Teléfono</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Dirección</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reputación</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Historial Arriendos</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map(cli => {
                  const stats = getClienteStats(cli.id);
                  let cleanPhone = cli.telefono.replace(/\D/g, '');
                  if (!cleanPhone.startsWith('56')) cleanPhone = '56' + cleanPhone;

                  return (
                    <tr key={cli.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {cli.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.95rem' }}>{cli.nombre}</strong>
                            {cli.notas && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                📝 {cli.notas}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#25d366', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <MessageCircle size={15} />
                          <span>{cli.telefono}</span>
                        </a>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {cli.direccion ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                            <MapPin size={14} color="var(--color-text-muted)" />
                            <span>{cli.direccion}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Sin dirección</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${
                            stats.scoring === 'Puntual'
                              ? 'badge-disponible'
                              : stats.scoring === 'Atrasos'
                              ? 'badge-arrendado'
                              : 'badge-atrasado'
                          }`}
                        >
                          {stats.scoring === 'Puntual' ? '🟢 Puntual' : stats.scoring === 'Atrasos' ? '🟡 Con Atrasos' : '🔴 Incidente'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>
                          <strong>{stats.totalArriendos} arriendos</strong>
                          {stats.arriendosEnCurso > 0 && (
                            <span style={{ marginLeft: '0.4rem', color: 'var(--status-arrendado)', fontWeight: 700, fontSize: '0.78rem' }}>
                              ({stats.arriendosEnCurso} en curso)
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem', minHeight: '34px' }}
                            onClick={() => setClienteDetalle(cli)}
                          >
                            <FileText size={14} />
                            <span>Expediente 360°</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.775rem', minHeight: '34px' }}
                            title="Editar datos de cliente"
                            onClick={() => openFormModal(cli)}
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL EXPEDIENTE 360° DEL CLIENTE */}
      {clienteDetalle && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                  {clienteDetalle.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>{clienteDetalle.nombre}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Registrado desde: {clienteDetalle.fechaRegistro ? clienteDetalle.fechaRegistro.split('T')[0] : 'N/A'}
                  </p>
                </div>
              </div>

              <button className="modal-close" onClick={() => setClienteDetalle(null)}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: '1rem' }}>
              {/* FICHA INFORMACIÓN */}
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Contacto</div>
                  <div style={{ marginTop: '0.3rem', fontWeight: 700 }}>📞 Teléfono: {clienteDetalle.telefono}</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>📍 Dirección: {clienteDetalle.direccion || 'Sin dirección registrada'}</div>
                </div>

                <div className="card" style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Notas Internas</div>
                  <div style={{ marginTop: '0.3rem', fontSize: '0.85rem', fontStyle: clienteDetalle.notas ? 'normal' : 'italic' }}>
                    {clienteDetalle.notas || 'Sin observaciones guardadas.'}
                  </div>
                </div>
              </div>

              {/* HISTORIAL DE ARRIENDOS */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="var(--color-primary)" /> Historial de Arriendos ({getClienteStats(clienteDetalle.id).arrs.length})
              </h4>

              {getClienteStats(clienteDetalle.id).arrs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Este cliente aún no registra arriendos finalizados o activos.
                </div>
              ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Disfraz</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Retiro / Pactada</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Monto</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getClienteStats(clienteDetalle.id).arrs.map(a => {
                          const disfraz = disfraces.find(d => d.id === a.disfrazId);
                          return (
                            <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.6rem 0.75rem' }}>
                                <strong>{disfraz ? disfraz.nombre : 'Disfraz'}</strong>
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem' }}>
                                {a.fechaRetiro} ➔ {a.fechaPactada}
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem' }}>{formatCLP(a.montoArriendo)}</td>
                              <td style={{ padding: '0.6rem 0.75rem' }}>
                                <span className={`badge ${a.estado === 'Devuelto' ? 'badge-disponible' : a.estado === 'Activo' ? 'badge-arrendado' : 'badge-atrasado'}`}>
                                  {a.estado}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ACCIONES DEL EXPEDIENTE */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <a
                  href={`https://wa.me/${clienteDetalle.telefono.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#25d366' }}
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </a>

                {onNavigateToNuevoArriendo && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const id = clienteDetalle.id;
                      setClienteDetalle(null);
                      onNavigateToNuevoArriendo(id);
                    }}
                  >
                    <span>Iniciar Arriendo</span>
                  </button>
                )}

                <button className="btn btn-secondary" onClick={() => setClienteDetalle(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {showModalForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button className="modal-close" onClick={() => setShowModalForm(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCliente} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Juan Pérez"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono de Contacto (WhatsApp) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+56 9 1234 5678"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección / Comuna</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Av. Providencia 1234, Santiago"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas u Observaciones Internas</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Preferencias de disfraz, tallas, hábitos de devolución..."
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModalForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCliente ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
