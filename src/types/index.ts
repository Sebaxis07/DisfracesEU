export type EstadoDisfraz = 'Disponible' | 'Arrendado' | 'Mantencion';

export type EstadoArriendo = 'Activo' | 'Devuelto' | 'Atrasado' | 'Dañado';

export type ResolucionGarantia = 'Devuelta' | 'Retenida_Total' | 'Retenida_Parcial';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  notas: string;
  fechaRegistro: string;
}

export interface Disfraz {
  id: string;
  nombre: string;
  categoria: string;
  talla: string;
  precioSugerido: number;
  garantiaSugerida: number;
  estado: EstadoDisfraz;
  fotoUrl?: string;
  fechaCreacion: string;
}

export interface Arriendo {
  id: string;
  clienteId: string;
  disfrazId: string;
  fechaRetiro: string; // YYYY-MM-DD
  fechaPactada: string; // YYYY-MM-DD
  fechaDevolucionReal?: string; // YYYY-MM-DD
  montoArriendo: number;
  aplicaGarantia: boolean;
  montoGarantia: number;
  estado: EstadoArriendo;
  resolucionGarantia?: ResolucionGarantia;
  montoGarantiaRetenida?: number;
  fotoEntrega?: string;
  observaciones?: string;
}

export interface ConfiguracionAlertas {
  emailDestino: string;
  smtpUser?: string;       // Correo emisor (ej: mi.correo@gmail.com)
  smtpPass?: string;       // Contraseña de aplicación de 16 caracteres
  avisoDiarioMatutino: boolean;
  alertaInmediataVencimiento: boolean;
  reporteSemanal: boolean;
}

export interface NotificacionLog {
  id: string;
  arriendoId?: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: 'vencimiento' | 'diario' | 'alerta';
}
