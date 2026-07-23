import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TrackingService } from './tracking.service';
import { TrackingInfo } from '../models';

/**
 * Prueba el rastreo de guías: encuentra guías existentes, normaliza espacios y
 * emite un error 404 simulado cuando la guía no existe.
 */
describe('TrackingService', () => {
  let service: TrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackingService);
  });

  it('expone guías de ejemplo para la demo', () => {
    expect(service.sampleGuides.length).toBeGreaterThan(0);
  });

  it('devuelve el historial de una guía existente', fakeAsync(() => {
    const guide = service.sampleGuides[0];
    let info!: TrackingInfo;
    service.track(guide).subscribe((i) => (info = i));
    tick(600);
    expect(info.guide).toBe(guide);
    expect(info.events.length).toBeGreaterThan(0);
  }));

  it('ignora los espacios alrededor de la guía', fakeAsync(() => {
    const guide = service.sampleGuides[0];
    let info!: TrackingInfo;
    service.track('  ' + guide + '  ').subscribe((i) => (info = i));
    tick(600);
    expect(info.guide).toBe(guide);
  }));

  it('emite un error 404 simulado para una guía inexistente', fakeAsync(() => {
    let message = '';
    service.track('0000000000').subscribe({ error: (e: Error) => (message = e.message) });
    tick(600);
    expect(message).toContain('0000000000');
  }));
});
