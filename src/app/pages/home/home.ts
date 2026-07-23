import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ParcelInput } from '../../core/models';
import { ShipmentService } from '../../core/services/shipment.service';
import { CotizarWidgetComponent } from '../../shared/components/cotizar-widget';

/** Home: propuesta de valor + cotizador. La cotización es libre (sin login). */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CotizarWidgetComponent],
  template: `
    <section class="hero">
      <div class="hero__inner container">
        <div class="hero__copy">
          <h1>Compara y contrata tu envío en segundos</h1>
          <p class="hero__lead">
            Una sola pantalla para cotizar Redpack, FedEx, DHL e iVoy con tarifas
            preferentes OHTLI. Sin crear cuenta para empezar.
          </p>
          <ul class="hero__points">
            <li>Precios con descuento por volumen</li>
            <li>Compara y elige la mejor opción</li>
            <li>Rastrea tu guía cuando quieras</li>
          </ul>
        </div>
        <app-cotizar-widget (quote)="onQuote($event)" />
      </div>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;

    .hero { background: linear-gradient(160deg, $dimgray-light-4 0%, $white 60%); padding: $space-5 0; @include md { padding: $space-6 0; } }
    .hero__inner { display: grid; gap: $space-6; align-items: center; grid-template-columns: 1fr; @include lg { grid-template-columns: 1.1fr .9fr; } }
    .hero__lead { font-size: $font-size-section; color: $color-text; max-width: 46ch; }
    .hero__points { padding-left: $space-3; color: $color-text-secondary; }
    .hero__points li { margin-bottom: $space-1; }
  `],
})
export class HomePage {
  private readonly shipment = inject(ShipmentService);
  private readonly router = inject(Router);

  onQuote(parcel: ParcelInput): void {
    this.shipment.setParcel(parcel);
    this.router.navigate(['/cotizar/resultados']);
  }
}
