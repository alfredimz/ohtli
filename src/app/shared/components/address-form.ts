import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import branchesData from '../../core/mock-data/branches.json';
import { Address } from '../../core/models';
import { SavedAddress } from '../../core/services/profile.service';
import { ButtonComponent } from '../ui/button';

interface Branch {
  id: string; name: string; street: string; extNumber: string;
  neighborhood: string; zip: string; city: string; state: string; schedule: string;
}

/**
 * AddressForm — captura de dirección de origen o destino. Resuelve P02: el
 * prototipo pedía 10+ campos en un solo paso; aquí se agrupan visualmente y el
 * CP autocompleta estado/ciudad (simulado) para reducir la carga del usuario.
 * Validación visible: al intentar continuar con campos inválidos se marca el
 * error campo a campo (pantalla «Origen – Error» del flujo de diseño).
 */
@Component({
  selector: 'app-address-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  template: `
    <form class="af" (ngSubmit)="onSubmit(f)" #f="ngForm" novalidate>
      <h3 class="af__title">{{ title() }}</h3>

      @if (branchPickup()) {
        <div class="af__mode" role="radiogroup" aria-label="Tipo de entrega">
          <label class="choice">
            <input type="radio" name="mode" value="domicilio" [(ngModel)]="mode" /> Entrega a domicilio
          </label>
          <label class="choice">
            <input type="radio" name="mode" value="sucursal" [(ngModel)]="mode" /> Recoger en sucursal
          </label>
        </div>
      }

      @if (mode === 'sucursal') {
        <div class="field">
          <label class="field__label" for="branch-{{ id() }}">Sucursal OHTLI</label>
          <select id="branch-{{ id() }}" class="select" name="branch" required #branchM="ngModel"
                  [class.is-error]="showError(branchM)" [(ngModel)]="branchId">
            <option value="" disabled>Elige una sucursal…</option>
            @for (b of branches; track b.id) {
              <option [value]="b.id">{{ b.name }} — {{ b.city }}, {{ b.state }}</option>
            }
          </select>
          @if (showError(branchM)) { <span class="field__error">Elige la sucursal de entrega.</span> }
          @if (selectedBranch(); as b) {
            <span class="field__hint">{{ b.street }} {{ b.extNumber }}, {{ b.neighborhood }}, CP {{ b.zip }} · {{ b.schedule }}</span>
          }
        </div>
      }

      @if (savedAddresses().length && mode === 'domicilio') {
        <div class="field">
          <label class="field__label" for="saved-{{ id() }}">Usar dirección guardada</label>
          <select id="saved-{{ id() }}" class="select" name="saved"
                  [(ngModel)]="savedId" (ngModelChange)="onSaved($event)">
            <option value="">— Escribir una nueva —</option>
            @for (a of savedAddresses(); track a.id) {
              <option [value]="a.id">{{ a.alias }} — {{ a.fullName }}, {{ a.city }}</option>
            }
          </select>
          <span class="field__hint">Tus direcciones de «Mis datos». Puedes editar los campos después de elegirla.</span>
        </div>
      }

      @if (mode === 'domicilio') {
      <div class="field">
        <label class="field__label" for="zip-{{ id() }}">Código postal</label>
        <input id="zip-{{ id() }}" class="input" name="zip" inputmode="numeric" maxlength="5"
               required pattern="\\d{5}" #zipM="ngModel" [class.is-error]="showError(zipM)"
               [(ngModel)]="model.zip" (ngModelChange)="onZip($event)" />
        @if (showError(zipM)) { <span class="field__error">CP de 5 dígitos.</span> }
        @else { <span class="field__hint">Autocompleta estado y ciudad</span> }
      </div>

      <div class="af__row">
        <div class="field">
          <label class="field__label" for="state-{{ id() }}">Estado</label>
          <input id="state-{{ id() }}" class="input" name="state" required #stateM="ngModel"
                 [class.is-error]="showError(stateM)" [(ngModel)]="model.state" />
          @if (showError(stateM)) { <span class="field__error">Campo obligatorio.</span> }
        </div>
        <div class="field">
          <label class="field__label" for="city-{{ id() }}">Ciudad / Municipio</label>
          <input id="city-{{ id() }}" class="input" name="city" required #cityM="ngModel"
                 [class.is-error]="showError(cityM)" [(ngModel)]="model.city" />
          @if (showError(cityM)) { <span class="field__error">Campo obligatorio.</span> }
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="hood-{{ id() }}">Colonia</label>
        <input id="hood-{{ id() }}" class="input" name="hood" required #hoodM="ngModel"
               [class.is-error]="showError(hoodM)" [(ngModel)]="model.neighborhood" />
        @if (showError(hoodM)) { <span class="field__error">Campo obligatorio.</span> }
      </div>

      <div class="af__row af__row--street">
        <div class="field">
          <label class="field__label" for="street-{{ id() }}">Calle</label>
          <input id="street-{{ id() }}" class="input" name="street" required #streetM="ngModel"
                 [class.is-error]="showError(streetM)" [(ngModel)]="model.street" />
          @if (showError(streetM)) { <span class="field__error">Campo obligatorio.</span> }
        </div>
        <div class="field">
          <label class="field__label" for="ext-{{ id() }}">Núm. ext.</label>
          <input id="ext-{{ id() }}" class="input" name="ext" required #extM="ngModel"
                 [class.is-error]="showError(extM)" [(ngModel)]="model.extNumber" />
          @if (showError(extM)) { <span class="field__error">Obligatorio.</span> }
        </div>
        <div class="field">
          <label class="field__label" for="int-{{ id() }}">Núm. int.</label>
          <input id="int-{{ id() }}" class="input" name="int" [(ngModel)]="model.intNumber" />
        </div>
      </div>

      <div class="af__row">
        <div class="field">
          <label class="field__label" for="name-{{ id() }}">Nombre de contacto</label>
          <input id="name-{{ id() }}" class="input" name="name" required #nameM="ngModel"
                 [class.is-error]="showError(nameM)" [(ngModel)]="model.fullName" />
          @if (showError(nameM)) { <span class="field__error">¿Quién entrega o recibe?</span> }
        </div>
        <div class="field">
          <label class="field__label" for="phone-{{ id() }}">Teléfono</label>
          <input id="phone-{{ id() }}" class="input" name="phone" inputmode="tel" maxlength="10"
                 required pattern="\\d{10}" #phoneM="ngModel" [class.is-error]="showError(phoneM)"
                 [(ngModel)]="model.phone" />
          @if (showError(phoneM)) { <span class="field__error">10 dígitos, sin espacios.</span> }
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="ref-{{ id() }}">Referencias (opcional)</label>
        <textarea id="ref-{{ id() }}" class="textarea" name="ref" [(ngModel)]="model.references"></textarea>
      </div>
      }

      @if (mode === 'sucursal') {
        <div class="af__row">
          <div class="field">
            <label class="field__label" for="bname-{{ id() }}">Quién recoge</label>
            <input id="bname-{{ id() }}" class="input" name="name" required #bnameM="ngModel"
                   [class.is-error]="showError(bnameM)" [(ngModel)]="model.fullName" />
            @if (showError(bnameM)) { <span class="field__error">Nombre de quien recoge (con identificación).</span> }
          </div>
          <div class="field">
            <label class="field__label" for="bphone-{{ id() }}">Teléfono</label>
            <input id="bphone-{{ id() }}" class="input" name="phone" inputmode="tel" maxlength="10"
                   required pattern="\\d{10}" #bphoneM="ngModel" [class.is-error]="showError(bphoneM)"
                   [(ngModel)]="model.phone" />
            @if (showError(bphoneM)) { <span class="field__error">10 dígitos, sin espacios.</span> }
          </div>
        </div>
      }

      @if (attempted() && f.invalid) {
        <p class="af__summary" role="alert">Revisa los campos marcados en rojo antes de continuar.</p>
      }

      <app-button type="submit" [block]="true">{{ submitLabel() }}</app-button>
    </form>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .af { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; @include md { padding: $space-4; } }
    .af__title { margin-bottom: $space-3; font-size: $font-size-card; }
    .af__mode { display: flex; gap: $space-4; margin-bottom: $space-3; flex-wrap: wrap; }
    .af__row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; }
    .af__row--street { grid-template-columns: 2fr 1fr 1fr; }
    .af__summary { color: $color-error; font-size: $font-size-body; font-weight: $font-weight-semibold; margin: 0 0 $space-3; }
    @include xs-only {
      .af__row, .af__row--street { grid-template-columns: 1fr; gap: 0; }
    }
  `],
})
export class AddressFormComponent {
  readonly id = input.required<string>();
  readonly title = input<string>('Dirección');
  readonly submitLabel = input<string>('Continuar');
  readonly initialZip = input<string>('');
  /** Si es true (destino), ofrece la entrega en sucursal OHTLI. */
  readonly branchPickup = input<boolean>(false);
  /** Libreta de direcciones del usuario con sesión (prefill del flujo 07). */
  readonly savedAddresses = input<SavedAddress[]>([]);
  readonly save = output<Address>();

  readonly attempted = signal(false);

  /** Tipo de entrega (solo relevante con branchPickup). */
  mode: 'domicilio' | 'sucursal' = 'domicilio';
  branchId = '';
  savedId = '';
  readonly branches: Branch[] = branchesData as Branch[];

  /** Copia la dirección guardada elegida al formulario (editable después). */
  onSaved(id: string): void {
    const saved = this.savedAddresses().find((a) => a.id === id);
    if (!saved) return;
    const { fullName, phone, street, extNumber, intNumber, neighborhood, zip, city, state, references } = saved;
    this.model = { fullName, phone, street, extNumber, intNumber, neighborhood, zip, city, state, references };
  }

  selectedBranch(): Branch | undefined {
    return this.branches.find((b) => b.id === this.branchId);
  }

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

  /** Un campo enseña su error si es inválido y ya fue tocado o hubo intento de envío. */
  showError(ctrl: { invalid: boolean | null; touched: boolean | null }): boolean {
    return !!ctrl.invalid && (!!ctrl.touched || this.attempted());
  }

  onSubmit(f: NgForm): void {
    this.attempted.set(true);
    if (f.invalid) {
      f.form.markAllAsTouched();
      return;
    }
    if (this.mode === 'sucursal') {
      const b = this.selectedBranch();
      if (!b) return;
      // La dirección de entrega es la de la sucursal elegida.
      this.save.emit({
        fullName: this.model.fullName,
        phone: this.model.phone,
        street: b.street,
        extNumber: b.extNumber,
        neighborhood: b.neighborhood,
        zip: b.zip,
        city: b.city,
        state: b.state,
        references: `Entrega en sucursal ${b.name} (${b.schedule})`,
      });
      return;
    }
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
