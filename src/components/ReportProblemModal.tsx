import React, { useState } from 'react';
import { AlertOctagon, Send, CheckCircle2, Database, Wifi, Palette, Cpu } from 'lucide-react';
import { errorLogger, type CategoriaError } from '../services/errorLogger';

interface ReportProblemModalProps {
  activeModule: string;
  onClose: () => void;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ activeModule, onClose }) => {
  const [categoria, setCategoria] = useState<CategoriaError>('Base de Datos');
  const [moduloAfectado, setModuloAfectado] = useState(activeModule || 'General');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      alert('Por favor describe brevemente qué ocurrió.');
      return;
    }

    setIsSubmitting(true);

    // Registrar en el log del sistema
    const newLog = errorLogger.logError(
      `Reporte de Incidencia enviado por la Dueña: ${descripcion.trim()}`,
      categoria,
      undefined,
      window.location.href
    );

    // Enviar correo a dpastora98@gmail.com
    await errorLogger.sendEmailAlert(
      newLog,
      'MANUAL_DUEÑA',
      descripcion.trim(),
      moduloAfectado
    );

    setIsSubmitting(false);
    setIsSentSuccess(true);

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertOctagon size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0 }}>Reportar un Problema</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Envía una alerta directa al equipo técnico (dpastora98@gmail.com)
              </p>
            </div>
          </div>

          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {isSentSuccess ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <CheckCircle2 size={56} color="#16a34a" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
              ¡Reporte Enviado con Éxito!
            </h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Se envió la alerta detallada a <strong>dpastora98@gmail.com</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
            {/* CATEGORÍA DEL PROBLEMA */}
            <div className="form-group">
              <label className="form-label">1. Categoría del Problema</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${categoria === 'Base de Datos' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', fontSize: '0.825rem', padding: '0.6rem 0.75rem', minHeight: '44px' }}
                  onClick={() => setCategoria('Base de Datos')}
                >
                  <Database size={16} />
                  <span>🛢️ Base de Datos</span>
                </button>

                <button
                  type="button"
                  className={`btn ${categoria === 'Red / Conexión' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', fontSize: '0.825rem', padding: '0.6rem 0.75rem', minHeight: '44px' }}
                  onClick={() => setCategoria('Red / Conexión')}
                >
                  <Wifi size={16} />
                  <span>🌐 Red / Conexión</span>
                </button>

                <button
                  type="button"
                  className={`btn ${categoria === 'Diseño / UI' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', fontSize: '0.825rem', padding: '0.6rem 0.75rem', minHeight: '44px' }}
                  onClick={() => setCategoria('Diseño / UI')}
                >
                  <Palette size={16} />
                  <span>🎨 Diseño / Pantalla</span>
                </button>

                <button
                  type="button"
                  className={`btn ${categoria === 'Lógica / Operación' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', fontSize: '0.825rem', padding: '0.6rem 0.75rem', minHeight: '44px' }}
                  onClick={() => setCategoria('Lógica / Operación')}
                >
                  <Cpu size={16} />
                  <span>⚡ Lógica / Operación</span>
                </button>
              </div>
            </div>

            {/* MÓDULO AFECTADO */}
            <div className="form-group">
              <label className="form-label">2. Módulo donde ocurrió</label>
              <select
                className="form-select"
                value={moduloAfectado}
                onChange={e => setModuloAfectado(e.target.value)}
                required
              >
                <option value="Nuevo Arriendo">➕ Nuevo Arriendo</option>
                <option value="Arriendos Activos">⏱️ Arriendos Activos</option>
                <option value="Reservas & Calendario">📅 Reservas & Calendario</option>
                <option value="Directorio de Clientes">👥 Directorio de Clientes</option>
                <option value="Inventario & Catálogo">👕 Inventario & Catálogo</option>
                <option value="Comprobantes & Contratos">🧾 Comprobantes & Contratos</option>
                <option value="Dashboard & Analíticas">📊 Dashboard & Analíticas</option>
                <option value="Alertas & Sistema">🔔 Alertas & Sistema</option>
                <option value="Otro / General">⚙️ Otro / General</option>
              </select>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="form-group">
              <label className="form-label">3. Describe lo que sucedió o lo que estabas intentando hacer</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ej: Intenté presionar el botón de guardar y la pantalla no respondió, o me salió un mensaje de error..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                required
              />
            </div>

            <div className="card" style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 0.9rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                ℹ️ <strong>Telemetría Automática:</strong> El sistema adjuntará los datos técnicos y la traza de consola reciente a tu mensaje.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </button>

              <button type="submit" className="btn btn-danger" disabled={isSubmitting} style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                <Send size={16} />
                <span>{isSubmitting ? 'Enviando Alerta...' : 'Enviar Reporte a Soporte'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
