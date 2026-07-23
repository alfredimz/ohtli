import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Address } from '../../core/models';
import { ButtonComponent } from '../ui/button';

/**
 * AddressForm — captura de dirección de origen o destino. Resuelve P02: el
 * prototipo pedía 10+ campos en un solo paso; aquí se agrupan visualmente y el
 * CP autocompleta estado/ciudad (simulado) para reducir la carga del usuario.
 */
@Component({
  selector: 'app-address-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  template: `
    <form class="af" (ngSubmit)="onSubmit()" #f="ngForm">
      <h3 class="af__title">{{ title() }}</h3>

      <div class="field">
        <label class="field__label" for="zip-{{ id() }}">Código postal</label>
        <input id="zip-{{ id() }}" class="input" name="zip" inputmode="numeric" maxlength="5"
               required pattern="\\d{5}" [(ngModel)]="model.zip" (ngModelChange)="onZip($event)" />
        <span class="field__hint">Autocompleta estado y ciudad</span>
      </div>

      <div class="af__row">
        <div class="field">
          <label class="field__label" for="state-{{ id() }}">Estado</label>
          <input id="state-{{ id() }}" class="input" name="state" required [(ngModel)]="model.state" />
        </div>
        <div class="field">
          <label class="field__label" for="city-{{ id() }}">Ciudad / Municipio</label>
          <input id="city-{{ id() }}" class="input" name="city" required [(ngModel)]="model.city" />
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="hood-{{ id() }}">Colonia</label>
        <input id="hood-{{ id() }}" class="input" name="hood" required [(ngModel)]="model.neighborhood" />
      </div>

      <div class="af__row af__row--street">
        <div class="field">
          <label class="field__label" for="street-{{ id() }}">Calle</label>
          <input id="street-{{ id() }}" class="input" name="street" required [(ngModel)]="model.street" />
        </div>
        <div class="field">
          <label class="field__label" for="ext-{{ id() }}">Núm. ext.</label>
          <input id="ext-{{ id() }}" class="input" name="ext" required [(ngModel)]="model.extNumber" />
        </div>
        <div class="field">
          <label class="field__label" for="int-{{ id() }}">Núm. int.</label>
          <input id="int-{{ id() }}" class="input" name="int" [(ngModel)]="model.intNumber" />
        </div>
      </div>

      <div class="af__row">
        <div class="field">
          <label class="field__label" for="name-{{ id() }}">Nombre de contacto</label>
          <input id="name-{{ id() }}" class="input" name="name" required [(ngModel)]="model.fullName" />
        </div>
        <div class="field">
          <label class="field__label" for="phone-{{ id() }}">Teléfono</label>
          <input id="phone-{{ id() }}" class="input" name="phone" inputmode="tel" required [(ngModel)]="model.phone" />
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="ref-{{ id() }}">Referencias (opcional)</label>
        <textarea id="ref-{{ id() }}" class="textarea" name="ref" [(ngModel)]="model.references"></textarea>
      </div>

      <app-button type="submit" [block]="true" [disabled]="!!f.invalid">{{ submitLabel() }}</app-button>
    </form>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .af { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-4; }
    .af__title { margin-bottom: $space-3; font-size: $font-size-card; }
    .af__row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; }
    .af__row--street { grid-template-columns: 2fr 1fr 1fr; }
    @media (max-width: 480px) {
      .af__row, .af__row--street { grid-template-columns: 1fr; }
    }
  `],
})
export class AddressFormComponent {
  readonly id = input.required<string>();
  readonly title = input<string>('Dirección');
  readonly submitLabel = input<string>('Continuar');
  readonly initialZip = input<string>('');
  readonly save = output<Address>();

  model: Address = {
    fullName: '', phone: '', street: '', extNumber: '', intNumber: '',
    neighborhood: '', zip: '', city: '', state: '', references: '',
  };

  /** Autocompletado de CP simulado (en producción: API SEPOMEX). */
  private static readonly ZIP_DB: Record<string, { state: string; city: string }> = {
    '06000': { state: 'CDMX', city: 'Cuauhtémoc' },
    '64000': { state: 'Nuevo León', city: 'Monterrey' },
    '44100': { state: 'Jalisco', city: 'Guadalajara' },
    '76000': { state: 'Querétaro', city: 'Querétaro' },
    '97000': { state: 'Yucatán', city: 'Mérida' },
  };

  onSubmit(): void {
    this.save.emit({ ...this.model });
  }

  onZip(zip: string): void {
    const hit = AddressFormComponent.ZIP_DB[zip];
    if (hit) {
      this.model.state = hit.state;
      this.model.city = hit.city;
    }
  }
}
