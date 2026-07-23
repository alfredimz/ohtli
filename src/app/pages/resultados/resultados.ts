import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QuoteOption } from '../../core/models';
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
        <app-provider-table [options]="options()" (select)="onSelect($event)" />
      } @else {
        <div class="state">No se encontraron opciones. Intenta de nuevo.</div>
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding: $space-5 0; }
    .page__sub { color: $color-text-secondary; margin-bottom: $space-4; }
    .state { padding: $space-6; text-align: center; color: $color-text-secondary; background: $dimgray-light-1; border-radius: $rounded; }
  `],
})
export class ResultadosPage implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly shipment = inject(ShipmentService);
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
}
