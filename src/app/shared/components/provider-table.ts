import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { QuoteOption } from '../../core/models';
import { ButtonComponent } from '../ui/button';
import { BadgeComponent } from '../ui/badge';

/**
 * ProviderTable — comparativa de opciones de envío. En escritorio se muestra
 * como tabla; en móvil cada opción se reordena como tarjeta apilada.
 */
@Component({
  selector: 'app-provider-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, ButtonComponent, BadgeComponent],
  template: `
    <div class="pt">
      @for (opt of options(); track opt.id) {
        <article class="pt__row" [class.is-cheapest]="$first">
          <div class="pt__carrier">
            @if (opt.carrierLogo) {
              <img [src]="opt.carrierLogo" [alt]="opt.carrierName" height="22" />
            } @else {
              <span class="pt__carrier-name">{{ opt.carrierName }}</span>
            }
            @if ($first) { <app-badge variant="success">Mejor precio</app-badge> }
          </div>

          <div class="pt__service">
            <span class="pt__service-label">{{ opt.serviceLabel }}</span>
            <span class="pt__days">Entrega en {{ opt.days }} días</span>
          </div>

          <div class="pt__price">
            <span class="pt__list">{{ opt.listPrice | currency:'MXN':'symbol-narrow' }}</span>
            <span class="pt__ohtli">{{ opt.ohtliPrice | currency:'MXN':'symbol-narrow' }}</span>
            <app-badge variant="discount">−{{ opt.discount }}% OHTLI</app-badge>
          </div>

          <div class="pt__action">
            <app-button variant="primary" (pressed)="select.emit(opt)">Seleccionar</app-button>
            <button type="button" class="pt__cart" (click)="addToCart.emit(opt)">Al carrito</button>
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    @use 'styles/tokens' as *;

    .pt { display: flex; flex-direction: column; gap: $space-3; }
    .pt__row {
      display: grid; gap: $space-3; align-items: center;
      grid-template-columns: 1fr; padding: $space-3;
      background: $white; border: 1px solid $color-border; border-radius: $rounded;
      @include md { grid-template-columns: 1.2fr 1.4fr 1.4fr auto; }
    }
    .pt__row.is-cheapest { border-color: $green-regular; box-shadow: 0 0 0 1px $green-regular; }

    .pt__carrier { display: flex; align-items: center; gap: $space-2; }
    .pt__carrier-name { font-weight: $font-weight-black; color: $purple-regular; font-size: $font-size-card; }

    .pt__service { display: flex; flex-direction: column; }
    .pt__service-label { font-weight: $font-weight-semibold; }
    .pt__days { font-size: $font-size-micro; color: $color-text-secondary; }

    .pt__price { display: flex; flex-direction: column; gap: 2px; }
    .pt__list { font-size: $font-size-micro; color: $color-text-secondary; text-decoration: line-through; }
    .pt__ohtli { font-size: $font-size-data; font-weight: $font-weight-black; color: $color-text; }

    .pt__action { display: flex; flex-direction: column; gap: $space-1; align-items: stretch; }
    .pt__cart { background: none; border: 0; color: $color-link; cursor: pointer; font: inherit;
                font-size: $font-size-micro; text-decoration: underline; padding: 0; }

    /* Modo tarjeta (<768px): precio en línea base compartida y CTA a lo ancho,
       como las tarjetas apiladas del prototipo mobile. */
    @include mobile-only {
      .pt__price { flex-direction: row; align-items: baseline; gap: $space-2; flex-wrap: wrap; }
      .pt__action app-button { display: grid; }
    }
  `],
})
export class ProviderTableComponent {
  readonly options = input.required<QuoteOption[]>();
  readonly select = output<QuoteOption>();
  /** Agrega la opción al carrito de envíos por pagar (flujo 06). */
  readonly addToCart = output<QuoteOption>();
}
