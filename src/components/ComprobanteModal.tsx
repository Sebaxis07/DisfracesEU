import React, { useState, useRef, useEffect } from 'react';
import { Printer, Eraser, MessageCircle } from 'lucide-react';
import type { ComprobanteData } from '../types';

interface ComprobanteModalProps {
  comprobante: ComprobanteData | null;
  onClose: () => void;
}

export const ComprobanteModal: React.FC<ComprobanteModalProps> = ({ comprobante, onClose }) => {
  const [modo, setModo] = useState<'ticket' | 'contrato'>('ticket');
  const [firmaUrl, setFirmaUrl] = useState<string | null>(comprobante?.firmaUrl || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (comprobante?.firmaUrl) {
      setFirmaUrl(comprobante.firmaUrl);
    }
  }, [comprobante]);

  if (!comprobante) return null;

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  // Manejo de Firma Digital Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setFirmaUrl(canvas.toDataURL());
    }
  };

  const clearFirma = () => {
    setFirmaUrl(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = comprobante.clienteTelefono.replace(/\D/g, '');
    if (!cleanPhone.startsWith('56')) {
      cleanPhone = '56' + cleanPhone;
    }
    const msg = encodeURIComponent(
      `Hola ${comprobante.clienteNombre}, te adjuntamos el comprobante digital de tu ${comprobante.tipo.toLowerCase()} en *Disfraces EU*:\n\n` +
      `📌 *Folio:* ${comprobante.folio}\n` +
      `🎭 *Disfraz:* ${comprobante.disfrazNombre} (${comprobante.disfrazTalla})\n` +
      `📅 *Periodo:* ${comprobante.fechaInicio} al ${comprobante.fechaFin}\n` +
      `💰 *Monto Arriendo:* ${formatCLP(comprobante.montoArriendo)}\n` +
      `🛡️ *Garantía:* ${formatCLP(comprobante.montoGarantia)}\n` +
      `${comprobante.saldoPendiente ? `⚠️ *Saldo Pendiente:* ${formatCLP(comprobante.saldoPendiente)}\n` : ''}` +
      `\n¡Gracias por preferir Disfraces EU!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="modal-overlay print-modal-backdrop">
      <div className="modal-content print-modal-content">
        {/* Encabezado sin imprimir */}
        <div className="modal-header no-print">
          <div>
            <h3 className="modal-title">
              Comprobante & Contrato #{comprobante.folio}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Emisión: {comprobante.fechaEmision} | Cliente: {comprobante.clienteNombre}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="tab-switch">
              <button
                type="button"
                className={`tab-switch-btn ${modo === 'ticket' ? 'active' : ''}`}
                onClick={() => setModo('ticket')}
              >
                Ticket 80mm
              </button>
              <button
                type="button"
                className={`tab-switch-btn ${modo === 'contrato' ? 'active' : ''}`}
                onClick={() => setModo('contrato')}
              >
                Contrato A4
              </button>
            </div>
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* CUERPO IMPRIMIBLE */}
        <div className="modal-body print-modal-body">
          {modo === 'ticket' ? (
            /* FORMATO TICKET TÉRMICO (80mm) */
            <div className="ticket-printable">
              <div className="ticket-header">
                <img src="/logo.png" alt="Disfraces EU" className="ticket-logo" />
                <h2 className="ticket-title">DISFRACES EU</h2>
                <p className="ticket-sub">Gestión & Arriendo de Vestuario</p>
                <div className="ticket-divider" />
                <div className="ticket-badge">COMPROBANTE DE {comprobante.tipo.toUpperCase()}</div>
                <p className="ticket-folio">FOLIO: #{comprobante.folio}</p>
                <p className="ticket-fecha">Fecha: {comprobante.fechaEmision}</p>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-section">
                <p className="ticket-label">CLIENTE:</p>
                <p className="ticket-value-bold">{comprobante.clienteNombre}</p>
                <p className="ticket-value">Tel: {comprobante.clienteTelefono}</p>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-section">
                <p className="ticket-label">DETALLE PRENDA:</p>
                <div className="ticket-row">
                  <span>Prenda:</span>
                  <strong>{comprobante.disfrazNombre}</strong>
                </div>
                <div className="ticket-row">
                  <span>Talla / Cat:</span>
                  <span>{comprobante.disfrazTalla} ({comprobante.disfrazCategoria})</span>
                </div>
                <div className="ticket-row">
                  <span>F. Retiro:</span>
                  <span>{comprobante.fechaInicio}</span>
                </div>
                <div className="ticket-row">
                  <span>F. Devolución:</span>
                  <strong>{comprobante.fechaFin}</strong>
                </div>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-section">
                <div className="ticket-row">
                  <span>Monto Arriendo:</span>
                  <strong>{formatCLP(comprobante.montoArriendo)}</strong>
                </div>
                {comprobante.montoAbono !== undefined && (
                  <div className="ticket-row">
                    <span>Abono Pagado:</span>
                    <strong style={{ color: '#16a34a' }}>-{formatCLP(comprobante.montoAbono)}</strong>
                  </div>
                )}
                {comprobante.saldoPendiente !== undefined && (
                  <div className="ticket-row">
                    <span>Saldo Pendiente:</span>
                    <strong style={{ color: '#dc2626' }}>{formatCLP(comprobante.saldoPendiente)}</strong>
                  </div>
                )}
                <div className="ticket-row">
                  <span>Garantía Dejada:</span>
                  <span>{formatCLP(comprobante.montoGarantia)}</span>
                </div>
              </div>

              {comprobante.observaciones && (
                <>
                  <div className="ticket-divider" />
                  <div className="ticket-section">
                    <p className="ticket-label">OBSERVACIONES:</p>
                    <p className="ticket-value">{comprobante.observaciones}</p>
                  </div>
                </>
              )}

              {firmaUrl && (
                <div className="ticket-section" style={{ textAlign: 'center', marginTop: '0.8rem' }}>
                  <p className="ticket-label">FIRMA CLIENTE:</p>
                  <img src={firmaUrl} alt="Firma Cliente" className="ticket-signature-img" />
                </div>
              )}

              <div className="ticket-divider" />

              <div className="ticket-footer">
                <p>¡Gracias por tu confianza!</p>
                <p className="ticket-small">Conserve este ticket para retirar o devolver su prenda.</p>
              </div>
            </div>
          ) : (
            /* FORMATO CONTRATO LEGAL A4 / PDF */
            <div className="contrato-printable">
              <div className="contrato-header">
                <img src="/logo.png" alt="Disfraces EU" className="contrato-logo" />
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>CONTRATO DE ARRIENDO</h2>
                  <p style={{ margin: 0, fontWeight: 700, color: '#2563eb' }}>FOLIO: #{comprobante.folio}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Fecha: {comprobante.fechaEmision}</p>
                </div>
              </div>

              <hr className="contrato-hr" />

              <div className="contrato-grid">
                <div className="contrato-box">
                  <h4>DATOS DEL ARRENDADOR</h4>
                  <p><strong>Empresa:</strong> Disfraces EU</p>
                  <p><strong>Rubro:</strong> Arriendo de Vestuario y Accesorios</p>
                  <p><strong>Contacto:</strong> contacto@disfraceseu.cl</p>
                </div>
                <div className="contrato-box">
                  <h4>DATOS DEL ARRENDATARIO (CLIENTE)</h4>
                  <p><strong>Nombre:</strong> {comprobante.clienteNombre}</p>
                  <p><strong>Teléfono:</strong> {comprobante.clienteTelefono}</p>
                  <p><strong>Dirección:</strong> {comprobante.clienteDireccion || 'No especificada'}</p>
                </div>
              </div>

              <div className="contrato-box" style={{ marginTop: '1rem' }}>
                <h4>DETALLE DE LA PRENDA Y VALORES</h4>
                <table className="contrato-table">
                  <thead>
                    <tr>
                      <th>Prenda / Disfraz</th>
                      <th>Categoría / Talla</th>
                      <th>Período Pactado</th>
                      <th>Monto Arriendo</th>
                      <th>Garantía</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>{comprobante.disfrazNombre}</strong></td>
                      <td>{comprobante.disfrazCategoria} (Talla {comprobante.disfrazTalla})</td>
                      <td>{comprobante.fechaInicio} al {comprobante.fechaFin}</td>
                      <td>{formatCLP(comprobante.montoArriendo)}</td>
                      <td>{formatCLP(comprobante.montoGarantia)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="contrato-clauses">
                <h4>TÉRMINOS Y CONDICIONES DEL ARRIENDO</h4>
                <ol>
                  <li>El arrendatario se compromete a devolver la prenda en la fecha acordada (<strong>{comprobante.fechaFin}</strong>). En caso de atraso, se aplicará un recargo por cada día de mora.</li>
                  <li>La garantía de <strong>{formatCLP(comprobante.montoGarantia)}</strong> será devuelta íntegramente al verificar que la prenda retorna en el mismo estado de conservación.</li>
                  <li>En caso de manchas graves, rupturas o pérdida de accesorios, se retendrá el costo de reparación de la garantía. En caso de pérdida total, el arrendatario deberá cubrir el valor total de reposición.</li>
                  <li>No se permite lavar la prenda con productos abrasivos ni modificar la confección original del disfraz.</li>
                </ol>
              </div>

              <div className="contrato-signatures">
                <div className="signature-box">
                  <div className="signature-line" />
                  <p>Firma Arrendador (Disfraces EU)</p>
                </div>
                <div className="signature-box">
                  {firmaUrl ? (
                    <img src={firmaUrl} alt="Firma Arrendatario" className="contrato-signature-img" />
                  ) : (
                    <div className="signature-line" />
                  )}
                  <p>Firma Arrendatario: {comprobante.clienteNombre}</p>
                </div>
              </div>
            </div>
          )}

          {/* CAPTURA DE FIRMA DIGITAL EN PANTALLA (No Imprimible) */}
          <div className="firma-canvas-container no-print" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ✍️ Capturar Firma Digital del Cliente:
              </span>
              {firmaUrl && (
                <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={clearFirma}>
                  <Eraser size={14} /> Limpiar Firma
                </button>
              )}
            </div>

            <canvas
              ref={canvasRef}
              width={450}
              height={110}
              className="signature-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Firme con el mouse o con el dedo en pantallas táctiles antes de imprimir.
            </p>
          </div>
        </div>

        {/* PIE DE PÁGINA / ACCIONES (No imprimibles) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleSendWhatsApp}>
            <MessageCircle size={18} color="#25D366" />
            <span>Enviar por WhatsApp</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={18} />
              <span>Imprimir / Descargar PDF</span>
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
