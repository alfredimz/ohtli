import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import shipmentsData from '../mock-data/shipments.json';
import { Address, ParcelInput, QuoteOption, Shipment, ShipmentDraft } from '../models';
import { mockResponse } from './mock-http';
import { loadState, saveState } from './storage';

const EMPTY_DRAFT: ShipmentDraft = {
  parcel: null,
  selectedOption: null,
  packageName: '',
  origin: null,
  destination: null,
};

/** Resumen ligero de un envío para el listado "Mis envíos". */
export interface ShipmentSummary {
  guide: string;
  carrierName: string;
  serviceLabel: string;
  destinationCity: string;
  total: number;
  createdAt: string;
  status: Shipment['status'];
}

/**
 * Estado del envío en curso y contratación.
 *
 * El borrador (`draft`) vive en memoria como estado reactivo (signals) y se va
 * completando a lo largo del wizard Cotizar → Detalles → Revisión → Pago.
 * `contract()` simula `POST /api/shipments`, que en producción crearía la guía
 * en el back-end del transportista.
 */
@Injectable({ providedIn: 'root' })
export class ShipmentService {
  // Ambos estados se rehidratan de localStorage: recargar la página no pierde
  // el envío en curso ni la confirmación recién generada.
  private readonly draftSig = signal<ShipmentDraft>(loadState<ShipmentDraft>('draft') ?? { ...EMPTY_DRAFT });
  private readonly lastResultSig = signal<Shipment | null>(loadState<Shipment>('lastResult'));

  /** Borrador reactivo de solo lectura. */
  readonly draft = this.draftSig.asReadonly();

  /** Último envío contratado (para la pantalla de confirmación). */
  readonly lastResult = this.lastResultSig.asReadonly();

  /** Total a pagar del envío en curso (precio OHTLI de la opción elegida). */
  readonly total = computed(() => this.draftSig().selectedOption?.ohtliPrice ?? 0);

  /** ¿Hay una opción seleccionada? (guard de los pasos posteriores). */
  readonly hasSelection = computed(() => this.draftSig().selectedOption !== null);

  setParcel(parcel: ParcelInput): void {
    this.draftSig.update((d) => ({ ...d, parcel }));
    this.persistDraft();
  }

  selectOption(option: QuoteOption): void {
    this.draftSig.update((d) => ({ ...d, selectedOption: option }));
    this.persistDraft();
  }

  setPackageName(name: string): void {
    this.draftSig.update((d) => ({ ...d, packageName: name }));
    this.persistDraft();
  }

  setOrigin(origin: Address): void {
    this.draftSig.update((d) => ({ ...d, origin }));
    this.persistDraft();
  }

  setDestination(destination: Address): void {
    this.draftSig.update((d) => ({ ...d, destination }));
    this.persistDraft();
  }

  reset(): void {
    this.draftSig.set({ ...EMPTY_DRAFT });
    this.persistDraft();
  }

  private persistDraft(): void {
    saveState('draft', this.draftSig());
  }

  /** Simula la contratación del envío y devuelve la guía generada. */
  contract(): Observable<Shipment> {
    const d = this.draftSig();
    const shipment: Shipment = {
      guide: this.generateGuide(),
      carrierName: d.selectedOption?.carrierName ?? '—',
      serviceLabel: d.selectedOption?.serviceLabel ?? '—',
      origin: d.origin as Address,
      destination: d.destination as Address,
      total: this.total(),
      createdAt: new Date().toISOString(),
      status: 'recoleccion',
    };
    // Latencia algo mayor: emula el procesamiento del pago + alta de guía.
    return mockResponse(shipment, 900).pipe(
      tap((result) => {
        this.lastResultSig.set(result);
        saveState('lastResult', result);
        this.reset();
      }),
    );
  }

  /** Simula `GET /api/shipments` (historial del usuario). */
  getMyShipments(): Observable<ShipmentSummary[]> {
    return mockResponse(shipmentsData as ShipmentSummary[]);
  }

  private generateGuide(): string {
    return Math.floor(1_000_000_000 + Math.random() * 8_999_999_999).toString();
  }
}
