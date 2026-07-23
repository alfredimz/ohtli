import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { evaluateCard } from '../../core/services/payment';
import { ProfileService } from '../../core/services/profile.service';
import { ShipmentService } from '../../core/services/shipment.service';
import { WizardProgressComponent } from '../../shared/components/wizard-progress';
import { ButtonComponent } from '../../shared/ui/button';

/**
 * Pago (paso 4/5). Datos de tarjeta + datos de facturación (CFDI) opcionales.
 * Incluye el caso de error de la pasarela (tarjeta rechazada) con reintento,
 * como en el flujo Pagar del diseño. La validación es visible: al intentar
 * pagar con campos inválidos se marcan los errores campo a campo.
 */
@Component({
  selector: 'app-pago',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, FormsModule, RouterLink, WizardProgressComponent, ButtonComponent],
  template: `
    <section class="container page">
      <app-wizard-progress [current]="4" />
      <h2>Pago</h2>

      @if (declined()) {
        <div class="declined" role="alert">
          <strong>Tu tarjeta fue rechazada.</strong>
          <p>El banco no autorizó el cargo. Verifica los datos o intenta con otra tarjeta.
             No se realizó ningún cobro.</p>
        </div>
      }

      <form class="card" (ngSubmit)="submit(f)" #f="ngForm" novalidate>
        @if (auth.isAuthenticated() && profile.paymentMethods().length) {
          <div class="field">
            <label class="field__label" for="savedcard">Usar tarjeta guardada</label>
            <select id="savedcard" class="select" name="savedcard"
                    [(ngModel)]="savedCardId" (ngModelChange)="onSavedCard($event)">
              <option value="">— Escribir otra tarjeta —</option>
              @for (m of profile.paymentMethods(); track m.id) {
                <option [value]="m.id">{{ m.brand }} •••• {{ m.last4 }} · vence {{ m.exp }}</option>
              }
            </select>
            <span class="field__hint">De «Mis datos». Solo tendrás que escribir el CVV.</span>
          </div>
        }

        <div class="field">
          <label class="field__label" for="holder">Titular de la tarjeta</label>
          <input id="holder" class="input" name="holder" required #holderM="ngModel"
                 [class.is-error]="showError(holderM)" [(ngModel)]="card.holder" />
          @if (showError(holderM)) { <span class="field__error">Escribe el nombre tal como aparece en la tarjeta.</span> }
        </div>

        <div class="field">
          <label class="field__label" for="number">Número de tarjeta</label>
          <input id="number" class="input" name="number" inputmode="numeric" maxlength="19"
                 placeholder="4242 4242 4242 4242" required pattern="[\\d ]{15,19}" #numberM="ngModel"
                 [class.is-error]="showError(numberM)" [(ngModel)]="card.number" />
          @if (showError(numberM)) { <span class="field__error">Ingresa los 16 dígitos de la tarjeta.</span> }
          <span class="field__hint">Demo: una tarjeta terminada en 0000 simula el rechazo del banco.</span>
        </div>

        <div class="row">
          <div class="field">
            <label class="field__label" for="exp">Vencimiento</label>
            <input id="exp" class="input" name="exp" placeholder="MM/AA" required
                   pattern="(0[1-9]|1[0-2])\\/\\d{2}" #expM="ngModel"
                   [class.is-error]="showError(expM)" [(ngModel)]="card.exp" />
            @if (showError(expM)) { <span class="field__error">Formato MM/AA.</span> }
          </div>
          <div class="field">
            <label class="field__label" for="cvv">CVV</label>
            <input id="cvv" class="input" name="cvv" inputmode="numeric" maxlength="4"
                   placeholder="123" required pattern="\\d{3,4}" #cvvM="ngModel"
                   [class.is-error]="showError(cvvM)" [(ngModel)]="card.cvv" />
            @if (showError(cvvM)) { <span class="field__error">3 o 4 dígitos.</span> }
          </div>
        </div>

        <label class="choice">
          <input type="checkbox" name="invoice" [(ngModel)]="wantsInvoice" /> Requiero factura (CFDI)
        </label>

        @if (wantsInvoice) {
          <fieldset class="fiscal">
            <legend>Datos de facturación</legend>
            <div class="field">
              <label class="field__label" for="rfc">RFC</label>
              <input id="rfc" class="input" name="rfc" maxlength="13" required
                     pattern="[A-Za-zÑñ&]{3,4}\\d{6}[A-Za-z0-9]{3}" #rfcM="ngModel"
                     [class.is-error]="showError(rfcM)" [(ngModel)]="fiscal.rfc" />
              @if (showError(rfcM)) { <span class="field__error">RFC de 12 o 13 caracteres (ej. XAXX010101000).</span> }
            </div>
            <div class="field">
              <label class="field__label" for="razon">Razón social</label>
              <input id="razon" class="input" name="razon" required #razonM="ngModel"
                     [class.is-error]="showError(razonM)" [(ngModel)]="fiscal.businessName" />
              @if (showError(razonM)) { <span class="field__error">Como aparece en tu constancia fiscal.</span> }
            </div>
            <div class="row">
              <div class="field">
                <label class="field__label" for="cfdi">Uso de CFDI</label>
                <select id="cfdi" class="select" name="cfdi" required [(ngModel)]="fiscal.cfdiUse">
                  <option value="G01">G01 · Adquisición de mercancías</option>
                  <option value="G03">G03 · Gastos en general</option>
                  <option value="P01">P01 · Por definir</option>
                </select>
              </div>
              <div class="field">
                <label class="field__label" for="zipfis">CP fiscal</label>
                <input id="zipfis" class="input" name="zipfis" inputmode="numeric" maxlength="5"
                       required pattern="\\d{5}" #zipfisM="ngModel"
                       [class.is-error]="showError(zipfisM)" [(ngModel)]="fiscal.zip" />
                @if (showError(zipfisM)) { <span class="field__error">CP de 5 dígitos.</span> }
              </div>
            </div>
          </fieldset>
        }

        <label class="choice">
          <input type="checkbox" name="terms" required #termsM="ngModel" [(ngModel)]="acceptsTerms" />
          <span>Acepto los <a routerLink="/terminos" target="_blank">términos y condiciones</a></span>
        </label>
        @if (showError(termsM)) { <span class="field__error">Debes aceptar los términos para continuar.</span> }

        <div class="total">
          <span>Total</span>
          <strong>{{ shipment.total() | currency:'MXN':'symbol-narrow' }}</strong>
        </div>

        <app-button type="submit" [block]="true" [disabled]="processing()">
          {{ processing() ? 'Procesando…' : declined() ? 'Reintentar pago' : 'Pagar y generar guía' }}
        </app-button>
      </form>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 520px; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; @include md { padding: $space-4; } }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; }
    .total { display: flex; justify-content: space-between; align-items: center; margin: $space-3 0; }
    .total strong { font-size: $font-size-data; color: $purple-regular; }
    .fiscal { border: 1px dashed $color-border; border-radius: $rounded-sm; padding: $space-3; margin: $space-3 0; }
    .fiscal legend { font-size: $font-size-body; font-weight: $font-weight-semibold; color: $color-text-secondary; padding: 0 $space-1; }
    .declined { background: rgba($red-regular, .08); border: 1px solid rgba($red-regular, .35); color: $red-regular;
                border-radius: $rounded; padding: $space-3 $space-4; margin-bottom: $space-3; }
    .declined p { margin: $space-1 0 0; color: $color-text; font-size: $font-size-body; }
  `],
})
export class PagoPage {
  readonly shipment = inject(ShipmentService);
  readonly auth = inject(AuthService);
  readonly profile = inject(ProfileService);
  private readonly router = inject(Router);

