import type { Cliente, Disfraz, Arriendo, IncidenteDano, ConfiguracionAlertas, NotificacionLog, TipoIncidente, Reserva } from '../types';

const STORAGE_KEYS = {
  CLIENTES: 'disfraces_eu_v2_clientes',
  DISFRACES: 'disfraces_eu_v2_disfraces',
  ARRIENDOS: 'disfraces_eu_v2_arriendos',
  INCIDENTES: 'disfraces_eu_v2_incidentes',
  CONFIG_ALERTAS: 'disfraces_eu_v2_config_alertas',
  NOTIFICACIONES: 'disfraces_eu_v2_notificaciones',
  RESERVAS: 'disfraces_eu_v2_reservas',
};

const API_BASE = '/api/db';

const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const generateId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;

export const StorageService = {
  // ==========================================
  // 1. DISFRACES
  // ==========================================
  getDisfraces: (): Disfraz[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DISFRACES);
    if (!data) return [];
    return JSON.parse(data);
  },

  fetchDisfracesAsync: async (): Promise<Disfraz[]> => {
    try {
      const res = await fetch(`${API_BASE}/disfraces`);
      if (res.ok) {
        const mapped: Disfraz[] = await res.json();
        localStorage.setItem(STORAGE_KEYS.DISFRACES, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('[API DISFRACES FETCH ERR]', err);
    }
    return StorageService.getDisfraces();
  },

  saveDisfrazAsync: async (disfraz: Omit<Disfraz, 'id' | 'fechaCreacion'> & { id?: string }): Promise<Disfraz> => {
    const disfraces = StorageService.getDisfraces();
    const nowStr = formatDate(new Date());

    try {
      const res = await fetch(`${API_BASE}/disfraces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disfraz),
      });

      if (res.ok) {
        const dbDisfraz: Disfraz = await res.json();

        const idx = disfraces.findIndex(d => d.id === dbDisfraz.id);
        if (idx !== -1) {
          disfraces[idx] = dbDisfraz;
        } else {
          disfraces.unshift(dbDisfraz);
        }
        localStorage.setItem(STORAGE_KEYS.DISFRACES, JSON.stringify(disfraces));
        return dbDisfraz;
      }
    } catch (err) {
      console.error('[POSTGRES SAVE DISFRAZ ERR]', err);
    }

    const fallback: Disfraz = { ...disfraz, id: disfraz.id || generateId('dis'), fechaCreacion: nowStr };
    disfraces.unshift(fallback);
    localStorage.setItem(STORAGE_KEYS.DISFRACES, JSON.stringify(disfraces));
    return fallback;
  },

  updateEstadoDisfrazAsync: async (id: string, estado: Disfraz['estado']) => {
    const disfraces = StorageService.getDisfraces();
    const index = disfraces.findIndex(d => d.id === id);
    if (index !== -1) {
      disfraces[index].estado = estado;
      localStorage.setItem(STORAGE_KEYS.DISFRACES, JSON.stringify(disfraces));

      try {
        await fetch(`${API_BASE}/disfraces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...disfraces[index], estado }),
        });
      } catch (err) {
        console.error('[DB SYNC ESTADO ERR]', err);
      }
    }
  },

  // ==========================================
  // 2. CLIENTES
  // ==========================================
  getClientes: (): Cliente[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    if (!data) return [];
    return JSON.parse(data);
  },

  fetchClientesAsync: async (): Promise<Cliente[]> => {
    try {
      const res = await fetch(`${API_BASE}/clientes`);
      if (res.ok) {
        const mapped: Cliente[] = await res.json();
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('[API CLIENTES FETCH ERR]', err);
    }
    return StorageService.getClientes();
  },

  saveClienteAsync: async (cliente: Omit<Cliente, 'id' | 'fechaRegistro'> & { id?: string }): Promise<Cliente> => {
    const clientes = StorageService.getClientes();
    const nowStr = formatDate(new Date());

    try {
      const res = await fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente),
      });

      if (res.ok) {
        const dbCliente: Cliente = await res.json();
        const existingIdx = clientes.findIndex(c => c.id === dbCliente.id);
        if (existingIdx !== -1) {
          clientes[existingIdx] = dbCliente;
        } else {
          clientes.unshift(dbCliente);
        }
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
        return dbCliente;
      }
    } catch (err) {
      console.error('[POSTGRES SAVE CLIENTE ERR]', err);
    }

    const fallback: Cliente = { ...cliente, id: cliente.id || generateId('cli'), fechaRegistro: nowStr };
    clientes.unshift(fallback);
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
    return fallback;
  },

  // ==========================================
  // 3. ARRIENDOS & DEVOLUCIONES CON DAÑOS
  // ==========================================
  getArriendos: (): Arriendo[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ARRIENDOS);
    if (!data) return [];
    const arriendos: Arriendo[] = JSON.parse(data);
    const hoyStr = formatDate(new Date());
    let modificado = false;
    arriendos.forEach(a => {
      if (a.estado === 'Activo' && a.fechaPactada < hoyStr) {
        a.estado = 'Atrasado';
        modificado = true;
      }
    });
    if (modificado) {
      localStorage.setItem(STORAGE_KEYS.ARRIENDOS, JSON.stringify(arriendos));
    }
    return arriendos;
  },

  fetchArriendosAsync: async (): Promise<Arriendo[]> => {
    try {
      const res = await fetch(`${API_BASE}/arriendos`);
      if (res.ok) {
        const mapped: Arriendo[] = await res.json();
        localStorage.setItem(STORAGE_KEYS.ARRIENDOS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('[API ARRIENDOS FETCH ERR]', err);
    }
    return StorageService.getArriendos();
  },

  saveArriendoAsync: async (arriendo: Omit<Arriendo, 'id'>): Promise<Arriendo> => {
    const arriendos = StorageService.getArriendos();

    try {
      const res = await fetch(`${API_BASE}/arriendos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arriendo),
      });

      if (res.ok) {
        const dbArriendo: Arriendo = await res.json();
        arriendos.unshift(dbArriendo);
        localStorage.setItem(STORAGE_KEYS.ARRIENDOS, JSON.stringify(arriendos));

        await StorageService.updateEstadoDisfrazAsync(arriendo.disfrazId, 'Arrendado');
        return dbArriendo;
      }
    } catch (err) {
      console.error('[POSTGRES SAVE ARRIENDO ERR]', err);
    }

    const fallback: Arriendo = { ...arriendo, id: generateId('arr') };
    arriendos.unshift(fallback);
    localStorage.setItem(STORAGE_KEYS.ARRIENDOS, JSON.stringify(arriendos));
    StorageService.updateEstadoDisfrazAsync(arriendo.disfrazId, 'Arrendado');
    return fallback;
  },

  finalizarDevolucionAsync: async (
    arriendoId: string,
    resolucionGarantia: Arriendo['resolucionGarantia'],
    montoGarantiaRetenida: number = 0,
    estadoGarment: 'Disponible' | 'Mantencion' = 'Disponible',
    observacionesDevolucion: string = '',
    incidentePayload?: {
      tipoIncidente: TipoIncidente;
      descripcion: string;
      fotoEvidenciaUrl?: string;
      montoGarantiaDevuelta: number;
      costoReparacionEstimado: number;
    }
  ): Promise<Arriendo | null> => {
    const arriendos = StorageService.getArriendos();
    const index = arriendos.findIndex(a => a.id === arriendoId);
    if (index === -1) return null;

    try {
      const res = await fetch(`${API_BASE}/devolucion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arriendoId,
          resolucionGarantia,
          montoGarantiaRetenida,
          estadoGarment,
          observacionesDevolucion,
          incidente: incidentePayload,
        }),
      });

      if (res.ok) {
        const dbArriendo: Arriendo = await res.json();
        arriendos[index] = dbArriendo;
        localStorage.setItem(STORAGE_KEYS.ARRIENDOS, JSON.stringify(arriendos));

        await StorageService.updateEstadoDisfrazAsync(dbArriendo.disfrazId, estadoGarment);
        return dbArriendo;
      }
    } catch (err) {
      console.error('[POSTGRES DEVOLUCION ERR]', err);
    }

    const hoyStr = formatDate(new Date());
    const arriendo = arriendos[index];
    arriendo.estado = (resolucionGarantia === 'Retenida_Total' || resolucionGarantia === 'Retenida_Parcial') ? 'Dañado' : 'Devuelto';
    arriendo.fechaDevolucionReal = hoyStr;
    arriendo.resolucionGarantia = resolucionGarantia;
    arriendo.montoGarantiaRetenida = montoGarantiaRetenida;
    localStorage.setItem(STORAGE_KEYS.ARRIENDOS, JSON.stringify(arriendos));
    StorageService.updateEstadoDisfrazAsync(arriendo.disfrazId, estadoGarment);
    return arriendo;
  },

  // ==========================================
  // 4. INCIDENTES DE DAÑO Y MANTENCIÓN
  // ==========================================
  getIncidentes: (): IncidenteDano[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INCIDENTES);
    if (!data) return [];
    return JSON.parse(data);
  },

  fetchIncidentesAsync: async (): Promise<IncidenteDano[]> => {
    try {
      const res = await fetch(`${API_BASE}/incidentes`);
      if (res.ok) {
        const mapped: IncidenteDano[] = await res.json();
        localStorage.setItem(STORAGE_KEYS.INCIDENTES, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('[API INCIDENTES FETCH ERR]', err);
    }
    return StorageService.getIncidentes();
  },

  // 5. Configuración Alertas
  getConfigAlertas: (): ConfiguracionAlertas => {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG_ALERTAS);
    if (!data) {
      const defaultConfig: ConfiguracionAlertas = {
        emailDestino: '',
        avisoDiarioMatutino: true,
        alertaInmediataVencimiento: true,
        reporteSemanal: true,
      };
      localStorage.setItem(STORAGE_KEYS.CONFIG_ALERTAS, JSON.stringify(defaultConfig));
      return defaultConfig;
    }
    return JSON.parse(data);
  },

  saveConfigAlertas: (config: ConfiguracionAlertas) => {
    localStorage.setItem(STORAGE_KEYS.CONFIG_ALERTAS, JSON.stringify(config));
  },

  // 6. Notificaciones Log
  getNotificaciones: (): NotificacionLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICACIONES);
    if (!data) return [];
    return JSON.parse(data);
  },

  marcarNotificacionLeida: (id: string) => {
    const notifs = StorageService.getNotificaciones();
    const index = notifs.findIndex(n => n.id === id);
    if (index !== -1) {
      notifs[index].leida = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICACIONES, JSON.stringify(notifs));
    }
  },

  addNotificacion: (notif: Omit<NotificacionLog, 'id' | 'fecha' | 'leida'>) => {
    const notifs = StorageService.getNotificaciones();
    const now = new Date();
    const fechaStr = `${formatDate(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNotif: NotificacionLog = {
      ...notif,
      id: generateId('notif'),
      fecha: fechaStr,
      leida: false,
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICACIONES, JSON.stringify(notifs));
    return newNotif;
  },

  // 7. RESERVAS
  getReservas: (): Reserva[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RESERVAS);
    if (!data) return [];
    return JSON.parse(data);
  },

  fetchReservasAsync: async (): Promise<Reserva[]> => {
    try {
      const res = await fetch(`${API_BASE}/reservas`);
      if (res.ok) {
        const mapped: Reserva[] = await res.json();
        localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.error('[API RESERVAS FETCH ERR]', err);
    }
    return StorageService.getReservas();
  },

  saveReservaAsync: async (reservaData: Omit<Reserva, 'id' | 'fechaCreacion' | 'estado'> & { id?: string; estado?: Reserva['estado'] }): Promise<Reserva> => {
    const reservas = StorageService.getReservas();
    const nowStr = formatDate(new Date());

    const newReserva: Reserva = {
      id: reservaData.id || generateId('res'),
      clienteId: reservaData.clienteId,
      disfrazId: reservaData.disfrazId,
      fechaInicio: reservaData.fechaInicio,
      fechaFin: reservaData.fechaFin,
      montoArriendo: reservaData.montoArriendo,
      montoAbono: reservaData.montoAbono,
      saldoPendiente: reservaData.saldoPendiente,
      estado: reservaData.estado || 'Confirmada',
      observaciones: reservaData.observaciones,
      fechaCreacion: nowStr,
    };

    try {
      const res = await fetch(`${API_BASE}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReserva),
      });

      if (res.ok) {
        const dbRes = await res.json();
        const idx = reservas.findIndex(r => r.id === dbRes.id);
        if (idx !== -1) {
          reservas[idx] = dbRes;
        } else {
          reservas.unshift(dbRes);
        }
        localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));
        return dbRes;
      }
    } catch (err) {
      console.error('[POSTGRES SAVE RESERVA ERR]', err);
    }

    const idx = reservas.findIndex(r => r.id === newReserva.id);
    if (idx !== -1) {
      reservas[idx] = newReserva;
    } else {
      reservas.unshift(newReserva);
    }
    localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));
    return newReserva;
  },

  updateEstadoReservaAsync: async (id: string, estado: Reserva['estado']) => {
    const reservas = StorageService.getReservas();
    const index = reservas.findIndex(r => r.id === id);
    if (index !== -1) {
      reservas[index].estado = estado;
      localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));

      try {
        await fetch(`${API_BASE}/reservas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, estado }),
        });
      } catch (err) {
        console.error('[DB SYNC ESTADO RESERVA ERR]', err);
      }
    }
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};
