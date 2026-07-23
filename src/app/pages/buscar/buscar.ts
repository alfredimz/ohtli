import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShipmentService, ShipmentSummary } from '../../core/services/shipment.service';
import { BadgeComponent } from '../../shared/ui/badge';
import { ButtonComponent } from '../../shared/ui/button';

const STATUS_LABEL: Record<ShipmentSummary['status'], string> = {
  recoleccion: 'En recolección',
  en_camino: 'En camino',
  en_reparto: 'En reparto',
  entregado: 'Entregado',
};

/**
 * Búsqueda de envíos (flujo 05): búsqueda simple por texto (guía o destino) y
 * búsqueda avanzada con filtros combinables (estatus, paquetería, fechas).
 * Filtra el historial del usuario en el cliente (mock de `GET /api/shipments?q=`).
 */
@Component({
  selector: 'app-buscar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, BadgeComponent, ButtonComponent],
  template: `
    <section class="container page">
      <h2>Buscar envíos</h2>

      @if (!auth.isAuthenticated()) {
        <div class="gate">
          <p>Inicia sesión para buscar en tu historial de envíos.</p>
          <a routerLink="/auth/login"><app-button variant="secondary">Iniciar sesión</app-button></a>
        </div>
      } @else {
        <div class="searchbar">
          <input class="input" name="q" placeholder="Guía, destino o paquetería…"
                 [ngModel]="query()" (ngModelChange)="query.set($event)" />
          <button class="toggle" type="button" (click)="advanced.set(!advanced())">
            {{ advanced() ? 'Ocultar filtros' : 'Búsqueda avanzada' }}
          </button>
        </div>

        @if (advanced()) {
          <div class="filters">
            <div class="field">
              <label class="field__label" for="f-status">Estatus</label>
              <select id="f-status" class="select" [ngModel]="status()" (ngModelChange)="status.set($event)">
                <option value="">Todos</option>
                <option value="recoleccion">En recolección</option>
                <option value="en_camino">En camino</option>
                <option value="en_reparto">En reparto</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            <div class="field">
              <label class="field__label" for="f-carrier">Paquetería</label>
              <select id="f-carrier" class="select" [ngModel]="carrier()" (ngModelChange)="carrier.set($event)">
                <option value="">Todas</option>
                <option>Redpack</option>
                <option>FedEx</option>
                <option>DHL</option>
                <option>iVoy</option>
              </select>
            </div>
            <div class="field">
              <label class="field__label" for="f-from">Desde</label>
              <input id="f-from" class="input" type="date" [ngModel]="dateFrom()" (ngModelChange)="dateFrom.set($event)" />
            </div>
            <div class="field">
              <label class="field__label" for="f-to">Hasta</label>
              <input id="f-to" class="input" type="date" [ngModel]="dateTo()" (ngModelChange)="dateTo.set($event)" />
            </div>
          </div>
        }

        @if (loading()) {
          <div class="state">Buscando…</div>
        } @else if (results().length === 0) {
          <div class="state">Sin resultados con esos criterios. Ajusta la búsqueda o los filtros.</div>
        } @else {
          <p class="count">{{ results().length }} envío(s) encontrados</p>
          <div class="list">
            @for (s of results(); track s.guide) {
              <a class="item" [routerLink]="['/envios', s.guide]">
                <div class="item__main">
                  <span class="item__guide">Guía {{ s.guide }}</span>
                  <span class="item__meta">{{ s.carrierName }} · {{ s.serviceLabel }} → {{ s.destinationCity }}</span>
                  <span class="item__date">{{ s.createdAt | date:'mediumDate' }}</span>
                </div>
                <div class="item__side">
                  <app-badge [variant]="s.status === 'entregado' ? 'success' : 'info'">{{ label(s.status) }}</app-badge>
                  <span class="item__total">{{ s.total | currency:'MXN':'symbol-narrow' }}</span>
                </div>
              </a>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 820px; }
    .gate { background: $dimgray-light-1; border-radius: $rounded; padding: $space-5; text-align: center; }
    .gate p { margin-bottom: $space-3; }
    .searchbar { display: flex; gap: $space-2; margin: $space-3 0; }
    .searchbar .input { flex: 1; }
    .toggle { background: none; border: 1px solid $color-border; border-radius: $rounded-sm; color: $purple-regular;
              font-family: inherit; font-weight: $font-weight-semibold; padding: 0 $space-3; cursor: pointer; white-space: nowrap; }
    .filters { display: grid; gap: $space-3; grid-template-columns: 1fr 1fr; margin-bottom: $space-3;
               @include md { grid-template-columns: repeat(4, 1fr); } }
    .state { padding: $space-5; text-align: center; color: $color-text-secondary; background: $dimgray-light-1; border-radius: $rounded; }
    .count { color: $color-text-secondary; font-size: $font-size-body; }
    .list { display: flex; flex-direction: column; gap: $space-3; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: $space-3; flex-wrap: wrap;
            background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3;
            color: inherit; }
    .item:hover { text-decoration: none; border-color: $purple-light; box-shadow: $shadow-sm; }
    .item__main { display: flex; flex-direction: column; }
    .item__guide { font-weight: $font-weight-black; color: $purple-regular; }
    .item__meta { color: $color-text-secondary; font-size: $font-size-body; }
    .item__date { font-size: $font-size-micro; color: $color-text-disabled; }
    .item__side { display: flex; align-items: center; gap: $space-3; }
    .item__total { font-weight: $font-weight-black; }
    @include xs-only {
      .searchbar { flex-direction: column; }
      .toggle { padding: $space-2; }
      .item__side { width: 100%; justify-content: space-between; }
    }
  `],
})
export class BuscarPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly shipmentService = inject(ShipmentService);

  readonly loading = signal(true);
  readonly all = signal<ShipmentSummary[]>([]);
  readonly advanced = signal(false);

  readonly query = signal('');
  readonly status = signal('');
  readonly carrier = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly results = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.all().filter((s) => {
      if (q && ![s.guide, s.destinationCity, s.carrierName].some((v) => v.toLowerCase().includes(q))) return false;
      if (this.status() && s.status !== this.status()) return false;
      if (this.carrier() && s.carrierName !== this.carrier()) return false;
      if (this.dateFrom() && s.createdAt.slice(0, 10) < this.dateFrom()) return false;
      if (this.dateTo() && s.createdAt.slice(0, 10) > this.dateTo()) return false;
      return true;
    });
  });

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) { this.loading.set(false); return; }
    this.shipmentService.getMyShipments().subscribe((list) => {
      this.all.set(list);
      this.loading.set(false);
    });
  }

  label(status: ShipmentSummary['status']): string {
    return STATUS_LABEL[status];
  }
}
