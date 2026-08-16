// Plantillas HTML Elegantes y Compatibles con Gmail / Outlook / Mobile Mail

export const buildMorningSummaryTemplate = (params) => {
  const { fecha, paraHoyCount = 0, atrasadosCount = 0, detallesParaHoy = [], detallesAtrasados = [] } = params || {};

  const hoyItemsHtml = detallesParaHoy.length === 0
    ? `<div style="padding: 12px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b; font-style: italic;">No hay entregas agendadas para el día de hoy.</div>`
    : detallesParaHoy.map(item => `
        <div style="padding: 12px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
          <div style="font-weight: 800; color: #0f172a; font-size: 15px;">${item.disfrazNombre}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 2px;">Cliente: <strong>${item.clienteNombre}</strong></div>
        </div>
      `).join('');

  const atrasadosItemsHtml = detallesAtrasados.length === 0
    ? ''
    : detallesAtrasados.map(item => `
        <div style="padding: 12px 14px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 8px;">
          <div style="font-weight: 800; color: #991b1b; font-size: 15px;">${item.disfrazNombre}</div>
          <div style="font-size: 13px; color: #7f1d1d; margin-top: 2px;">Cliente: <strong>${item.clienteNombre}</strong> — Pactado: ${item.fechaPactada}</div>
        </div>
      `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resumen Matutino Disfraces EU</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    
    <!-- ENCABEZADO AZUL -->
    <div style="background: linear-gradient(135deg, #1d4ed8, #3b82f6); padding: 32px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background-color: rgba(255,255,255,0.2); width: 44px; height: 44px; line-height: 44px; border-radius: 12px; font-weight: 800; font-size: 20px; margin-bottom: 10px;">EU</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Disfraces EU</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Resumen Matutino de Operaciones — ${fecha}</p>
    </div>

    <div style="padding: 24px;">
      <!-- TARJETAS DE CONTEO -->
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
        <tr>
          <td width="48%" style="background-color: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;">Entregas Hoy</div>
            <div style="font-size: 32px; font-weight: 800; color: #065f46; margin: 4px 0;">${paraHoyCount}</div>
            <div style="font-size: 12px; color: #047857;">Recepciones programadas</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background-color: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.05em;">Atrasados</div>
            <div style="font-size: 32px; font-weight: 800; color: #991b1b; margin: 4px 0;">${atrasadosCount}</div>
            <div style="font-size: 12px; color: #b91c1c;">Por regularizar</div>
          </td>
        </tr>
      </table>

      <!-- LISTA DE ENTREGAS HOY -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 6px;">
          📋 Recepciones Agendadas para Hoy (${paraHoyCount})
        </h3>
        ${hoyItemsHtml}
      </div>

      <!-- LISTA DE ATRASADOS -->
      ${
        atrasadosCount > 0 ? `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #b91c1c; margin: 0 0 12px 0; border-bottom: 2px solid #ef4444; padding-bottom: 6px;">
            ⚠️ Casos Pendientes / Atrasados (${atrasadosCount})
          </h3>
          ${atrasadosItemsHtml}
        </div>
        ` : ''
      }

      <!-- BOTÓN DE ACCIÓN -->
      <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <a href="http://localhost:5174" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 10px rgba(37,99,235,0.2);">
          Abrir Panel de Control Disfraces EU
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      Plataforma de Gestión Disfraces EU — Sistema Automatizado de Alertas
    </div>
  </div>
</body>
</html>`;
};

export const buildOverdueAlertTemplate = (params) => {
  const { fecha, atrasadosCount = 0, detallesAtrasados = [] } = params || {};

  const atrasadosHtml = detallesAtrasados.length === 0
    ? `<div style="padding: 12px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b; font-style: italic;">No hay casos atrasados en este momento.</div>`
    : detallesAtrasados.map(item => `
        <div style="padding: 14px; background-color: #ffffff; border: 1px solid #fecaca; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; color: #0f172a;">
            <span>${item.disfrazNombre}</span>
            <span style="color: #dc2626;">Vencido: ${item.fechaPactada}</span>
          </div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">
            Cliente: <strong>${item.clienteNombre}</strong> (${item.clienteTelefono})
          </div>
          <div style="font-size: 12px; color: #047857; margin-top: 4px; font-weight: 700;">
            Garantía en Custodia: $${(item.montoGarantia || 0).toLocaleString('es-CL')} CLP
          </div>
        </div>
      `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Alerta Crítica - Disfraces EU</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(239,68,68,0.15); border: 1.5px solid #fca5a5;">
    
    <!-- ENCABEZADO ROJO ALERTA -->
    <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background-color: rgba(255,255,255,0.25); padding: 4px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
        ALERTA DE RETRASO CRÍTICO
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Devolución de Disfraz Vencida</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Emisión: ${fecha}</p>
    </div>

    <div style="padding: 24px;">
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #991b1b; font-weight: 600;">
        Se registran <strong>${atrasadosCount} arriendos</strong> cuya fecha pactada ha vencido sin haber recibido la prenda.
      </div>

      <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
        Detalle de Casos para Contactar por WhatsApp:
      </h3>

      ${atrasadosHtml}

      <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <a href="http://localhost:5174" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 15px; box-shadow: 0 4px 10px rgba(220,38,38,0.25);">
          Abrir Panel para Contactar Clientes
        </a>
      </div>
    </div>

    <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      Plataforma de Gestión Disfraces EU — Sistema Automatizado de Alertas
    </div>
  </div>
</body>
</html>`;
};
