import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import type { Arriendo, ResolucionGarantia } from '../types';
import { MessageCircle, CheckCircle, Clock, AlertTriangle, ShieldCheck, Shirt } from 'lucide-react';

interface ArriendosActivosModuleProps {
  onStateChanged: () => void;
}

export const ArriendosActivosModule: React.FC<ArriendosActivosModuleProps> = ({ onStateChanged }) => {
  const arriendos = StorageService.getArriendos();
  const clientes = StorageService.getClientes();
  const disfraces = StorageService.getDisfraces();

  const [filter, setFilter] = useState<'Todos' | 'Hoy' | 'Vencidos'>('Todos');
  const [selectedArriendoForReturn, setSelectedArriendoForReturn] = useState<Arriendo | null>(null);

  const [resolucionGarantia, setResolucionGarantia] = useState<ResolucionGarantia>('Devuelta');
  const [montoRetenido, setMontoRetenido] = useState<number>(0);
  const [estadoPrenda, setEstadoPrenda] = useState<'Disponible' | 'Mantencion'>('Disponible');
  const [observacionesDevolucion, setObservacionesDevolucion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const hoyStr = new Date().toISOString().split('T')[0];

  const arriendosEnCurso = arriendos.filter(a => a.estado === 'Activo' || a.estado === 'Atrasado');

  const filteredArriendos = arriendosEnCurso.filter(a => {
    if (filter === 'Hoy') return a.fechaPactada === hoyStr;
    if (filter === 'Vencidos') return a.fechaPactada < hoyStr || a.estado === 'Atrasado';
    return true;
  });

  const getCliente = (clienteId: string) => clientes.find(c => c.id === clienteId);
  const getDisfraz = (disfrazId: string) => disfraces.find(d => d.id === disfrazId);

  const handleOpenWhatsApp = (arriendo: Arriendo) => {
    const cliente = getCliente(arriendo.clienteId);
    const disfraz = getDisfraz(arriendo.disfrazId);
    if (!cliente) return;

    const esVencido = arriendo.fechaPactada < hoyStr || arriendo.estado === 'Atrasado';
    let mensaje = `Hola ${cliente.nombre}, te saludamos de *Disfraces EU*. `;

    if (esVencido) {
      mensaje += `Te recordamos que el plazo pactado para la devolución del disfraz *${disfraz?.nombre || 'arrendado'}* venció el ${arriendo.fechaPactada}. Por favor acércate a entregarlo para liberar tu garantía de $${arriendo.montoGarantia.toLocaleString('es-CL')} CLP. ¡Muchas gracias!`;
    } else {
      mensaje += `Te recordamos que hoy ${arriendo.fechaPactada} esperamos la devolución del disfraz *${disfraz?.nombre || 'arrendado'}*. ¡Te esperamos!`;
    }

    const cleanPhone = cliente.telefono.replace(/[^\d+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArriendoForReturn) return;

    setIsSubmitting(true);
    await StorageService.finalizarDevolucionAsync(
      selectedArriendoForReturn.id,
      resolucionGarantia,
      resolucionGarantia === 'Devuelta' ? 0 : montoRetenido,
      estadoPrenda,
      observacionesDevolucion
    );

    setIsSubmitting(false);
    setSelectedArriendoForReturn(null);
    onStateChanged();
  };

  return (
    <div>
      <div className="module-header">
        <h1 className="module-title">Gestión de Arriendos Activos y Devoluciones</h1>
        <p className="module-desc">Línea de tiempo de urgencia (A tiempo vs Vencidos). Recordatorios vía WhatsApp a un solo clic.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${filter === 'Todos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('Todos')}
        >
          Todos en Curso ({arriendosEnCurso.length})
        </button>

        <button
          className={`btn ${filter === 'Hoy' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('Hoy')}
        >
          <Clock size={16} />
          <span>Entrega Hoy ({arriendosEnCurso.filter(a => a.fechaPactada === hoyStr).length})</span>
        </button>

        <button
          className={`btn ${filter === 'Vencidos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('Vencidos')}
          style={{ backgroundColor: filter === 'Vencidos' ? '#dc2626' : undefined, color: filter === 'Vencidos' ? 'white' : undefined }}
        >
          <AlertTriangle size={16} />
          <span>Vencidos ({arriendosEnCurso.filter(a => a.fechaPactada < hoyStr || a.estado === 'Atrasado').length})</span>
        </button>
      </div>

      {filteredArriendos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-muted)' }}>
          <CheckCircle size={48} style={{ color: '#16a34a', opacity: 0.8, marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
            No hay arriendos activos pendientes
          </h3>
          <p style={{ fontSize: '0.95rem' }}>Todos los disfraces están devueltos y disponibles en el catálogo.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredArriendos.map(arriendo => {
            const cliente = getCliente(arriendo.clienteId);
            const disfraz = getDisfraz(arriendo.disfrazId);
            const esVencido = arriendo.fechaPactada < hoyStr || arriendo.estado === 'Atrasado';

            return (
              <div
                key={arriendo.id}
                className="card"
                style={{
                  borderLeft: esVencido ? '6px solid #dc2626' : '6px solid #2563eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span className={`badge ${esVencido ? 'badge-atrasado' : 'badge-activo'}`}>
                      {esVencido ? '⚠️ DEVOLUCIÓN VENCIDA' : 'EN PLAZO'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Pactado: {arriendo.fechaPactada}</span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{disfraz?.nombre || 'Disfraz en Arriendo'}</h3>

                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    👤 Cliente: <strong style={{ color: 'var(--color-text-main)' }}>{cliente?.nombre || 'Cliente'}</strong> ({cliente?.telefono})
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <span>Arriendo: <strong>${arriendo.montoArriendo.toLocaleString('es-CL')}</strong></span>
                    {arriendo.aplicaGarantia && (
                      <span style={{ color: '#047857', fontWeight: 600 }}>
                        Garantía en custodia: ${arriendo.montoGarantia.toLocaleString('es-CL')}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ backgroundColor: '#25d366', color: 'white', border: 'none' }}
                    onClick={() => handleOpenWhatsApp(arriendo)}
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedArriendoForReturn(arriendo);
                      setMontoRetenido(arriendo.montoGarantia);
                    }}
                  >
                    <CheckCircle size={16} />
                    <span>Registrar Devolución</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedArriendoForReturn && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Recepcionar Prenda y Resolver Garantía</h3>
              <button className="modal-close" onClick={() => setSelectedArriendoForReturn(null)}>&times;</button>
            </div>

            <form onSubmit={handleConfirmReturn}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                <div>Disfraz: <strong>{getDisfraz(selectedArriendoForReturn.disfrazId)?.nombre}</strong></div>
                <div>Cliente: <strong>{getCliente(selectedArriendoForReturn.clienteId)?.nombre}</strong></div>
                <div>Garantía en Custodia: <strong>${selectedArriendoForReturn.montoGarantia.toLocaleString('es-CL')} CLP</strong></div>
              </div>

              <div className="form-group">
                <label className="form-label">Resolución de la Garantía *</label>
                <select
                  className="form-select"
                  value={resolucionGarantia}
                  onChange={(e) => setResolucionGarantia(e.target.value as ResolucionGarantia)}
                >
                  <option value="Devuelta">Devolver 100% al Cliente (Prenda Impecable)</option>
                  <option value="Retenida_Parcial">Retención Parcial (Daño Leve / Atraso)</option>
                  <option value="Retenida_Total">Retención Total (Perdida / Daño Grave)</option>
                </select>
              </div>

              {resolucionGarantia !== 'Devuelta' && (
                <div className="form-group">
                  <label className="form-label">Monto de Garantía a Retener ($ CLP) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={montoRetenido}
                    onChange={(e) => setMontoRetenido(Number(e.target.value))}
                    max={selectedArriendoForReturn.montoGarantia}
                    step="1000"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Estado Físico de la Prenda al Recibir</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`btn ${estadoPrenda === 'Disponible' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => setEstadoPrenda('Disponible')}
                  >
                    <ShieldCheck size={14} /> Listo para Re-arrendar
                  </button>

                  <button
                    type="button"
                    className={`btn ${estadoPrenda === 'Mantencion' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => setEstadoPrenda('Mantencion')}
                  >
                    <Shirt size={14} /> Requiere Lavandería / Costura
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones de la Entrega (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Faltó accesorio espada, lavado pagado"
                  value={observacionesDevolucion}
                  onChange={(e) => setObservacionesDevolucion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedArriendoForReturn(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando en Supabase...' : 'Confirmar Devolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
