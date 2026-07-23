import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import pedidosData from '../../core/mock-data/pedidos.json';
import { AuthService } from '../../core/services/auth.service';
import {
  SORT_OPTIONS, SortKey, downloadFile, paginate, shipmentsToCsv, sortShipments,
} from '../../core/services/list-utils';
import { ShipmentSummary } from '../../core/services/shipment.service';
import { BadgeComponent } from '../../shared/ui/badge';
import { ButtonComponent } from '../../shared/ui/button';

/** Pedido global visto por el administrador (envío + cliente). */
interface Pedido extends ShipmentSummary {
  client: string;
}

const STATUS_LABEL: Record<ShipmentSummary['status'], string> = {
  recoleccion: 'En recolección',
  en_camino: 'En camino',
  en_reparto: 'En reparto',
  entregado: 'Entregado',
};

/**
 * Pedidos para administradores (flujo 11). Lista global de pedidos de todos
 * los clientes (mock) con la barra Ordenar · Por página · Descargar CSV y
 * cambio de estatus por pedido. Acceso solo con rol admin (correo `admin@…`).
 */
@Component({
  selector: 'app-admin-pedidos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, BadgeComponent, ButtonComponent],
  template: `
    <section class="container page">
      <h2>Pedidos <span class="tag">Administrador</span></h2>

      @if (!auth.isAdmin()) {
        <div class="gate">
          <p>Esta sección es solo para administradores.</p>
          <p class="hint">Demo: inicia sesión con un correo <strong>admin&#64;…</strong> (p. ej. admin&#64;ohtli.mx) para activar el rol.</p>
          <a routerLink="/auth/login"><app-button variant="secondary">Iniciar sesión</app-button></a>
        </div>
      } @else {
        <p class="sub">{{ pedidos().length }} pedidos de todos los clientes</p>

        <div class="toolbar">
          <label class="tb">
            <span class="tb__label">Ordenar</span>
            <select class="select" [value]="sort()" (change)="onSort($event)">
              @for (o of sortOptions; track o.value) { <option [value]="o.value">{{ o.label }}</option> }
            </select>
          </label>
          <label class="tb">
            <span class="tb__label">Por página</span>
            <select class="select" [value]="pageSize()" (change)="onPageSize($event)">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="25">25</option>
            </select>
          </label>
          <button type="button" class="download" (click)="downloadCsv()">Descargar CSV</button>
        </div>

        <div class="list">
          @for (p of paged().items; track p.guide) {
            <article class="item">
              <div class="item__main">
                <span class="item__guide">Guía {{ p.guide }}</span>
                <span class="item__client">{{ p.client }}</span>
                <span class="item__meta">{{ p.carrierName }} · {{ p.serviceLabel }} → {{ p.destinationCity }}</span>
                <span class="item__date">{{ p.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="item__side">
                <app-badge [variant]="p.status === 'entregado' ? 'success' : 'info'">{{ label(p.status) }}</app-badge>
                <span class="item__total">{{ p.total | currency:'MXN':'symbol-narrow' }}</span>
                <label class="status">
                  <span class="tb__label">Cambiar estatus</span>
                  <select class="select" [value]="p.status" (change)="onStatus(p.guide, $event)">
                    <option value="recoleccion">En recolección</option>
                    <option value="en_camino">En camino</option>
                    <option value="en_reparto">En reparto</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </label>
              </div>
            </article>
          }
        </div>

        @if (paged().pages > 1) {
          <nav class="pager" aria-label="Paginación">
            <button type="button" class="pager__btn" [disabled]="paged().page === 1" (click)="prev()">‹ Anterior</button>
            <span>Página {{ paged().page }} de {{ paged().pages }}</span>
            <button type="button" class="pager__btn" [disabled]="paged().page === paged().pages" (click)="next()">Siguiente ›</button>
          </nav>
        }
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 860px; }
    .tag { font-size: $font-size-micro; background: $orange-dark; color: $white; border-radius: $rounded-full;
           padding: 2px $space-2; vertical-align: middle; letter-spacing: .04em; text-transform: uppercase; }
    .sub { color: $color-text-secondary; margin: $space-2 0 0; }
    .gate { background: $dimgray-light-1; border-radius: $rounded; padding: $space-5; text-align: center; }
    .gate p { margin-bottom: $space-2; }
    .gate .hint { color: $color-text-secondary; font-size: $font-size-body; margin-bottom: $space-3; }

    .toolbar { display: flex; align-items: end; gap: $space-3; margin: $space-3 0; flex-wrap: wrap; }
    .tb { display: flex; flex-direction: column; gap: $space-1; }
    .tb__label { font-size: $font-size-micro; color: $color-text-secondary; font-weight: $font-weight-semibold; }
    .toolbar .select, .status .select { width: auto; }
    .download { margin-left: auto; background: none; border: 1px solid $color-border; border-radius: $rounded-sm;
                color: $purple-regular; font-family: inherit; font-weight: $font-weight-semibold;
                padding: 10px $space-3; cursor: pointer; }
    .download:hover { background: $dimgray-light-4; }

    .list { display: flex; flex-direction: column; gap: $space-3; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: $space-3; flex-wrap: wrap;
            background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; }
    .item__main { display: flex; flex-direction: column; }
    .item__guide { font-weight: $font-weight-black; color: $purple-regular; }
    .item__client { font-weight: $font-weight-semibold; }
    .item__meta { color: $color-text-secondary; font-size: $font-size-body; }
    .item__date { font-size: $font-size-micro; color: $color-text-disabled; }
    .item__side { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; }
    .item__total { font-weight: $font-weight-black; }
    .status { display: flex; flex-direction: column; gap: $space-1; }

    .pager { display: flex; justify-content: center; align-items: center; gap: $space-3; margin-top: $space-4;
             color: $color-text-secondary; font-size: $font-size-body; }
    .pager__btn { background: none; border: 1px solid $color-border; border-radius: $rounded-sm; cursor: pointer;
                  font-family: inherit; color: $purple-regular; padding: $space-2 $space-3; }
    .pager__btn:disabled { color: $color-text-disabled; cursor: not-allowed; }

    @include xs-only {
      .item__side { width: 100%; justify-content: space-between; }
      .toolbar { align-items: stretch; }
      .download { margin-left: 0; width: 100%; }
    }
  `],
})
export class AdminPedidosPage {
  readonly auth = inject(AuthService);

