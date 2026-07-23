import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Address } from '../../core/models';
import { ShipmentService } from '../../core/services/shipment.service';
import { WizardProgressComponent } from '../../shared/components/wizard-progress';
import { ButtonComponent } from '../../shared/ui/button';

/**
 * Revisión del pedido antes de pagar (paso 3/5). Pantalla NUEVA que resuelve
 * P07: el prototipo cobraba sin un resumen previo. Aquí el usuario confirma
 * paquetería, direcciones y total antes de avanzar al pago.
 */
@Component({
  selector: 'app-revision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, WizardProgressComponent, ButtonComponent],
  template: `
    <section class="container page">
      <app-wizard-progress [current]="3" />
      <h2>Revisa tu pedido</h2>

      @if (draft().selectedOption; as opt) {
        <div class="grid">
          <article class="card">
            <h3>Servicio</h3>
            <p class="big">{{ opt.carrierName }} · {{ opt.serviceLabel }}</p>
            <p class="muted">Entrega estimada en {{ opt.days }} días</p>
          </article>

          <article class="card">
            <h3>Paquete</h3>
            <p class="big">{{ draft().packageName || 'Paquete' }}</p>
            <p class="muted">{{ parcelLine }}</p>
          </article>

          <article class="card">
            <h3>Origen</h3>
            <p>{{ addressLine(draft().origin) }}</p>
          </article>

          <article class="card">
            <h3>Destino</h3>
            <p>{{ addressLine(draft().destination) }}</p>
          </article>
        </div>

        <div class="total">
          <span>Total a pagar</span>
          <strong>{{ opt.ohtliPrice | currency:'MXN':'symbol-narrow' }}</strong>
        </div>

        <div class="actions">
          <app-button variant="ghost" (pressed)="back()">Editar detalles</app-button>
          <app-button variant="primary" (pressed)="pay()">Confirmar y pagar</app-button>
        </div>
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 760px; }
    .grid { display: grid; gap: $space-3; grid-template-columns: 1fr; margin-bottom: $space-4; @include md { grid-template-columns: 1fr 1fr; } }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; }
    .card h3 { font-size: $font-size-body; color: $color-text-secondary; text-transform: uppercase; letter-spacing: .04em; margin-bottom: $space-1; }
    .big { font-size: $font-size-card; font-weight: $font-weight-black; color: $color-text; margin: 0; }
    .muted { color: $color-text-secondary; margin: $space-1 0 0; font-size: $font-size-body; }
    .total { display: flex; justify-content: space-between; align-items: center; padding: $space-3 $space-4;
             background: $dimgray-light-4; border-radius: $rounded; margin-bottom: $space-4; }
    .total strong { font-size: $font-size-data; color: $purple-regular; @include md { font-size: $font-size-hero; } }
    .actions { display: flex; gap: $space-3; justify-content: flex-end; flex-wrap: wrap; }

    /* <576px: acciones apiladas a lo ancho, CTA primero (patrón mobile DEBOX). */
    @include xs-only {
      .actions { flex-direction: column-reverse; }
      .actions app-button { display: grid; }
    }
  `],
})
export class RevisionPage {
  private readonly shipment = inject(ShipmentService);
  private readonly router = inject(Router);
  readonly draft = this.shipment.draft;

  get parcelLine(): string {
    const p = this.draft().parcel;
    if (!p) return '';
    return `${p.weightKg} kg · ${p.lengthCm}×${p.widthCm}×${p.heightCm} cm`;
  }

  addressLine(a: Address | null): string {
    if (!a) return '—';
    return `${a.fullName} · ${a.street} ${a.extNumber}, ${a.neighborhood}, ${a.city}, ${a.state}, CP ${a.zip}`;
  }

  back(): void { this.router.navigate(['/envio/detalles']); }
  pay(): void { this.router.navigate(['/envio/pago']); }
}
