import { Injectable, signal } from '@angular/core';
import { Address } from '../models';

/** Dirección guardada en la libreta del usuario (sección «Mis datos»). */
export interface SavedAddress extends Address {
  id: string;
  alias: string;
}

/** Datos fiscales guardados (para prellenar la facturación). */
export interface FiscalData {
  rfc: string;
  businessName: string;
  cfdiUse: string;
  zip: string;
}

/** Método de pago guardado (solo marca + últimos 4, como haría un PSP real). */
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp: string;
}

let seq = 100;
const nextId = (prefix: string): string => `${prefix}-${seq++}`;

/**
 * Perfil del usuario: libreta de direcciones, datos fiscales y métodos de
 * pago (sección «Mis datos» del flujo 10). Estado en memoria con signals,
 * sembrado con datos mock; en producción sería `GET/PUT /api/profile`.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  readonly phone = signal<string>('55 1234 5678');

  readonly originAddresses = signal<SavedAddress[]>([
    {
      id: 'addr-1', alias: 'Oficina', fullName: 'Ana López', phone: '5512345678',
      street: 'Madero', extNumber: '12', neighborhood: 'Centro Histórico',
      zip: '06000', city: 'Cuauhtémoc', state: 'CDMX',
    },
  ]);

  readonly destinationAddresses = signal<SavedAddress[]>([
    {
      id: 'addr-2', alias: 'Cliente Monterrey', fullName: 'Luis Pérez', phone: '8187654321',
      street: 'Hidalgo', extNumber: '301', neighborhood: 'Obispado',
      zip: '64000', city: 'Monterrey', state: 'Nuevo León',
    },
  ]);

  readonly fiscal = signal<FiscalData | null>(null);

  readonly paymentMethods = signal<PaymentMethod[]>([
    { id: 'pm-1', brand: 'Visa', last4: '4242', exp: '12/27' },
  ]);

  addAddress(kind: 'origin' | 'destination', data: Omit<SavedAddress, 'id'>): void {
    const target = kind === 'origin' ? this.originAddresses : this.destinationAddresses;
    target.update((list) => [...list, { ...data, id: nextId('addr') }]);
  }

  removeAddress(kind: 'origin' | 'destination', id: string): void {
    const target = kind === 'origin' ? this.originAddresses : this.destinationAddresses;
    target.update((list) => list.filter((a) => a.id !== id));
  }

  saveFiscal(data: FiscalData): void {
    this.fiscal.set({ ...data });
  }

  addPaymentMethod(cardNumber: string, exp: string): void {
    const digits = cardNumber.replace(/\D/g, '');
    const brand = digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Tarjeta';
    this.paymentMethods.update((list) => [
      ...list,
      { id: nextId('pm'), brand, last4: digits.slice(-4), exp },
    ]);
  }

  removePaymentMethod(id: string): void {
    this.paymentMethods.update((list) => list.filter((m) => m.id !== id));
  }
}
