import { ShipmentSummary } from './shipment.service';

/**
 * Utilidades puras para las listas de envíos (Mis envíos, Búsqueda, Pedidos).
 * Implementan las funciones que el rediseño rescató del prototipo original
 * (barra Ordenar · elementos por página · Descargar), como lógica testeable
 * separada de los componentes.
 */

export type SortKey = 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes primero' },
  { value: 'date-asc', label: 'Más antiguos primero' },
  { value: 'total-desc', label: 'Mayor importe' },
  { value: 'total-asc', label: 'Menor importe' },
];

export function sortShipments(list: ShipmentSummary[], key: SortKey): ShipmentSummary[] {
  const sorted = [...list];
  switch (key) {
    case 'date-desc':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'date-asc':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case 'total-desc':
      return sorted.sort((a, b) => b.total - a.total);
    case 'total-asc':
      return sorted.sort((a, b) => a.total - b.total);
  }
}

export interface Page<T> {
  items: T[];
  page: number;       // página actual (1-indexada), acotada al rango válido
  pages: number;      // total de páginas (mínimo 1)
  total: number;      // total de elementos
}

export function paginate<T>(list: T[], page: number, pageSize: number): Page<T> {
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), page: current, pages, total: list.length };
}

/** Serializa la lista a CSV (cabecera + una fila por envío, comas escapadas). */
export function shipmentsToCsv(list: ShipmentSummary[]): string {
  const header = 'Guía,Paquetería,Servicio,Destino,Total (MXN),Fecha,Estatus';
  const escape = (v: string | number): string => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = list.map((s) =>
    [s.guide, s.carrierName, s.serviceLabel, s.destinationCity, s.total.toFixed(2), s.createdAt, s.status]
      .map(escape)
      .join(','),
  );
  return [header, ...rows].join('\n');
}

/** Dispara la descarga de un archivo generado en el cliente (CSV/HTML mock). */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob(['﻿' + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