  readonly pedidos = signal<Pedido[]>(structuredClone(pedidosData) as Pedido[]);
  readonly sortOptions = SORT_OPTIONS;
  readonly sort = signal<SortKey>('date-desc');
  readonly pageSize = signal(5);
  readonly page = signal(1);

  readonly paged = computed(() =>
    paginate(sortShipments(this.pedidos(), this.sort()) as Pedido[], this.page(), this.pageSize()),
  );

  label(status: ShipmentSummary['status']): string {
    return STATUS_LABEL[status];
  }

  onSort(e: Event): void {
    this.sort.set((e.target as HTMLSelectElement).value as SortKey);
    this.page.set(1);
  }

  onPageSize(e: Event): void {
    this.pageSize.set(Number((e.target as HTMLSelectElement).value));
    this.page.set(1);
  }

  prev(): void { this.page.update((p) => p - 1); }
  next(): void { this.page.update((p) => p + 1); }

  onStatus(guide: string, e: Event): void {
    const status = (e.target as HTMLSelectElement).value as ShipmentSummary['status'];
    this.pedidos.update((list) => list.map((p) => (p.guide === guide ? { ...p, status } : p)));
  }

  downloadCsv(): void {
    const csv = shipmentsToCsv(sortShipments(this.pedidos(), this.sort()));
    downloadFile('pedidos-ohtli.csv', csv, 'text/csv;charset=utf-8');
  }
}
