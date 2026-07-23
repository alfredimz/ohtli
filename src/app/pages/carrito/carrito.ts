import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartItem, CartService } from '../../core/services/cart.service';
import { ShipmentService } from '../../core/services/shipment.service';
import { BadgeComponent } from '../../shared/ui/badge';
import { ButtonComponent } from '../../shared/ui/button';

/**
 * Envíos por pagar — carrito (flujo 06). Acumula envíos cotizados (datos mock)
 * y permite editarlos, duplicarlos, eliminarlos (con confirmación) y pagarlos:
 * «Pagar» carga el envío en el borrador del wizard y continúa en Revisión.
 */
@Component({
  selector: 'app-carrito',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormsModule, RouterLink, BadgeComponent, ButtonComponent],
  template: `
    <section class="container page">
      <h2>Envíos por pagar</h2>

      @if (cart.count() === 0) {
        <div class="empty">
          <p>Tu carrito está vacío.</p>
          <a routerLink="/"><app-button variant="secondary">Cotizar un envío</app-button></a>
        </div>
      } @else {
        <p class="sub">{{ cart.count() }} envío(s) pendientes de pago</p>

        <div class="list">
          @for (item of cart.items(); track item.id) {
            <article class="item">
              @if (editing() === item.id) {
                <form class="edit" (ngSubmit)="saveEdit(item)">
                  <div class="field">
                    <label class="field__label" for="e-name-{{ item.id }}">Descripción</label>
                    <input id="e-name-{{ item.id }}" class="input" name="name" required [(ngModel)]="editName" />
                  </div>
                  <div class="field">
                    <label class="field__label" for="e-kg-{{ item.id }}">Peso (kg)</label>
                    <input id="e-kg-{{ item.id }}" class="input" name="kg" type="number" min="0.1" step="0.1" required [(ngModel)]="editWeight" />
                  </div>
                  <div class="edit__actions">
                    <app-button type="submit">Guardar</app-button>
                    <app-button variant="ghost" (pressed)="editing.set(null)">Cancelar</app-button>
                  </div>
                </form>
              } @else {
                <div class="item__main">
                  <span class="item__name">{{ item.packageName }}</span>
                  <span class="item__meta">{{ item.origin.city }} → {{ item.destination.city }} · {{ item.parcel.weightKg }} kg</span>
                  <span class="item__svc">
                    <app-badge variant="info">{{ item.option.carrierName }}</app-badge>
                    {{ item.option.serviceLabel }} · entrega en {{ item.option.days }} días
                  </span>
                </div>
                <div class="item__side">
                  <span class="item__price">{{ item.option.ohtliPrice | currency:'MXN':'symbol-narrow' }}</span>
                  <div class="item__actions">
                    <app-button variant="primary" (pressed)="pay(item)">Pagar</app-button>
                    <button type="button" class="linkbtn" (click)="startEdit(item)">Editar</button>
                    <button type="button" class="linkbtn" (click)="cart.duplicate(item.id)">Duplicar</button>
                    <button type="button" class="linkbtn linkbtn--danger" (click)="confirmDelete.set(item.id)">Eliminar</button>
                  </div>
                </div>
              }
            </article>
          }
        </div>

        <div class="summary">
          <span>Total del carrito</span>
          <strong>{{ cart.total() | currency:'MXN':'symbol-narrow' }}</strong>
        </div>
        <p class="note">Cada envío se paga individualmente: al pulsar «Pagar» continúas en Revisión → Pago con ese envío.</p>
        <a routerLink="/" class="more">+ Cotizar y agregar otro envío</a>
      }

      @if (confirmDelete(); as id) {
        <div class="overlay" role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
          <div class="modal">
            <h3>¿Eliminar este envío?</h3>
            <p class="muted">Se quitará del carrito. Esta acción no se puede deshacer.</p>
            <div class="modal__actions">
              <app-button variant="danger" (pressed)="doDelete(id)">Sí, eliminar</app-button>
              <app-button variant="ghost" (pressed)="confirmDelete.set(null)">Cancelar</app-button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 760px; }
    .sub { color: $color-text-secondary; margin-bottom: $space-3; }
    .empty { background: $dimgray-light-1; border-radius: $rounded; padding: $space-5; text-align: center; }
    .empty p { margin-bottom: $space-3; }
    .list { display: flex; flex-direction: column; gap: $space-3; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: $space-3; flex-wrap: wrap;
            background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; }
    .item__main { display: flex; flex-direction: column; gap: 2px; }
    .item__name { font-weight: $font-weight-black; color: $purple-regular; }
    .item__meta { color: $color-text-secondary; font-size: $font-size-body; }
    .item__svc { display: flex; align-items: center; gap: $space-2; font-size: $font-size-body; color: $color-text-secondary; }
    .item__side { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; }
    .item__price { font-size: $font-size-card; font-weight: $font-weight-black; }
    .item__actions { display: flex; align-items: center; gap: $space-2; flex-wrap: wrap; }
    .linkbtn { background: none; border: 0; color: $color-link; cursor: pointer; font: inherit; text-decoration: underline; padding: 0; }
    .linkbtn--danger { color: $red-regular; }
    .edit { width: 100%; display: grid; gap: 0 $space-3; grid-template-columns: 2fr 1fr; align-items: end;
            @include xs-only { grid-template-columns: 1fr; } }
    .edit__actions { grid-column: 1 / -1; display: flex; gap: $space-2; }
    .summary { display: flex; justify-content: space-between; align-items: center; margin-top: $space-4;
               background: $dimgray-light-4; border-radius: $rounded; padding: $space-3 $space-4; }
    .summary strong { font-size: $font-size-data; color: $purple-regular; }
    .note { color: $color-text-secondary; font-size: $font-size-micro; margin: $space-2 0; }
    .more { display: inline-block; font-weight: $font-weight-semibold; margin-top: $space-2; }
    .muted { color: $color-text-secondary; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 100;
               display: flex; align-items: center; justify-content: center; padding: $space-3; }
    .modal { background: $white; border-radius: $rounded; box-shadow: $shadow-lg; padding: $space-4; max-width: 400px; width: 100%; }
    .modal h3 { margin-bottom: $space-2; }
    .modal__actions { display: flex; gap: $space-3; margin-top: $space-4; flex-wrap: wrap; }
    @include xs-only {
      .item__side { width: 100%; justify-content: space-between; }
      .modal__actions { flex-direction: column; }
      .modal__actions app-button { display: grid; }
    }
  `],
})
export class CarritoPage {
  readonly cart = inject(CartService);
  private readonly shipment = inject(ShipmentService);
  private readonly router = inject(Router);

  readonly editing = signal<string | null>(null);
  readonly confirmDelete = signal<string | null>(null);
  editName = '';
  editWeight = 1;

  startEdit(item: CartItem): void {
    this.editName = item.packageName;
    this.editWeight = item.parcel.weightKg;
    this.editing.set(item.id);
  }

  saveEdit(item: CartItem): void {
    this.cart.updatePackage(item.id, this.editName, this.editWeight);
    this.editing.set(null);
  }

  doDelete(id: string): void {
    this.cart.remove(id);
    this.confirmDelete.set(null);
  }

  /** Carga el envío del carrito en el borrador del wizard y continúa en Revisión. */
  pay(item: CartItem): void {
    this.shipment.setParcel(item.parcel);
    this.shipment.selectOption(item.option);
    this.shipment.setPackageName(item.packageName);
    this.shipment.setOrigin(item.origin);
    this.shipment.setDestination(item.destination);
    this.cart.remove(item.id);
    this.router.navigate(['/envio/revision']);
  }
}
