import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShipmentService } from '../../core/services/shipment.service';
import { WizardProgressComponent } from '../../shared/components/wizard-progress';
import { ButtonComponent } from '../../shared/ui/button';

/** Pago (paso 4/5). Datos de tarjeta + factura opcional. Contrata el envío. */
@Component({
  selector: 'app-pago',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormsModule, WizardProgressComponent, ButtonComponent],
  template: `
    <section class="container page">
      <app-wizard-progress [current]="4" />
      <h2>Pago</h2>

      <form class="card" (ngSubmit)="submit()" #f="ngForm">
        <div class="field">
          <label class="field__label" for="holder">Titular de la tarjeta</label>
          <input id="holder" class="input" name="holder" required [(ngModel)]="card.holder" />
        </div>
        <div class="field">
          <label class="field__label" for="number">Número de tarjeta</label>
          <input id="number" class="input" name="number" inputmode="numeric" maxlength="19"
                 placeholder="4242 4242 4242 4242" required [(ngModel)]="card.number" />
        </div>
        <div class="row">
          <div class="field">
            <label class="field__label" for="exp">Vencimiento</label>
            <input id="exp" class="input" name="exp" placeholder="MM/AA" required [(ngModel)]="card.exp" />
          </div>
          <div class="field">
            <label class="field__label" for="cvv">CVV</label>
            <input id="cvv" class="input" name="cvv" inputmode="numeric" maxlength="4"
                   placeholder="123" required [(ngModel)]="card.cvv" />
          </div>
        </div>

        <label class="choice">
          <input type="checkbox" name="invoice" [(ngModel)]="wantsInvoice" /> Requiero factura
        </label>

        @if (wantsInvoice) {
          <div class="field">
            <label class="field__label" for="rfc">RFC</label>
            <input id="rfc" class="input" name="rfc" [(ngModel)]="rfc" />
          </div>
        }

        <div class="total">
          <span>Total</span>
          <strong>{{ shipment.total() | currency:'MXN':'symbol-narrow' }}</strong>
        </div>

        <app-button type="submit" [block]="true" [disabled]="f.invalid || processing()">
          {{ processing() ? 'Procesando…' : 'Pagar y generar guía' }}
        </app-button>
      </form>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding: $space-5 0; max-width: 520px; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-4; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; }
    .total { display: flex; justify-content: space-between; align-items: center; margin: $space-3 0; }
    .total strong { font-size: $font-size-data; color: $purple-regular; }
  `],
})
export class PagoPage {
  readonly shipment = inject(ShipmentService);
  private readonly router = inject(Router);

  readonly processing = signal(false);
  card = { holder: '', number: '', exp: '', cvv: '' };
  wantsInvoice = false;
  rfc = '';

  submit(): void {
    this.processing.set(true);
    this.shipment.contract().subscribe(() => {
      this.router.navigate(['/envio/confirmacion']);
    });
  }
}
