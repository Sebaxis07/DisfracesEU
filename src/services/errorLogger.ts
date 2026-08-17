export type CategoriaError = 'Base de Datos' | 'Red / Conexión' | 'Diseño / UI' | 'Lógica / Operación';

export interface LoggedError {
  id: string;
  categoria: CategoriaError;
  nivel: 'Crítico' | 'Advertencia' | 'Red';
  mensaje: string;
  moduloActual: string;
  stack?: string;
  url?: string;
  fecha: string;
}

const ERROR_BUFFER_KEY = 'disfraces_eu_error_logs';
const TARGET_EMAIL = 'dpastora98@gmail.com';
const API_REPORT_URL = '/api/report-issue';

class ErrorLoggerService {
  private activeModule: string = 'General';
  private recentErrors: LoggedError[] = [];

  constructor() {
    this.loadFromStorage();
    this.setupGlobalListeners();
  }

  public setActiveModule(moduleName: string) {
    this.activeModule = moduleName;
  }

  public getRecentErrors(): LoggedError[] {
    return this.recentErrors;
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(ERROR_BUFFER_KEY);
      if (data) {
        this.recentErrors = JSON.parse(data);
      }
    } catch {
      this.recentErrors = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(ERROR_BUFFER_KEY, JSON.stringify(this.recentErrors.slice(0, 30)));
    } catch (e) {
      console.error('[ERROR LOGGER SAVE FAIL]', e);
    }
  }

  public logError(
    rawMessage: string,
    forcedCategory?: CategoriaError,
    stackTrace?: string,
    url?: string
  ) {
    const { categoria, nivel } = forcedCategory
      ? { categoria: forcedCategory, nivel: forcedCategory === 'Base de Datos' ? 'Crítico' as const : forcedCategory === 'Red / Conexión' ? 'Red' as const : 'Advertencia' as const }
      : this.categorize(rawMessage, url);

    const now = new Date();
    const newError: LoggedError = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      categoria,
      nivel,
      mensaje: rawMessage,
      moduloActual: this.activeModule,
      stack: stackTrace,
      url,
      fecha: now.toLocaleString('es-CL'),
    };

    this.recentErrors.unshift(newError);
    this.saveToStorage();

    // Si es un problema Crítico de Base de Datos o Red, enviar email automático
    if (categoria === 'Base de Datos' || categoria === 'Red / Conexión') {
      this.sendEmailAlert(newError, 'AUTOMÁTICO');
    }

    return newError;
  }

  private categorize(msg: string, url?: string): { categoria: CategoriaError; nivel: 'Crítico' | 'Advertencia' | 'Red' } {
    const lowerMsg = (msg + ' ' + (url || '')).toLowerCase();

    if (
      lowerMsg.includes('/api/db') ||
      lowerMsg.includes('postgres') ||
      lowerMsg.includes('supabase') ||
      lowerMsg.includes('database') ||
      lowerMsg.includes('sql') ||
      lowerMsg.includes('relation') ||
      lowerMsg.includes('500')
    ) {
      return { categoria: 'Base de Datos', nivel: 'Crítico' };
    }

    if (
      lowerMsg.includes('502') ||
      lowerMsg.includes('bad gateway') ||
      lowerMsg.includes('failed to fetch') ||
      lowerMsg.includes('networkerror') ||
      lowerMsg.includes('econnrefused') ||
      lowerMsg.includes('offline')
    ) {
      return { categoria: 'Red / Conexión', nivel: 'Red' };
    }

    if (
      lowerMsg.includes('css') ||
      lowerMsg.includes('style') ||
      lowerMsg.includes('render') ||
      lowerMsg.includes('layout') ||
      lowerMsg.includes('element') ||
      lowerMsg.includes('react') ||
      lowerMsg.includes('undefined is not an object')
    ) {
      return { categoria: 'Diseño / UI', nivel: 'Advertencia' };
    }

    return { categoria: 'Lógica / Operación', nivel: 'Advertencia' };
  }

  private setupGlobalListeners() {
    if (typeof window === 'undefined') return;

    // 1. Interceptar excepciones JS no capturadas
    window.addEventListener('error', (event) => {
      this.logError(
        event.message || 'Error no controlado en la aplicación',
        undefined,
        event.error?.stack,
        event.filename
      );
    });

    // 2. Interceptar Promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message || 'Promesa rechazada sin manejar';
      this.logError(msg, undefined, reason?.stack);
    });

    // 3. Interceptar fetch nativo para detectar 500 y 502
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 500) {
          const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
          this.logError(
            `Fallo de API HTTP ${response.status} (${response.statusText}) en ${urlStr}`,
            response.status === 500 ? 'Base de Datos' : 'Red / Conexión',
            undefined,
            urlStr
          );
        }
        return response;
      } catch (err: any) {
        const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        this.logError(
          `Fallo de Red en Petición Fetch: ${err.message || err}`,
          'Red / Conexión',
          err.stack,
          urlStr
        );
        throw err;
      }
    };
  }

  public async sendEmailAlert(
    errorObj: LoggedError,
    origen: 'AUTOMÁTICO' | 'MANUAL_DUEÑA',
    mensajeDueña?: string,
    moduloSeleccionado?: string
  ) {
    try {
      await fetch(API_REPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destino: TARGET_EMAIL,
          origen,
          categoria: errorObj.categoria,
          nivel: errorObj.nivel,
          mensaje: errorObj.mensaje,
          moduloActual: moduloSeleccionado || errorObj.moduloActual,
          mensajeDueña,
          stack: errorObj.stack,
          url: errorObj.url,
          fecha: errorObj.fecha,
          historialErrores: this.recentErrors.slice(0, 5),
        }),
      });
    } catch (err) {
      console.error('[EMAIL ALERT FETCH FAIL]', err);
    }
  }
}

export const errorLogger = new ErrorLoggerService();
