import { paginate, shipmentsToCsv, sortShipments } from './list-utils';
import { ShipmentSummary } from './shipment.service';

const LIST: ShipmentSummary[] = [
  { guide: 'A', carrierName: 'Redpack', serviceLabel: 'Terrestre', destinationCity: 'Querétaro, QRO', total: 78.32, createdAt: '2026-06-26T08:30:00', status: 'en_camino' },
  { guide: 'B', carrierName: 'FedEx', serviceLabel: 'Express', destinationCity: 'Monterrey, NL', total: 200.9, createdAt: '2026-06-24T09:10:00', status: 'entregado' },
  { guide: 'C', carrierName: 'DHL', serviceLabel: 'Estándar', destinationCity: 'Mérida, YUC', total: 141.96, createdAt: '2026-06-20T16:00:00', status: 'entregado' },
];

describe('list-utils (ordenar · paginar · CSV)', () => {
  it('ordena por fecha descendente (más recientes primero)', () => {
    expect(sortShipments(LIST, 'date-desc').map((s) => s.guide)).toEqual(['A', 'B', 'C']);
  });

  it('ordena por importe ascendente sin mutar la lista original', () => {
    const result = sortShipments(LIST, 'total-asc');
    expect(result.map((s) => s.guide)).toEqual(['A', 'C', 'B']);
    expect(LIST[0].guide).toBe('A'); // la original queda intacta
  });

  it('pagina acotando la página al rango válido', () => {
    const page = paginate(LIST, 99, 2);
    expect(page.page).toBe(2);
    expect(page.pages).toBe(2);
    expect(page.items.map((s) => s.guide)).toEqual(['C']);
  });

  it('una lista vacía produce 1 página sin elementos', () => {
    const page = paginate([], 1, 10);
    expect(page.pages).toBe(1);
    expect(page.items).toEqual([]);
  });

  it('genera CSV con cabecera y una fila por envío, escapando comas', () => {
    const csv = shipmentsToCsv([LIST[0]]);
    const lines = csv.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('Guía');
    expect(lines[1]).toContain('"Querétaro, QRO"'); // la coma obliga a comillas
  });
});
