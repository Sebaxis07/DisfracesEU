export type EstadoDisfraz = 'Disponible' | 'Arrendado' | 'Mantencion';

export type EstadoArriendo = 'Activo' | 'Devuelto' | 'Atrasado' | 'Dañado';

export type ResolucionGarantia = 'Devuelta' | 'Retenida_Total' | 'Retenida_Parcial';

export type TipoIncidente = 'Mancha' | 'Ruptura' | 'Accesorio_Faltante' | 'Perdida_Total' | 'Otro';

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

export interface IncidenteDano {
  id: string;
  arriendoId: string;
  disfrazId: string;
  clienteId: string;
  tipoIncidente: TipoIncidente;
  descripcion: string;
  fotoEvidenciaUrl?: string;
  montoGarantiaRetenida: number;
  montoGarantiaDevuelta: number;
  costoReparacionEstimado: number;
  fechaIncidente: string;
}

export interface Arriendo {
  id: string;
  clienteId: string;
  disfrazId: string;
  fechaRetiro: string;
  fechaPactada: string;
  fechaDevolucionReal?: string;
  montoArriendo: number;
  aplicaGarantia: boolean;
  montoGarantia: number;
  estado: EstadoArriendo;
  resolucionGarantia?: ResolucionGarantia;
  montoGarantiaRetenida?: number;
  fotoEntrega?: string;
  observaciones?: string;
  incidente?: IncidenteDano;
}

export interface ConfiguracionAlertas {
  emailDestino: string;
  smtpUser?: string;
  smtpPass?: string;
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

export type EstadoReserva = 'Confirmada' | 'Convertida' | 'Cancelada';

export interface Reserva {
  id: string;
  clienteId: string;
  disfrazId: string;
  fechaInicio: string;
  fechaFin: string;
  montoArriendo: number;
  montoAbono: number;
  saldoPendiente: number;
  estado: EstadoReserva;
  observaciones?: string;
  fechaCreacion: string;
}

export interface ComprobanteData {
  tipo: 'Arriendo' | 'Reserva' | 'Devolucion';
  folio: string;
  fechaEmision: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteDireccion?: string;
  disfrazNombre: string;
  disfrazTalla: string;
  disfrazCategoria: string;
  fechaInicio: string;
  fechaFin: string;
  montoArriendo: number;
  montoAbono?: number;
  montoGarantia: number;
  saldoPendiente?: number;
  observaciones?: string;
  firmaUrl?: string;
}

