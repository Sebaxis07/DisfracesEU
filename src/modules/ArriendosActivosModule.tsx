import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import type { Arriendo, ResolucionGarantia, TipoIncidente } from '../types';
import { MessageCircle, CheckCircle, Clock, AlertTriangle, ShieldCheck, Shirt, Camera, AlertCircle } from 'lucide-react';

interface ArriendosActivosModuleProps {
  onStateChanged: () => void;
}

export const ArriendosActivosModule: React.FC<ArriendosActivosModuleProps> = ({ onStateChanged }) => {
  const arriendos = StorageService.getArriendos();
  const clientes = StorageService.getClientes();
  const disfraces = StorageService.getDisfraces();

  const [filter, setFilter] = useState<'Todos' | 'Hoy' | 'Vencidos'>('Todos');
  const [selectedArriendoForReturn, setSelectedArriendoForReturn] = useState<Arriendo | null>(null);

  // Formulario de Liquidación e Inspección de Daño
  const [resolucionGarantia, setResolucionGarantia] = useState<ResolucionGarantia>('Devuelta');
  const [montoRetenido, setMontoRetenido] = useState<number>(0);
  const [estadoPrenda, setEstadoPrenda] = useState<'Disponible' | 'Mantencion'>('Disponible');
  const [observacionesDevolucion, setObservacionesDevolucion] = useState<string>('');

  // Detalles de Incidente por Daño
  const [tipoIncidente, setTipoIncidente] = useState<TipoIncidente>('Mancha');
  const [descripcionIncidente, setDescripcionIncidente] = useState<string>('');
  const [costoReparacionEstimado, setCostoReparacionEstimado] = useState<number>(0);
  const [fotoEvidenciaUrl, setFotoEvidenciaUrl] = useState<string | undefined>(undefined);

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
      mensaje += `Te recordamos que el plazo pactado para la devolución del disfraz *${disfraz?.nombre || 'arrendado'}* venció el ${arriendo.fechaPactada}. Por favor acércate a entregarlo para liberar tu garantía de $${Number(arriendo.montoGarantia || 0).toLocaleString('es-CL')} CLP. ¡Muchas gracias!`;
    } else {
      mensaje += `Te recordamos que hoy ${arriendo.fechaPactada} esperamos la devolución del disfraz *${disfraz?.nombre || 'arrendado'}*. ¡Te esperamos!`;
    }

    const cleanPhone = cliente.telefono.replace(/[^\d+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const handleSimularFotoEvidencia = () => {
    setFotoEvidenciaUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80');
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArriendoForReturn) return;

    setIsSubmitting(true);
    const tieneDano = resolucionGarantia === 'Retenida_Parcial' || resolucionGarantia === 'Retenida_Total';
    const garantiaTotal = Number(selectedArriendoForReturn.montoGarantia || 0);
    const finalRetenido = tieneDano ? montoRetenido : 0;
    const finalDevuelto = Math.max(0, garantiaTotal - finalRetenido);

    const incidentePayload = tieneDano ? {
      tipoIncidente,
      descripcion: descripcionIncidente || `Garantía retenida: $${finalRetenido.toLocaleString('es-CL')} CLP.`,
      fotoEvidenciaUrl,
      montoGarantiaDevuelta: finalDevuelto,
      costoReparacionEstimado,
    } : undefined;

    await StorageService.finalizarDevolucionAsync(
      selectedArriendoForReturn.id,
      resolucionGarantia,
      finalRetenido,
      tieneDano ? 'Mantencion' : estadoPrenda,
      observacionesDevolucion,
      incidentePayload
    );

    setIsSubmitting(false);
    setSelectedArriendoForReturn(null);
    onStateChanged();
  };

  return (
    <div>
      <div className="module-header">
        <h1 className="module-title">Gestión de Arriendos Activos y Devoluciones</h1>
        <p className="module-desc">Línea de tiempo de urgencia, recordatorios vía WhatsApp e inspección de daños con cobro de garantía.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
                <div style={{ flex: 1, minWidth: '240px' }}>
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
                    <span>Arriendo: <strong>${Number(arriendo.montoArriendo || 0).toLocaleString('es-CL')}</strong></span>
                    {arriendo.aplicaGarantia && (
                      <span style={{ color: '#047857', fontWeight: 600 }}>
                        Garantía en custodia: ${Number(arriendo.montoGarantia || 0).toLocaleString('es-CL')}
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
                      setMontoRetenido(Number(arriendo.montoGarantia || 0));
                      setEstadoPrenda('Disponible');
                      setResolucionGarantia('Devuelta');
                    }}
                  >
                    <CheckCircle size={16} />
                    <span>Inspeccionar & Recepcionar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Devolución e Inspección de Incidente por Daño */}
      {selectedArriendoForReturn && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1.05rem', lineHeight: '1.3' }}>Inspección & Devolución</h3>
              <button className="modal-close" onClick={() => setSelectedArriendoForReturn(null)}>&times;</button>
            </div>

            <form onSubmit={handleConfirmReturn}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
                <div>Disfraz: <strong>{getDisfraz(selectedArriendoForReturn.disfrazId)?.nombre}</strong></div>
                <div>Cliente: <strong>{getCliente(selectedArriendoForReturn.clienteId)?.nombre}</strong></div>
                <div>Garantía Custodiada: <strong>${Number(selectedArriendoForReturn.montoGarantia || 0).toLocaleString('es-CL')} CLP</strong></div>
              </div>

              {/* Selección de Estado e Inspección con opciones compactas en Móvil */}
              <div className="form-group">
                <label className="form-label">Estado de Recepción / Garantía *</label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.88rem' }}
                  value={resolucionGarantia}
                  onChange={(e) => {
                    const res = e.target.value as ResolucionGarantia;
                    setResolucionGarantia(res);
                    const gTotal = Number(selectedArriendoForReturn.montoGarantia || 0);
                    if (res === 'Retenida_Total') {
                      setMontoRetenido(gTotal);
                      setEstadoPrenda('Mantencion');
                    } else if (res === 'Retenida_Parcial') {
                      setMontoRetenido(Math.round(gTotal / 2));
                      setEstadoPrenda('Mantencion');
                    } else {
                      setMontoRetenido(0);
                      setEstadoPrenda('Disponible');
                    }
                  }}
                >
                  <option value="Devuelta">🟢 Prenda Impecable (Garantía 100%)</option>
                  <option value="Retenida_Parcial">🟡 Daño / Faltante (Retención Parcial)</option>
                  <option value="Retenida_Total">🔴 Pérdida / Daño Grave (Retención Total)</option>
                </select>
              </div>

              {/* FORMULARIO DE DETALLE DE DAÑO */}
              {(resolucionGarantia === 'Retenida_Parcial' || resolucionGarantia === 'Retenida_Total') && (
                <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={16} color="#dc2626" />
                    <span>Registro Oficial del Incidente / Daño</span>
                  </h4>

                  <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Tipo Daño *</label>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.85rem' }}
                        value={tipoIncidente}
                        onChange={(e) => setTipoIncidente(e.target.value as TipoIncidente)}
                      >
                        <option value="Mancha">🧼 Mancha Severa</option>
                        <option value="Ruptura">🪡 Costura / Ropa Rota</option>
                        <option value="Accesorio_Faltante">🗡️ Accesorio Faltante</option>
                        <option value="Perdida_Total">❌ Pérdida Total</option>
                        <option value="Otro">⚠️ Otro Incidente</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label">Monto Retenido ($ CLP)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={montoRetenido}
                        onChange={(e) => setMontoRetenido(Number(e.target.value))}
                        max={Number(selectedArriendoForReturn.montoGarantia || 0)}
                        step="1000"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label">Descripción del Daño *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Mancha en la falda y costura rota"
                      value={descripcionIncidente}
                      onChange={(e) => setDescripcionIncidente(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <label className="form-label">Costo Arreglo ($ CLP)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Ej: 4000"
                        value={costoReparacionEstimado}
                        onChange={(e) => setCostoReparacionEstimado(Number(e.target.value))}
                        step="500"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <label className="form-label">Evidencia</label>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 700 }}
                          onClick={handleSimularFotoEvidencia}
                        >
                          <Camera size={13} /> Foto
                        </button>
                      </div>
                      {fotoEvidenciaUrl && (
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                          ✓ Foto adjunta
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#7f1d1d', fontWeight: 600, marginTop: '0.5rem', backgroundColor: '#fee2e2', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    Reembolso: ${Number(Math.max(0, (selectedArriendoForReturn.montoGarantia || 0) - (montoRetenido || 0))).toLocaleString('es-CL')} CLP | Margen Neto: +${Number((montoRetenido || 0) - (costoReparacionEstimado || 0)).toLocaleString('es-CL')} CLP
                  </div>
                </div>
              )}

              {/* Destino Posterior del Disfraz en 2 Botones Adaptables */}
              <div className="form-group">
                <label className="form-label">Destino Posterior de la Prenda</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn ${estadoPrenda === 'Disponible' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 0.4rem', fontSize: '0.78rem', minHeight: '40px', lineHeight: '1.2' }}
                    onClick={() => setEstadoPrenda('Disponible')}
                  >
                    <ShieldCheck size={14} /> Listo para Re-arrendar
                  </button>

                  <button
                    type="button"
                    className={`btn ${estadoPrenda === 'Mantencion' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 0.4rem', fontSize: '0.78rem', minHeight: '40px', lineHeight: '1.2' }}
                    onClick={() => setEstadoPrenda('Mantencion')}
                  >
                    <Shirt size={14} /> Enviar a Mantención / Lavandería
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones Adicionales</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Cliente notificado vía WhatsApp"
                  value={observacionesDevolucion}
                  onChange={(e) => setObservacionesDevolucion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedArriendoForReturn(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Confirmar e Inspeccionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
