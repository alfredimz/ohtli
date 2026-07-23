import { TestBed } from '@angular/core/testing';
import { fakeAsync, tick } from '@angular/core/testing';
import { QuoteService } from './quote.service';
import { ParcelInput, QuoteOption } from '../models';

/**
 * Prueba la lógica de cotización, que es el único cálculo "de verdad" del
 * back-end simulado: recargo por peso facturable (el mayor entre peso real y
 * volumétrico) sobre la tarifa preferente OHTLI, y orden ascendente por precio.
 */
describe('QuoteService', () => {
  let service: QuoteService;

  const parcel = (over: Partial<ParcelInput> = {}): ParcelInput => ({
    kind: 'paquete',
    originZip: '01000',
    destinationZip: '64000',
    weightKg: 1,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    ...over,
  });

  const quoteSync = (input: ParcelInput): QuoteOption[] => {
    let result: QuoteOption[] = [];
    service.quote(input).subscribe((r) => (result = r));
    tick(600); // latencia simulada por defecto
    return result;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuoteService);
  });

  it('se crea', () => {
    expect(service).toBeTruthy();
  });

  it('devuelve las 7 opciones ordenadas de menor a mayor precio OHTLI', fakeAsync(() => {
    const result = quoteSync(parcel());
    expect(result.length).toBe(7); // Redpack 2 + FedEx 2 + DHL 2 + iVoy 1
    for (let i = 1; i < result.length; i++) {
      expect(result[i].ohtliPrice).toBeGreaterThanOrEqual(result[i - 1].ohtliPrice);
    }
    expect(result[0].id).toBe('redpack-terrestre'); // la más barata
  }));

  it('no aplica recargo para 1 kg y dimensiones pequeñas', fakeAsync(() => {
    const result = quoteSync(parcel());
    const redpackTerrestre = result.find((o) => o.id === 'redpack-terrestre')!;
    expect(redpackTerrestre.ohtliPrice).toBe(78.32); // precio base sin recargo
  }));

  it('cobra +8 MXN por cada kg adicional (peso real)', fakeAsync(() => {
    const base = quoteSync(parcel()).find((o) => o.id === 'redpack-terrestre')!.ohtliPrice;
    const heavy = quoteSync(parcel({ weightKg: 3 })).find((o) => o.id === 'redpack-terrestre')!
      .ohtliPrice;
    // ceil(3 - 1) = 2 kg adicionales → 2 × 8 = 16 MXN
    expect(heavy - base).toBe(16);
  }));

  it('usa el peso volumétrico cuando supera al peso real', fakeAsync(() => {
    // 50×40×30 / 5000 = 12 kg volumétricos frente a 2 kg reales → facturable 12
    const result = quoteSync(parcel({ weightKg: 2, lengthCm: 50, widthCm: 40, heightCm: 30 }));
    const redpackTerrestre = result.find((o) => o.id === 'redpack-terrestre')!;
    // ceil(12 - 1) = 11 → 11 × 8 = 88 MXN de recargo sobre 78.32
    expect(redpackTerrestre.ohtliPrice).toBe(78.32 + 88);
  }));

  it('lista las 4 paqueterías integradas', fakeAsync(() => {
    let carriers: unknown[] = [];
    service.listCarriers().subscribe((c) => (carriers = c));
    tick(200);
    expect(carriers.length).toBe(4);
  }));
});