  readonly processing = signal(false);
  readonly declined = signal(false);
  readonly attempted = signal(false);

  card = { holder: '', number: '', exp: '', cvv: '' };
  wantsInvoice = false;
  acceptsTerms = false;
  savedCardId = '';
  // Con sesión, los datos fiscales guardados en «Mis datos» se prellenan.
  fiscal = { rfc: '', businessName: '', cfdiUse: 'G03', zip: '', ...(this.profile.fiscal() ?? {}) };

  /** Prellena la tarjeta guardada (mock: reconstruye un número de prueba con los últimos 4). */
  onSavedCard(id: string): void {
    const method = this.profile.paymentMethods().find((m) => m.id === id);
    if (!method) return;
    this.card.holder = this.auth.user()?.name ?? '';
    this.card.number = `4242 4242 4242 ${method.last4}`;
    this.card.exp = method.exp;
    this.card.cvv = '';
  }

  /** Un campo enseña su error si es inválido y ya fue tocado o hubo intento de envío. */
  showError(ctrl: { invalid: boolean | null; touched: boolean | null }): boolean {
    return !!ctrl.invalid && (!!ctrl.touched || this.attempted());
  }

  submit(f: NgForm): void {
    this.attempted.set(true);
    if (f.invalid) {
      f.form.markAllAsTouched();
      return;
    }
    if (evaluateCard(this.card.number) === 'declined') {
      this.declined.set(true);
      return;
    }
    this.processing.set(true);
    this.shipment.contract().subscribe(() => {
      this.router.navigate(['/envio/confirmacion']);
    });
  }
}
