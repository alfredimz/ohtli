import { Injectable, computed, signal } from '@angular/core';
import { Address, ParcelInput, QuoteOption } from '../models';
import { loadState, saveState } from './storage';

/** Envío pendiente de pagar en el carrito (flujo «Envíos por pagar»). */
export interface CartItem {
  id: string;
  packageName: string;
  parcel: ParcelInput;
  option: QuoteOption;
  origin: Address;
  destination: Address;
}

let seq = 1;
// El sufijo temporal evita colisiones con ids rehidratados de localStorage.
const nextId = (): string => `cart-${Date.now().toString(36)}-${seq++}`;

const DEMO_OPTION: QuoteOption = {
  id: 'redpack-terrestre', carrierId: 'redpack', carrierName: 'Redpack',
  carrierLogo: '/assets/img/logo-redpack-normal.svg', serviceType: 'terrestre',
  serviceLabel: 'Terrestre', days: '3-5', listPrice: 89, discount: 12, ohtliPrice: 78.32,
};

const DEMO_OPTION_2: QuoteOption = {
  id: 'dhl-estandar', carrierId: 'dhl', carrierName: 'DHL', carrierLogo: null,
  serviceType: 'estandar', serviceLabel: 'Estándar', days: '2-4',
  listPrice: 169, discount: 16, ohtliPrice: 141.96,
};

const DEMO_ORIGIN: Address = {
  fullName: 'Ana López', phone: '5512345678', street: 'Madero', extNumber: '12',
  neighborhood: 'Centro Histórico', zip: '06000', city: 'Cuauhtémoc', state: 'CDMX',
};

const DEMO_DEST: Address = {
  fullName: 'Luis Pérez', phone: '8187654321', street: 'Hidalgo', extNumber: '301',
  neighborhood: 'Obispado', zip: '64000', city: 'Monterrey', state: 'Nuevo León',
};

const DEMO_DEST_2: Address = {
  fullName: 'María Chan', phone: '9991112233', street: 'Calle 60', extNumber: '445',
  neighborhood: 'Centro', zip: '97000', city: 'Mérida', state: 'Yucatán',
};

/**
 * Carrito de envíos por pagar (flujo 06). Estado mock en el cliente: permite
 * acumular varios envíos cotizados y pagarlos uno a uno reutilizando el wizard
 * (Pagar carga el envío en el borrador y continúa en Revisión → Pago).
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  // Rehidrata el carrito guardado; si nunca se ha guardado, siembra los demos.
  private readonly itemsSig = signal<CartItem[]>(
    loadState<CartItem[]>('cart') ?? [
      {
        id: nextId(), packageName: 'Caja mediana — repuestos', option: DEMO_OPTION,
        parcel: { kind: 'paquete', originZip: '06000', destinationZip: '64000', weightKg: 3, lengthCm: 30, widthCm: 25, heightCm: 20 },
        origin: DEMO_ORIGIN, destination: DEMO_DEST,
      },
      {
        id: nextId(), packageName: 'Sobre — documentos legales', option: DEMO_OPTION_2,
        parcel: { kind: 'sobre', originZip: '06000', destinationZip: '97000', weightKg: 0.5, lengthCm: 35, widthCm: 25, heightCm: 2 },
        origin: DEMO_ORIGIN, destination: DEMO_DEST_2,
      },
    ],
  );

  readonly items = this.itemsSig.asReadonly();
  readonly count = computed(() => this.itemsSig().length);
  readonly total = computed(() => this.itemsSig().reduce((sum, i) => sum + i.option.ohtliPrice, 0));

  add(item: Omit<CartItem, 'id'>): void {
    this.itemsSig.update((list) => [...list, { ...item, id: nextId() }]);
    this.persist();
  }

  duplicate(id: string): void {
    this.itemsSig.update((list) => {
      const source = list.find((i) => i.id === id);
      if (!source) return list;
      return [...list, { ...structuredClone(source), id: nextId(), packageName: `${source.packageName} (copia)` }];
    });
    this.persist();
  }

  remove(id: string): void {
    this.itemsSig.update((list) => list.filter((i) => i.id !== id));
    this.persist();
  }

  updatePackage(id: string, packageName: string, weightKg: number): void {
    this.itemsSig.update((list) =>
      list.map((i) => (i.id === id ? { ...i, packageName, parcel: { ...i.parcel, weightKg } } : i)),
    );
    this.persist();
  }

  private persist(): void {
    saveState('cart', this.itemsSig());
  }

  find(id: string): CartItem | undefined {
    return this.itemsSig().find((i) => i.id === id);
  }
}
