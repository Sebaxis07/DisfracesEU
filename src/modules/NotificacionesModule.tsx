import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { sendRealEmail } from '../services/emailService';
import type { ConfiguracionAlertas } from '../types';
import { Bell, Mail, Settings, Calendar, ShieldAlert } from 'lucide-react';

interface NotificacionesModuleProps {
  onStateChanged: () => void;
}

export const NotificacionesModule: React.FC<NotificacionesModuleProps> = ({ onStateChanged }) => {
  const notificaciones = StorageService.getNotificaciones();
  const [config, setConfig] = useState<ConfiguracionAlertas>(StorageService.getConfigAlertas());
  const [mensajeInformativo, setMensajeInformativo] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);

  const handleToggle = (key: keyof ConfiguracionAlertas) => {
    if (key === 'emailDestino' || key === 'smtpUser' || key === 'smtpPass') return;
    const updated = {
      ...config,
      [key]: !config[key],
    };
    setConfig(updated);
    StorageService.saveConfigAlertas(updated);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveConfigAlertas(config);
    setMensajeInformativo('Correo de destino guardado con éxito.');
    setTimeout(() => setMensajeInformativo(''), 4000);
  };

  const handleMarcarLeida = (id: string) => {
    StorageService.marcarNotificacionLeida(id);
    onStateChanged();
  };

  const handleEnviarReporteMatutino = async () => {
    if (!config.emailDestino) {
      alert('Por favor ingresa primero la dirección de correo de destino.');
      return;
    }

    setIsSendingEmail(true);
    const arriendos = StorageService.getArriendos();
    const clientes = StorageService.getClientes();
    const disfraces = StorageService.getDisfraces();
    const hoyStr = new Date().toISOString().split('T')[0];

    const paraHoy = arriendos.filter(a => a.fechaPactada === hoyStr && a.estado === 'Activo');
    const atrasados = arriendos.filter(a => a.fechaPactada < hoyStr || a.estado === 'Atrasado');

    const detallesParaHoy = paraHoy.map(a => ({
      clienteNombre: clientes.find(c => c.id === a.clienteId)?.nombre || 'Cliente Anónimo',
      disfrazNombre: disfraces.find(d => d.id === a.disfrazId)?.nombre || 'Disfraz',
      fechaPactada: a.fechaPactada,
    }));

    const detallesAtrasados = atrasados.map(a => ({
      clienteNombre: clientes.find(c => c.id === a.clienteId)?.nombre || 'Cliente Anónimo',
      disfrazNombre: disfraces.find(d => d.id === a.disfrazId)?.nombre || 'Disfraz',
      fechaPactada: a.fechaPactada,
    }));

    const asunto = `[Disfraces EU] Resumen Matutino de Devoluciones - ${hoyStr}`;
    const cuerpoTexto = `Resumen matutino Disfraces EU: ${paraHoy.length} entregas esperadas hoy, ${atrasados.length} atrasados.`;

    const result = await sendRealEmail({
      to: config.emailDestino,
      subject: asunto,
      bodyText: cuerpoTexto,
      type: 'diario',
      payload: {
        paraHoyCount: paraHoy.length,
        atrasadosCount: atrasados.length,
        detallesParaHoy,
        detallesAtrasados,
      },
    });

    StorageService.addNotificacion({
      titulo: 'Resumen Matutino Despachado',
      mensaje: result.message,
      tipo: 'diario',
    });

    setMensajeInformativo(result.message);
    setIsSendingEmail(false);
    onStateChanged();
    setTimeout(() => setMensajeInformativo(''), 6000);
  };

  const handleEnviarAlertaVencimiento = async () => {
    if (!config.emailDestino) {
      alert('Por favor ingresa primero la dirección de correo de destino.');
      return;
    }

    setIsSendingEmail(true);
    const arriendos = StorageService.getArriendos();
    const clientes = StorageService.getClientes();
    const disfraces = StorageService.getDisfraces();
    const hoyStr = new Date().toISOString().split('T')[0];

    const atrasados = arriendos.filter(a => a.fechaPactada < hoyStr || a.estado === 'Atrasado');

    const detallesAtrasados = atrasados.map(a => ({
      clienteNombre: clientes.find(c => c.id === a.clienteId)?.nombre || 'Cliente Anónimo',
      clienteTelefono: clientes.find(c => c.id === a.clienteId)?.telefono || 'Sin teléfono',
      disfrazNombre: disfraces.find(d => d.id === a.disfrazId)?.nombre || 'Disfraz',
      fechaPactada: a.fechaPactada,
      montoGarantia: a.montoGarantia,
    }));

    const asunto = `[ALERTA CRÍTICA] Devolución de Disfraz Vencida - Disfraces EU`;
    const cuerpoTexto = `Atención: Se registran ${atrasados.length} arriendos atrasados.`;

    const result = await sendRealEmail({
      to: config.emailDestino,
      subject: asunto,
      bodyText: cuerpoTexto,
      type: 'vencimiento',
      payload: {
        atrasadosCount: atrasados.length,
        detallesAtrasados,
      },
    });

    StorageService.addNotificacion({
      titulo: 'Alerta por Vencimiento Despachada',
      mensaje: result.message,
      tipo: 'vencimiento',
    });

    setMensajeInformativo(result.message);
    setIsSendingEmail(false);
    onStateChanged();
    setTimeout(() => setMensajeInformativo(''), 6000);
  };

  return (
    <div>
      <div className="module-header">
        <h1 className="module-title">Centro de Notificaciones y Alertas por Correo</h1>
        <p className="module-desc">Configura la casilla de correo de destino donde llegarán tus resúmenes y avisos de devoluciones.</p>
      </div>

      {mensajeInformativo && (
        <div style={{
          backgroundColor: '#eff6ff',
          color: '#1e40af',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <Mail size={20} />
          <span>{mensajeInformativo}</span>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="var(--color-primary)" />
            <span>Configuración de Correo Destino</span>
          </h3>

          <form onSubmit={handleSaveConfig}>
            {/* Correo Destino */}
            <div className="form-group">
              <label className="form-label">Correo Electrónico donde Recibir Avisos *</label>
              <input
                type="email"
                className="form-input"
                placeholder="ejemplo@correo.com"
                value={config.emailDestino}
                onChange={(e) => setConfig({ ...config, emailDestino: e.target.value })}
                required
              />
              <span className="form-hint">Casilla de correo donde se recibirán los resúmenes diarios y alertas de devolución.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.25rem 0' }}>
              <div className="switch-container">
                <div>
                  <div className="switch-label">Resumen Matutino Diario</div>
                  <div className="switch-subtext">Listado diario a las 08:00 AM con entregas agendadas.</div>
                </div>
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={config.avisoDiarioMatutino}
                  onChange={() => handleToggle('avisoDiarioMatutino')}
                />
              </div>

              <div className="switch-container">
                <div>
                  <div className="switch-label">Alerta Inmediata por Vencimiento</div>
                  <div className="switch-subtext">Aviso instantáneo cuando una devolución entra en estado vencido.</div>
                </div>
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={config.alertaInmediataVencimiento}
                  onChange={() => handleToggle('alertaInmediataVencimiento')}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Guardar Configuración
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>Prueba de Envío Directo:</div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.8rem', minWidth: '160px' }}
                onClick={handleEnviarReporteMatutino}
                disabled={isSendingEmail}
              >
                <Calendar size={14} />
                <span>{isSendingEmail ? 'Enviando...' : 'Enviar Resumen Matutino'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.6rem 0.75rem', fontSize: '0.8rem', minWidth: '160px' }}
                onClick={handleEnviarAlertaVencimiento}
                disabled={isSendingEmail}
              >
                <ShieldAlert size={14} />
                <span>{isSendingEmail ? 'Enviando...' : 'Enviar Alerta Vencimiento'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} color="var(--color-primary)" />
            <span>Historial de Avisos y Notificaciones ({notificaciones.length})</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
            {notificaciones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No hay notificaciones en el historial. Los avisos aparecerán al registrar o vencer arriendos.
              </div>
            ) : (
              notificaciones.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: n.leida ? 'var(--bg-subtle)' : 'var(--color-primary-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: n.tipo === 'vencimiento' ? '#b91c1c' : 'var(--color-text-main)' }}>
                      {n.titulo}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{n.fecha}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{n.mensaje}</p>

                  {!n.leida && (
                    <div style={{ marginTop: '0.4rem', alignSelf: 'flex-end' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => handleMarcarLeida(n.id)}
                      >
                        Marcar como leída
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
