import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import trackingData from '../mock-data/tracking.json';
import { TrackingInfo } from '../models';
import { mockLookup } from './mock-http';

/**
 * Rastreo de guías. Simula `GET /api/tracking/:guide`: busca la guía en los
 * datos mock y devuelve su historial de eventos, o un error 404 simulado si no
 * existe. Se ofrece de forma anónima (sin login), igual que en el rediseño.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly data = trackingData as TrackingInfo[];

  track(guide: string): Observable<TrackingInfo> {
    const normalized = guide.trim();
    const match = this.data.find((t) => t.guide === normalized);
    return mockLookup(match, `No se encontró la guía ${normalized}.`);
  }

  /** Guías de ejemplo para sugerir al usuario en la demo. */
  get sampleGuides(): string[] {
    return this.data.map((t) => t.guide);
  }
}
