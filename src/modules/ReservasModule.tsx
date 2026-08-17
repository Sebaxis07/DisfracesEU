import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import type { Reserva, Cliente, Disfraz, Arriendo, ComprobanteData } from '../types';
import { ComprobanteModal } from '../components/ComprobanteModal';
import { Calendar, Plus, CheckCircle, AlertTriangle, XCircle, Search, Printer, CalendarCheck, DollarSign, Clock } from 'lucide-react';

interface ReservasModuleProps {
  onStateChanged?: () => void;
}

export const ReservasModule: React.FC<ReservasModuleProps> = ({ onStateChanged }) => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [disfraces, setDisfraces] = useState<Disfraz[]>([]);
  const [arriendos, setArriendos] = useState<Arriendo[]>([]);

  // Estados Formulario
  const [showModalNueva, setShowModalNueva] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [disfrazId, setDisfrazId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [montoArriendo, setMontoArriendo] = useState(10000);
  const [montoAbono, setMontoAbono] = useState(5000);
  const [observaciones, setObservaciones] = useState('');

  const [solapamientoError, setSolapamientoError] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<'Todas' | 'Confirmada' | 'Convertida' | 'Cancelada'>('Confirmada');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Comprobante
  const [comprobanteVer, setComprobanteVer] = useState<ComprobanteData | null>(null);

  const loadData = () => {
    setReservas(StorageService.getReservas());
    setClientes(StorageService.getClientes());
    setDisfraces(StorageService.getDisfraces());
    setArriendos(StorageService.getArriendos());
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const handleDisfrazChange = (id: string) => {
    setDisfrazId(id);
    const d = disfraces.find(item => item.id === id);
    if (d) {
      setMontoArriendo(d.precioSugerido);
      setMontoAbono(Math.round(d.precioSugerido / 2));
    }
  };

  const checkConflictos = (targetDisfrazId: string, inicio: string, fin: string, excludeReservaId?: string) => {
    if (!targetDisfrazId || !inicio || !fin) return null;

    const start = new Date(inicio).getTime();
    const end = new Date(fin).getTime();

    if (end < start) {
      return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
    }

    const arriendoConflicto = arriendos.find(a => {
      if (a.disfrazId !== targetDisfrazId || a.estado === 'Devuelto') return false;
      const aStart = new Date(a.fechaRetiro).getTime();
      const aEnd = new Date(a.fechaPactada).getTime();
      return start <= aEnd && end >= aStart;
    });

    if (arriendoConflicto) {
      return `⚠️ Conflicto: La prenda ya está en arriendo activo desde ${arriendoConflicto.fechaRetiro} hasta ${arriendoConflicto.fechaPactada}.`;
    }

    const reservaConflicto = reservas.find(r => {
      if (r.disfrazId !== targetDisfrazId || r.estado !== 'Confirmada') return false;
      if (excludeReservaId && r.id === excludeReservaId) return false;
      const rStart = new Date(r.fechaInicio).getTime();
      const rEnd = new Date(r.fechaFin).getTime();
      return start <= rEnd && end >= rStart;
    });

    if (reservaConflicto) {
      return `⚠️ Conflicto: Esta prenda ya tiene otra reserva activa del ${reservaConflicto.fechaInicio} al ${reservaConflicto.fechaFin}.`;
    }

    return null;
  };

  const handleGuardarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !disfrazId || !fechaInicio || !fechaFin) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const conflicto = checkConflictos(disfrazId, fechaInicio, fechaFin);
    if (conflicto) {
      setSolapamientoError(conflicto);
      return;
    }

    const saldo = Math.max(0, montoArriendo - montoAbono);

    const nuevaReserva = await StorageService.saveReservaAsync({
      clienteId,
      disfrazId,
      fechaInicio,
      fechaFin,
      montoArriendo,
      montoAbono,
      saldoPendiente: saldo,
      observaciones,
    });

    StorageService.addNotificacion({
      titulo: 'Nueva Reserva Registrada',
      mensaje: `Reserva del ${fechaInicio} al ${fechaFin} confirmada con abono de ${formatCLP(montoAbono)}.`,
      tipo: 'alerta',
    });

    setShowModalNueva(false);
    loadData();
    if (onStateChanged) onStateChanged();

    const cliente = clientes.find(c => c.id === clienteId);
    const disfraz = disfraces.find(d => d.id === disfrazId);

    setComprobanteVer({
      tipo: 'Reserva',
      folio: nuevaReserva.id.toUpperCase().slice(-8),
      fechaEmision: new Date().toISOString().split('T')[0],
      clienteNombre: cliente ? cliente.nombre : 'Cliente General',
      clienteTelefono: cliente ? cliente.telefono : '',
      clienteDireccion: cliente ? cliente.direccion : '',
      disfrazNombre: disfraz ? disfraz.nombre : 'Disfraz General',
      disfrazTalla: disfraz ? disfraz.talla : 'S/I',
      disfrazCategoria: disfraz ? disfraz.categoria : 'General',
      fechaInicio,
      fechaFin,
      montoArriendo,
      montoAbono,
      montoGarantia: disfraz ? disfraz.garantiaSugerida : 10000,
      saldoPendiente: saldo,
      observaciones,
    });
  };

  const handleConvertirEnArriendo = async (res: Reserva) => {
    const disfraz = disfraces.find(d => d.id === res.disfrazId);

    if (window.confirm(`¿Confirmas la entrega del disfraz "${disfraz?.nombre}" al cliente y conversión a Arriendo Activo?`)) {
      const nuevoArriendo = await StorageService.saveArriendoAsync({
        clienteId: res.clienteId,
        disfrazId: res.disfrazId,
        fechaRetiro: res.fechaInicio,
        fechaPactada: res.fechaFin,
        montoArriendo: res.montoArriendo,
        aplicaGarantia: true,
        montoGarantia: disfraz ? disfraz.garantiaSugerida : 10000,
        estado: 'Activo',
        observaciones: `Convertido de Reserva #${res.id.slice(-6)}. Saldo Cobrado: ${formatCLP(res.saldoPendiente)}.`,
      });

      await StorageService.updateEstadoReservaAsync(res.id, 'Convertida');

      StorageService.addNotificacion({
        titulo: 'Reserva Convertida en Arriendo',
        mensaje: `La reserva #${res.id.slice(-6)} pasó a Arriendo Activo exitosamente.`,
        tipo: 'alerta',
      });

      loadData();
      if (onStateChanged) onStateChanged();

      const cliente = clientes.find(c => c.id === res.clienteId);

      setComprobanteVer({
        tipo: 'Arriendo',
        folio: nuevoArriendo.id.toUpperCase().slice(-8),
        fechaEmision: new Date().toISOString().split('T')[0],
        clienteNombre: cliente ? cliente.nombre : 'Cliente General',
        clienteTelefono: cliente ? cliente.telefono : '',
        clienteDireccion: cliente ? cliente.direccion : '',
        disfrazNombre: disfraz ? disfraz.nombre : 'Disfraz General',
        disfrazTalla: disfraz ? disfraz.talla : 'S/I',
        disfrazCategoria: disfraz ? disfraz.categoria : 'General',
        fechaInicio: res.fechaInicio,
        fechaFin: res.fechaFin,
        montoArriendo: res.montoArriendo,
        montoGarantia: disfraz ? disfraz.garantiaSugerida : 10000,
        saldoPendiente: 0,
        observaciones: `Entregado desde reserva anticipada. Abono de ${formatCLP(res.montoAbono)} descontado.`,
      });
    }
  };

  const handleCancelarReserva = async (id: string) => {
    if (window.confirm('¿Deseas cancelar esta reserva? La prenda quedará disponible para otras fechas.')) {
      await StorageService.updateEstadoReservaAsync(id, 'Cancelada');
      loadData();
      if (onStateChanged) onStateChanged();
    }
  };

  const reservasFiltradas = reservas.filter(r => {
    const cliente = clientes.find(c => c.id === r.clienteId);
    const disfraz = disfraces.find(d => d.id === r.disfrazId);

    const matchesSearch =
      (cliente?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (disfraz?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterEstado === 'Todas') return matchesSearch;
    return matchesSearch && r.estado === filterEstado;
  });

  return (
    <div>
      {/* CABECERA Y BOTÓN */}
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="module-title">Reservas Anticipadas & Calendario</h1>
          <p className="module-desc">
            Gestiona reservas futuras con abono, verifica la disponibilidad sin traslapes y convierte reservas a arriendos activos.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModalNueva(true)}>
          <Plus size={18} />
          <span>Nueva Reserva</span>
        </button>
      </div>

      {/* TARJETAS DE KPIs */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reservas Confirmadas
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-arrendado-bg)', color: 'var(--status-arrendado)' }}>
              <CalendarCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            {reservas.filter(r => r.estado === 'Confirmada').length} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>activas</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Listas para la fecha de entrega
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Abonos Recaudados
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-disponible-bg)', color: 'var(--status-disponible)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-disponible)' }}>
            {formatCLP(reservas.filter(r => r.estado === 'Confirmada').reduce((acc, r) => acc + r.montoAbono, 0))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Anticipos ingresados en caja
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Saldos por Cobrar
            </span>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {formatCLP(reservas.filter(r => r.estado === 'Confirmada').reduce((acc, r) => acc + r.saldoPendiente, 0))}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            A cobrar en la entrega
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
              placeholder="Buscar por cliente o disfraz..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['Confirmada', 'Convertida', 'Cancelada', 'Todas'] as const).map(est => (
              <button
                key={est}
                type="button"
                className={`btn ${filterEstado === est ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minHeight: '38px' }}
                onClick={() => setFilterEstado(est)}
              >
                {est} ({reservas.filter(r => est === 'Todas' || r.estado === est).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTADO DE RESERVAS */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {reservasFiltradas.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Calendar size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No hay reservas registradas en este filtro.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cliente</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Disfraz Reservado</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Periodo Reserva</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Arriendo Total</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Abono</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Saldo Pendiente</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservasFiltradas.map(res => {
                  const cliente = clientes.find(c => c.id === res.clienteId);
                  const disfraz = disfraces.find(d => d.id === res.disfrazId);

                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${
                            res.estado === 'Confirmada'
                              ? 'badge-arrendado'
                              : res.estado === 'Convertida'
                              ? 'badge-disponible'
                              : 'badge-atrasado'
                          }`}
                        >
                          {res.estado}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong>{cliente ? cliente.nombre : 'Cliente General'}</strong>
                        {cliente?.telefono && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cliente.telefono}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong>{disfraz ? disfraz.nombre : 'Disfraz'}</strong>
                        {disfraz && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Talla {disfraz.talla} ({disfraz.categoria})
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {res.fechaInicio} ➔ {res.fechaFin}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{formatCLP(res.montoArriendo)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ color: 'var(--status-disponible)', fontWeight: 700 }}>+{formatCLP(res.montoAbono)}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong style={{ color: res.saldoPendiente > 0 ? '#ef4444' : 'var(--status-disponible)' }}>
                          {formatCLP(res.saldoPendiente)}
                        </strong>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {res.estado === 'Confirmada' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem', minHeight: '34px' }}
                                title="Entregar disfraz y convertir en Arriendo Activo"
                                onClick={() => handleConvertirEnArriendo(res)}
                              >
                                <CheckCircle size={14} />
                                <span>Entregar</span>
                              </button>

                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.55rem', fontSize: '0.775rem', minHeight: '34px' }}
                                title="Cancelar reserva"
                                onClick={() => handleCancelarReserva(res.id)}
                              >
                                <XCircle size={14} color="#ef4444" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.775rem', minHeight: '34px' }}
                            title="Imprimir Comprobante"
                            onClick={() => {
                              setComprobanteVer({
                                tipo: 'Reserva',
                                folio: res.id.toUpperCase().slice(-8),
                                fechaEmision: res.fechaCreacion ? res.fechaCreacion.split('T')[0] : res.fechaInicio,
                                clienteNombre: cliente ? cliente.nombre : 'Cliente General',
                                clienteTelefono: cliente ? cliente.telefono : '',
                                clienteDireccion: cliente ? cliente.direccion : '',
                                disfrazNombre: disfraz ? disfraz.nombre : 'Disfraz General',
                                disfrazTalla: disfraz ? disfraz.talla : 'S/I',
                                disfrazCategoria: disfraz ? disfraz.categoria : 'General',
                                fechaInicio: res.fechaInicio,
                                fechaFin: res.fechaFin,
                                montoArriendo: res.montoArriendo,
                                montoAbono: res.montoAbono,
                                montoGarantia: disfraz ? disfraz.garantiaSugerida : 10000,
                                saldoPendiente: res.saldoPendiente,
                                observaciones: res.observaciones,
                              });
                            }}
                          >
                            <Printer size={14} />
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

      {/* MODAL REGISTRO NUEVA RESERVA CON ESTILOS CORRECTOS */}
      {showModalNueva && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Nueva Reserva Anticipada</h3>
              <button className="modal-close" onClick={() => setShowModalNueva(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarReserva} style={{ marginTop: '1rem' }}>
              {solapamientoError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertTriangle size={18} />
                  <span>{solapamientoError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Cliente</label>
                <select
                  className="form-select"
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  required
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.telefono})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Disfraz a Reservar</label>
                <select
                  className="form-select"
                  value={disfrazId}
                  onChange={e => {
                    handleDisfrazChange(e.target.value);
                    setSolapamientoError(null);
                  }}
                  required
                >
                  <option value="">-- Selecciona un disfraz del catálogo --</option>
                  {disfraces.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} - Talla {d.talla} ({formatCLP(d.precioSugerido)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha Retiro (Inicio)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fechaInicio}
                    onChange={e => {
                      setFechaInicio(e.target.value);
                      setSolapamientoError(null);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha Devolución (Fin)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fechaFin}
                    onChange={e => {
                      setFechaFin(e.target.value);
                      setSolapamientoError(null);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Monto Arriendo ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={montoArriendo}
                    onChange={e => setMontoArriendo(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Abono Inicial ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={montoAbono}
                    onChange={e => setMontoAbono(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="card" style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                  <span>Saldo Pendiente al Retirar:</span>
                  <span style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 800 }}>
                    {formatCLP(Math.max(0, montoArriendo - montoAbono))}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones / Notas de Reserva</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Detalles sobre eventos, accesorios especiales..."
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModalNueva(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPROBANTE */}
      {comprobanteVer && (
        <ComprobanteModal comprobante={comprobanteVer} onClose={() => setComprobanteVer(null)} />
      )}
    </div>
  );
};
