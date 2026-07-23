import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ShipmentService } from './shipment.service';
import { Address, QuoteOption, Shipment } from '../models';

/**
 * Prueba el estado reactivo (signals) del borrador de envío y la contratación
 * simulada: selección de opción, cálculo del total, generación de guía y reset.
 */
describe('ShipmentService', () => {
  let service: ShipmentService;

  const option: QuoteOption = {
    id: 'redpack-terrestre',
    carrierId: 'redpack',
    carrierName: 'Redpack',
    carrierLogo: null,
    serviceType: 'terrestre',
    serviceLabel: 'Terrestre',
    days: '3-5',
    listPrice: 89,
    discount: 12,
    ohtliPrice: 78.32,
  };

  const address: Address = {
    fullName: 'Ana López',
    phone: '5512345678',
    street: 'Reforma',
    extNumber: '100',
    neighborhood: 'Centro',
    zip: '06000',
    city: 'CDMX',
    state: 'CDMX',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShipmentService);
  });

  it('arranca sin selección: total 0 y borrador vacío', () => {
    expect(service.hasSelection()).toBeFalse();
    expect(service.total()).toBe(0);
    expect(service.draft().parcel).toBeNull();
  });

  it('selectOption marca hasSelection y fija el total con el precio OHTLI', () => {
    service.selectOption(option);
    expect(service.hasSelection()).toBeTrue();
    expect(service.total()).toBe(78.32);
  });

  it('reset limpia el borrador', () => {
    service.selectOption(option);
    service.setPackageName('Regalo');
    service.reset();
    expect(service.hasSelection()).toBeFalse();
    expect(service.draft().packageName).toBe('');
  });

  it('contract genera una guía de 10 dígitos, guarda lastResult y resetea', fakeAsync(() => {
    service.selectOption(option);
    service.setOrigin(address);
    service.setDestination(address);

    let shipment!: Shipment;
    service.contract().subscribe((s) => (shipment = s));
    tick(900);

    expect(shipment.guide).toMatch(/^\d{10}$/);
    expect(shipment.total).toBe(78.32);
    expect(shipment.status).toBe('recoleccion');
    expect(service.lastResult()).toEqual(shipment);
    // Tras contratar, el borrador se reinicia para un nuevo envío.
    expect(service.hasSelection()).toBeFalse();
    expect(service.total()).toBe(0);
  }));

  it('getMyShipments devuelve el historial mock', fakeAsync(() => {
    let list: unknown[] = [];
    service.getMyShipments().subscribe((l) => (list = l));
    tick(600);
    expect(list.length).toBeGreaterThan(0);
  }));
});
