import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ParcelInput } from '../../core/models';
import { ButtonComponent } from '../ui/button';

/**
 * CotizarWidget — formulario de cotización. Emite los datos del paquete.
 * NO exige login para cotizar (resuelve P01: el prototipo bloqueaba ver precios
 * sin cuenta).
 */
@Component({
  selector: 'app-cotizar-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  template: `
    <form class="cw" (ngSubmit)="submit(f)" #f="ngForm" novalidate>
      <h3 class="cw__title">Cotiza tu envío</h3>

      <div class="cw__kind">
        <label class="choice">
          <input type="radio" name="kind" value="paquete" [(ngModel)]="model.kind" /> Paquete
        </label>
        <label class="choice">
          <input type="radio" name="kind" value="sobre" [(ngModel)]="model.kind" /> Sobre
        </label>
      </div>

      <div class="cw__row">
        <div class="field">
          <label class="field__label" for="origin">CP origen</label>
          <input id="origin" class="input" name="origin" inputmode="numeric" maxlength="5"
                 placeholder="06000" required pattern="\\d{5}" #originM="ngModel"
                 [class.is-error]="showError(originM)" [(ngModel)]="model.originZip" />
          @if (showError(originM)) { <span class="field__error">CP de 5 dígitos.</span> }
        </div>
        <div class="field">
          <label class="field__label" for="dest">CP destino</label>
          <input id="dest" class="input" name="dest" inputmode="numeric" maxlength="5"
                 placeholder="64000" required pattern="\\d{5}" #destM="ngModel"
                 [class.is-error]="showError(destM)" [(ngModel)]="model.destinationZip" />
          @if (showError(destM)) { <span class="field__error">CP de 5 dígitos.</span> }
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="weight">Peso (kg)</label>
        <input id="weight" class="input" name="weight" type="number" min="0.1" step="0.1"
               placeholder="1.0" required #weightM="ngModel"
               [class.is-error]="showError(weightM)" [(ngModel)]="model.weightKg" />
        @if (showError(weightM)) { <span class="field__error">Indica un peso mayor a 0.</span> }
      </div>

      <div class="cw__row cw__row--3">
        <div class="field">
          <label class="field__label" for="l">Largo (cm)</label>
          <input id="l" class="input" name="l" type="number" min="1" [(ngModel)]="model.lengthCm" />
        </div>
        <div class="field">
          <label class="field__label" for="w">Ancho (cm)</label>
          <input id="w" class="input" name="w" type="number" min="1" [(ngModel)]="model.widthCm" />
        </div>
        <div class="field">
          <label class="field__label" for="h">Alto (cm)</label>
          <input id="h" class="input" name="h" type="number" min="1" [(ngModel)]="model.heightCm" />
        </div>
      </div>

      <app-button type="submit" [block]="true">Cotizar envío</app-button>
      <p class="cw__note">Sin registro · compara Redpack, FedEx, DHL e iVoy</p>
    </form>
  `,
  styles: [`
    @use 'styles/tokens' as *;

    .cw {
      background: $white; border: 1px solid $color-border; border-radius: $rounded;
      padding: $space-3; box-shadow: $shadow; max-width: 420px;
      @include md { padding: $space-4; }
    }
    .cw__title { margin-bottom: $space-3; }
    .cw__kind { display: flex; gap: $space-4; margin-bottom: $space-3; }
    .cw__row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; }
    .cw__row--3 { grid-template-columns: repeat(3, 1fr); }
    .cw__note { margin: $space-2 0 0; font-size: $font-size-micro; color: $color-text-secondary; text-align: center; }
  `],
})
export class CotizarWidgetComponent {
  readonly quote = output<ParcelInput>();

  readonly attempted = signal(false);

  model: ParcelInput = {
    kind: 'paquete',
    originZip: '',
    destinationZip: '',
    weightKg: 1,
    lengthCm: 20,
    widthCm: 15,
    heightCm: 10,
  };

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
    this.quote.emit({ ...this.model });
  }
}
