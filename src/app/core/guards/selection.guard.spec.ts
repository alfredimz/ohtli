import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { selectionGuard } from './selection.guard';
import { ShipmentService } from '../services/shipment.service';
import { QuoteOption } from '../models';

/**
 * Prueba el guard que protege los pasos del flujo: sin opción seleccionada
 * redirige al inicio; con una opción, permite el paso. No es autenticación.
 */
describe('selectionGuard', () => {
  let shipment: ShipmentService;

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

  const run = () =>
    TestBed.runInInjectionContext(() =>
      selectionGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { createUrlTree: (c: unknown[]) => ({ commands: c }) as unknown as UrlTree } }] });
    shipment = TestBed.inject(ShipmentService);
  });

  it('redirige al inicio si no hay opción seleccionada', () => {
    const result = run();
    expect(result).not.toBe(true);
    expect((result as unknown as { commands: unknown[] }).commands).toEqual(['/']);
  });

  it('permite el paso cuando hay una opción seleccionada', () => {
    shipment.selectOption(option);
    expect(run()).toBe(true);
  });
});
