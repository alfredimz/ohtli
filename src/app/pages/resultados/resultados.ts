import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QuoteOption } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { QuoteService } from '../../core/services/quote.service';
import { ShipmentService } from '../../core/services/shipment.service';
import { ProviderTableComponent } from '../../shared/components/provider-table';
import { WizardProgressComponent } from '../../shared/components/wizard-progress';

/** Resultados de cotización: tabla comparativa de opciones (paso 1/5). */
@Component({
  selector: 'app-resultados',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProviderTableComponent, WizardProgressComponent],
  template: `
    <section class="container page">
      <app-wizard-progress [current]="1" />
      <h2>Opciones para tu envío</h2>
      <p class="page__sub">CP {{ origin }} → {{ destination }} · {{ weight }} kg</p>

      @if (loading()) {
        <div class="state">Cotizando con las paqueterías…</div>
      } @else if (options().length) {
        <app-provider-table [options]="options()" (select)="onSelect($event)" (addToCart)="onAddToCart($event)" />
      } @else {
        <div class="state">No se encontraron opciones. Intenta de nuevo.</div>
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; }
    .page__sub { color: $color-text-secondary; margin-bottom: $space-4; }
    .state { padding: $space-6; text-align: center; color: $color-text-secondary; background: $dimgray-light-1; border-radius: $rounded; }
  `],
})
export class ResultadosPage implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly shipment = inject(ShipmentService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly options = signal<QuoteOption[]>([]);

  origin = '';
  destination = '';
  weight = 0;

  ngOnInit(): void {
    const parcel = this.shipment.draft().parcel;
    if (!parcel) {
      this.router.navigate(['/']);
      return;
    }
    this.origin = parcel.originZip;
    this.destination = parcel.destinationZip;
    this.weight = parcel.weightKg;

    this.quoteService.quote(parcel).subscribe((opts) => {
      this.options.set(opts);
      this.loading.set(false);
    });
  }

  onSelect(option: QuoteOption): void {
    this.shipment.selectOption(option);
    this.router.navigate(['/envio/detalles']);
  }

  /**
   * Agrega la opción al carrito (flujo «Envíos por pagar») con direcciones de
   * demostración: en el carrito el envío puede editarse antes de pagarlo.
   */
  onAddToCart(option: QuoteOption): void {
    const parcel = this.shipment.draft().parcel;
    if (!parcel) return;
    this.cart.add({
      packageName: `Paquete ${parcel.weightKg} kg (${this.origin} → ${this.destination})`,
      parcel,
      option,
      origin: {
        fullName: 'Por confirmar', phone: '5500000000', street: 'Por confirmar', extNumber: 'S/N',
        neighborhood: 'Por confirmar', zip: parcel.originZip, city: `CP ${parcel.originZip}`, state: 'MX',
      },
      destination: {
        fullName: 'Por confirmar', phone: '5500000000', street: 'Por confirmar', extNumber: 'S/N',
        neighborhood: 'Por confirmar', zip: parcel.destinationZip, city: `CP ${parcel.destinationZip}`, state: 'MX',
      },
    });
    this.router.navigate(['/envios-por-pagar']);
  }
}
