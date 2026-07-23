import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';

/**
 * Simulación de un back-end REST.
 *
 * OHTLI no cuenta con un back-end propio en este TFM: toda la lógica que en
 * producción resolvería un servidor (cotizar tarifas, contratar una guía,
 * consultar rastreo, autenticar) se simula en el cliente. En lugar de llamar a
 * `HttpClient` contra una URL real, cada servicio devuelve los datos mock
 * envueltos por estas funciones, que reproducen el comportamiento asíncrono de
 * una API: latencia de red variable y la posibilidad de una respuesta de error.
 *
 * Se eligió este enfoque (servicios Angular + RxJS sobre datos JSON) frente a
 * alternativas como json-server o in-memory-web-api porque no añade procesos ni
 * dependencias externas, mantiene el contrato `Observable<T>` idéntico al de
 * `HttpClient` —de modo que sustituir el mock por llamadas reales en el futuro
 * es transparente para los componentes— y deja la lógica de negocio simulada
 * explícita y versionada junto al resto del código.
 */

/** Latencia simulada por defecto (ms) para imitar una llamada de red. */
const DEFAULT_LATENCY = 600;

/** Respuesta correcta simulada: emite `data` tras una latencia de red. */
export function mockResponse<T>(data: T, latencyMs: number = DEFAULT_LATENCY): Observable<T> {
  // structuredClone evita que los componentes muten los datos mock originales.
  return of(structuredClone(data)).pipe(delay(latencyMs));
}

/** Respuesta condicional: si `data` es null/undefined, simula un 404. */
export function mockLookup<T>(
  data: T | null | undefined,
  notFoundMessage = 'Recurso no encontrado (404 simulado)',
  latencyMs: number = DEFAULT_LATENCY,
): Observable<T> {
  return of(data).pipe(
    delay(latencyMs),
    mergeMap((value) =>
      value == null
        ? throwError(() => new Error(notFoundMessage))
        : of(structuredClone(value) as T),
    ),
  );
}
