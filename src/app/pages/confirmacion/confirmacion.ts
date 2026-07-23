import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ShipmentService } from '../../core/services/shipment.service';
import { ButtonComponent } from '../../shared/ui/button';
import { WizardProgressComponent } from '../../shared/components/wizard-progress';

/** Confirmación (paso 5/5): muestra la guía generada por el "back-end" simulado. */
@Component({
  selector: 'app-confirmacion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, ButtonComponent, WizardProgressComponent],
  template: `
    <section class="container page">
      <app-wizard-progress [current]="5" />
      @if (shipment.lastResult(); as s) {
        <div class="ok">
          <img src="/assets/img/icon-check-green.svg" alt="" width="56" height="56" />
          <h2>¡Envío contratado!</h2>
          <p class="lead">Tu guía con {{ s.carrierName }} ({{ s.serviceLabel }}) está lista.</p>

          <div class="guide">
            <span class="guide__label">Número de guía</span>
            <span class="guide__num">{{ s.guide }}</span>
          </div>

          <p class="paid">Pagaste {{ s.total | currency:'MXN':'symbol-narrow' }}</p>

          <div class="actions">
            <app-button variant="secondary" (pressed)="track(s.guide)">Rastrear guía</app-button>
            <app-button variant="ghost" (pressed)="home()">Nuevo envío</app-button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-7; max-width: 520px; text-align: center; }
    .ok img { margin-bottom: $space-3; }
    .lead { color: $color-text-secondary; }
    .guide { background: $dimgray-light-4; border-radius: $rounded; padding: $space-4; margin: $space-4 0; }
    .guide__label { display: block; font-size: $font-size-micro; color: $color-text-secondary; text-transform: uppercase; letter-spacing: .06em; }
    .guide__num { font-size: $font-size-data; font-weight: $font-weight-black; color: $purple-regular; letter-spacing: .04em;
                  overflow-wrap: anywhere; @include md { font-size: $font-size-hero; } }
    .paid { color: $green-regular; font-weight: $font-weight-semibold; }
    .actions { display: flex; gap: $space-3; justify-content: center; flex-wrap: wrap; margin-top: $space-4; }
  `],
})
export class ConfirmacionPage implements OnInit {
  readonly shipment = inject(ShipmentService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.shipment.lastResult()) this.router.navigate(['/']);
  }

  track(guide: string): void { this.router.navigate(['/rastrear'], { queryParams: { guia: guide } }); }
  home(): void { this.router.navigate(['/']); }
}
