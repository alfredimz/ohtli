import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import carriersData from '../mock-data/carriers.json';
import { Carrier, ParcelInput, QuoteOption } from '../models';
import { mockResponse } from './mock-http';

/**
 * Cotización de envíos. Simula `POST /api/quotes`: a partir de los datos del
 * paquete calcula las opciones disponibles de cada paquetería, aplicando un
 * recargo por peso volumétrico sobre la tarifa preferente de OHTLI.
 */
@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly carriers = carriersData as Carrier[];

  quote(parcel: ParcelInput): Observable<QuoteOption[]> {
    const surcharge = this.weightSurcharge(parcel);

    const options: QuoteOption[] = this.carriers.flatMap((carrier) =>
      carrier.services.map((service) => {
        const ohtliPrice = this.round(service.ohtliPrice + surcharge);
        const listPrice = this.round(service.listPrice + surcharge);
        return {
          id: `${carrier.id}-${service.type}`,
          carrierId: carrier.id,
          carrierName: carrier.name,
          carrierLogo: carrier.logo,
          serviceType: service.type,
          serviceLabel: service.label,
          days: service.days,
          listPrice,
          discount: service.discount,
          ohtliPrice,
        };
      }),
    );

    // Ordena de menor a mayor precio OHTLI (lo más relevante para el usuario).
    options.sort((a, b) => a.ohtliPrice - b.ohtliPrice);
    return mockResponse(options);
  }

  /** Recargo por peso facturable: 0 hasta 1 kg, +8 MXN por kg adicional. */
  private weightSurcharge(parcel: ParcelInput): number {
    const volumetric = (parcel.lengthCm * parcel.widthCm * parcel.heightCm) / 5000;
    const billable = Math.max(parcel.weightKg, volumetric);
    return Math.max(0, Math.ceil(billable - 1)) * 8;
  }

  private round(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /** Expone las paqueterías integradas (para textos informativos). */
  listCarriers(): Observable<Carrier[]> {
    return mockResponse(this.carriers, 200).pipe(map((c) => c));
  }
}
