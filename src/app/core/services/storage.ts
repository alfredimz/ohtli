/**
 * Persistencia ligera en localStorage. El estado mock de la app (sesión,
 * carrito, borrador del wizard) sobrevive a la recarga de la página — clave
 * para el test SUS: recargar sin querer no pierde el avance del participante.
 * Todas las operaciones son tolerantes a fallos (modo incógnito, cuota llena).
 */

const PREFIX = 'ohtli.';

export function loadState<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveState(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando en memoria */
  }
}

export function clearState(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignorar */
  }
}
