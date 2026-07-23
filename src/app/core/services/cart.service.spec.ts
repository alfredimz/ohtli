import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService (envíos por pagar)', () => {
  let cart: CartService;

  beforeEach(() => {
    localStorage.clear(); // aísla cada test del carrito persistido
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartService);
  });

  it('arranca sembrado con envíos de demostración y total consistente', () => {
    expect(cart.count()).toBeGreaterThan(0);
    const sum = cart.items().reduce((s, i) => s + i.option.ohtliPrice, 0);
    expect(cart.total()).toBeCloseTo(sum, 2);
  });

  it('duplicar crea una copia independiente marcada como (copia)', () => {
    const before = cart.count();
    const first = cart.items()[0];
    cart.duplicate(first.id);
    expect(cart.count()).toBe(before + 1);
    const copy = cart.items()[cart.count() - 1];
    expect(copy.id).not.toBe(first.id);
    expect(copy.packageName).toContain('(copia)');
  });

  it('eliminar quita el envío y actualiza el total', () => {
    const first = cart.items()[0];
    const before = cart.total();
    cart.remove(first.id);
    expect(cart.find(first.id)).toBeUndefined();
    expect(cart.total()).toBeCloseTo(before - first.option.ohtliPrice, 2);
  });

  it('editar actualiza descripción y peso sin tocar el resto', () => {
    const first = cart.items()[0];
    cart.updatePackage(first.id, 'Nueva descripción', 7);
    const updated = cart.find(first.id)!;
    expect(updated.packageName).toBe('Nueva descripción');
    expect(updated.parcel.weightKg).toBe(7);
    expect(updated.option.ohtliPrice).toBe(first.option.ohtliPrice);
  });
});
