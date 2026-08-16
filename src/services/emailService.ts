interface SendEmailOptions {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  smtpUser?: string;
  smtpPass?: string;
  type?: 'diario' | 'vencimiento' | 'alerta';
  payload?: any;
}

export const sendRealEmail = async (options: SendEmailOptions): Promise<{ success: boolean; message: string }> => {
  const envSmtpUser = import.meta.env.VITE_SMTP_USER || '';
  const envSmtpPass = import.meta.env.VITE_SMTP_PASS || '';

  const user = options.smtpUser || envSmtpUser;
  const pass = options.smtpPass || envSmtpPass;

  if (!options.to) {
    return { success: false, message: 'Falta especificar la dirección de correo de destino.' };
  }

  if (!user || !pass) {
    const mailtoUrl = `mailto:${encodeURIComponent(options.to)}?subject=${encodeURIComponent(options.subject)}&body=${encodeURIComponent(options.bodyText)}`;
    window.open(mailtoUrl, '_blank');

    return {
      success: false,
      message: 'Ingresa tu Correo Emisor y tu Contraseña de Aplicación de 16 caracteres en la pantalla de Alertas para envío 100% automático.',
    };
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smtpUser: user,
        smtpPass: pass,
        toEmail: options.to,
        subject: options.subject,
        textBody: options.bodyText,
        htmlBody: options.bodyHtml,
        type: options.type,
        payload: options.payload,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || `Correo enviado exitosamente a ${options.to} desde ${user}.`,
      };
    } else {
      return {
        success: false,
        message: data.error || 'No se pudo enviar el correo mediante la contraseña de aplicación.',
      };
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error de conexión con el servidor SMTP local';
    
    const mailtoUrl = `mailto:${encodeURIComponent(options.to)}?subject=${encodeURIComponent(options.subject)}&body=${encodeURIComponent(options.bodyText)}`;
    window.open(mailtoUrl, '_blank');

    return {
      success: false,
      message: `Error al conectar con servidor SMTP (${errorMessage}). Se abrió cliente mailto.`,
    };
  }
};
