import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, SavedAddress } from '../../core/services/profile.service';
import { ButtonComponent } from '../../shared/ui/button';

type Tab = 'personales' | 'origen' | 'destino' | 'facturacion' | 'pagos';

const EMPTY_ADDRESS = {
  alias: '', fullName: '', phone: '', street: '', extNumber: '', intNumber: '',
  neighborhood: '', zip: '', city: '', state: '', references: '',
};

/**
 * Mis datos (flujo 10): datos personales, libretas de direcciones de origen y
 * destino, datos de facturación y métodos de pago guardados. Todo sobre el
 * ProfileService (estado mock en el cliente).
 */
@Component({
  selector: 'app-mis-datos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgTemplateOutlet, RouterLink, ButtonComponent],
  template: `
    <section class="container page">
      <h2>Mis datos</h2>

      @if (!auth.isAuthenticated()) {
        <div class="gate">
          <p>Inicia sesión para administrar tus datos.</p>
          <a routerLink="/auth/login"><app-button variant="secondary">Iniciar sesión</app-button></a>
        </div>
      } @else {
        <nav class="tabs" aria-label="Secciones de Mis datos">
          @for (t of tabs; track t.id) {
            <button type="button" class="tab" [class.on]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
          }
        </nav>

        @switch (tab()) {
          @case ('personales') {
            <div class="card">
              <h3>Datos personales</h3>
              <div class="field">
                <label class="field__label" for="p-name">Nombre</label>
                <input id="p-name" class="input" name="pname" [(ngModel)]="personalName" />
              </div>
              <div class="field">
                <label class="field__label" for="p-email">Correo</label>
                <input id="p-email" class="input" name="pemail" [ngModel]="auth.user()?.email" disabled />
                <span class="field__hint">El correo de acceso no se puede cambiar en el prototipo.</span>
              </div>
              <div class="field">
                <label class="field__label" for="p-phone">Teléfono</label>
                <input id="p-phone" class="input" name="pphone" inputmode="tel" [(ngModel)]="personalPhone" />
              </div>
              <app-button (pressed)="savePersonal()">Guardar cambios</app-button>
              @if (savedFlash()) { <span class="flash" role="status">✓ Guardado</span> }
            </div>
          }
          @case ('origen') { <ng-container *ngTemplateOutlet="addressBook; context: { kind: 'origin' }" /> }
          @case ('destino') { <ng-container *ngTemplateOutlet="addressBook; context: { kind: 'destination' }" /> }
          @case ('facturacion') {
            <form class="card" (ngSubmit)="saveFiscal(ff)" #ff="ngForm" novalidate>
              <h3>Datos de facturación</h3>
              <p class="muted">Se prellenarán al pedir factura en tus próximos envíos.</p>
              <div class="field">
                <label class="field__label" for="fx-rfc">RFC</label>
                <input id="fx-rfc" class="input" name="rfc" maxlength="13" required
                       pattern="[A-Za-zÑñ&]{3,4}\\d{6}[A-Za-z0-9]{3}" #rfcM="ngModel"
                       [class.is-error]="showError(rfcM)" [(ngModel)]="fiscal.rfc" />
                @if (showError(rfcM)) { <span class="field__error">RFC de 12 o 13 caracteres.</span> }
              </div>
              <div class="field">
                <label class="field__label" for="fx-razon">Razón social</label>
                <input id="fx-razon" class="input" name="razon" required #razonM="ngModel"
                       [class.is-error]="showError(razonM)" [(ngModel)]="fiscal.businessName" />
                @if (showError(razonM)) { <span class="field__error">Campo obligatorio.</span> }
              </div>
              <div class="row">
                <div class="field">
                  <label class="field__label" for="fx-cfdi">Uso de CFDI</label>
                  <select id="fx-cfdi" class="select" name="cfdi" [(ngModel)]="fiscal.cfdiUse">
                    <option value="G01">G01 · Adquisición de mercancías</option>
                    <option value="G03">G03 · Gastos en general</option>
                    <option value="P01">P01 · Por definir</option>
                  </select>
                </div>
                <div class="field">
                  <label class="field__label" for="fx-zip">CP fiscal</label>
                  <input id="fx-zip" class="input" name="fzip" inputmode="numeric" maxlength="5"
                         required pattern="\\d{5}" #fzipM="ngModel"
                         [class.is-error]="showError(fzipM)" [(ngModel)]="fiscal.zip" />
                  @if (showError(fzipM)) { <span class="field__error">CP de 5 dígitos.</span> }
                </div>
              </div>
              <app-button type="submit">Guardar datos fiscales</app-button>
              @if (savedFlash()) { <span class="flash" role="status">✓ Guardado</span> }
            </form>
          }
          @case ('pagos') {
            <div class="card">
              <h3>Métodos de pago</h3>
              @for (m of profile.paymentMethods(); track m.id) {
                <div class="pm">
                  <span class="pm__brand">{{ m.brand }}</span>
                  <span>•••• {{ m.last4 }} · vence {{ m.exp }}</span>
                  <button type="button" class="linkbtn" (click)="profile.removePaymentMethod(m.id)">Eliminar</button>
                </div>
              } @empty {
                <p class="muted">Aún no guardas ningún método de pago.</p>
              }

              <form class="pm-add" (ngSubmit)="addCard(pf)" #pf="ngForm" novalidate>
                <div class="row">
                  <div class="field">
                    <label class="field__label" for="pm-num">Número de tarjeta</label>
                    <input id="pm-num" class="input" name="num" inputmode="numeric" maxlength="19"
                           required pattern="[\\d ]{15,19}" #numM="ngModel"
                           [class.is-error]="showError(numM)" [(ngModel)]="newCard.number" />
                    @if (showError(numM)) { <span class="field__error">16 dígitos.</span> }
                  </div>
                  <div class="field">
                    <label class="field__label" for="pm-exp">Vencimiento</label>
                    <input id="pm-exp" class="input" name="exp" placeholder="MM/AA" required
                           pattern="(0[1-9]|1[0-2])\\/\\d{2}" #pexpM="ngModel"
                           [class.is-error]="showError(pexpM)" [(ngModel)]="newCard.exp" />
                    @if (showError(pexpM)) { <span class="field__error">Formato MM/AA.</span> }
                  </div>
                </div>
                <app-button type="submit" variant="ghost">Agregar tarjeta</app-button>
              </form>
            </div>
          }
        }

        <ng-template #addressBook let-kind="kind">
          <div class="card">
            <h3>{{ kind === 'origin' ? 'Direcciones de origen' : 'Direcciones de destino' }}</h3>
            @for (a of listFor(kind); track a.id) {
              <div class="addr">
                <div>
                  <strong>{{ a.alias }}</strong> — {{ a.fullName }}
                  <p class="muted">{{ a.street }} {{ a.extNumber }}, {{ a.neighborhood }}, {{ a.city }}, {{ a.state }}, CP {{ a.zip }}</p>
                </div>
                <button type="button" class="linkbtn" (click)="profile.removeAddress(kind, a.id)">Eliminar</button>
              </div>
            } @empty {
              <p class="muted">Sin direcciones guardadas.</p>
            }

            @if (adding()) {
              <form class="addr-add" (ngSubmit)="addAddress(af, kind)" #af="ngForm" novalidate>
                <div class="row">
                  <div class="field">
                    <label class="field__label" for="a-alias">Alias</label>
                    <input id="a-alias" class="input" name="alias" placeholder="Casa, Oficina…" required #aliasM="ngModel"
                           [class.is-error]="showError(aliasM)" [(ngModel)]="newAddress.alias" />
                  </div>
                  <div class="field">
                    <label class="field__label" for="a-zip">CP</label>
                    <input id="a-zip" class="input" name="zip" inputmode="numeric" maxlength="5" required pattern="\\d{5}"
                           #azipM="ngModel" [class.is-error]="showError(azipM)" [(ngModel)]="newAddress.zip" />
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label class="field__label" for="a-street">Calle y número</label>
                    <input id="a-street" class="input" name="street" required #astreetM="ngModel"
                           [class.is-error]="showError(astreetM)" [(ngModel)]="newAddress.street" />
                  </div>
                  <div class="field">
                    <label class="field__label" for="a-ext">Núm. ext.</label>
                    <input id="a-ext" class="input" name="ext" required #aextM="ngModel"
                           [class.is-error]="showError(aextM)" [(ngModel)]="newAddress.extNumber" />
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label class="field__label" for="a-hood">Colonia</label>
                    <input id="a-hood" class="input" name="hood" required #ahoodM="ngModel"
                           [class.is-error]="showError(ahoodM)" [(ngModel)]="newAddress.neighborhood" />
                  </div>
                  <div class="field">
                    <label class="field__label" for="a-city">Ciudad</label>
                    <input id="a-city" class="input" name="city" required #acityM="ngModel"
                           [class.is-error]="showError(acityM)" [(ngModel)]="newAddress.city" />
                  </div>
                </div>
                <div class="row">
                  <div class="field">
                    <label class="field__label" for="a-state">Estado</label>
                    <input id="a-state" class="input" name="state" required #astateM="ngModel"
                           [class.is-error]="showError(astateM)" [(ngModel)]="newAddress.state" />
                  </div>
                  <div class="field">
                    <label class="field__label" for="a-name">Contacto</label>
                    <input id="a-name" class="input" name="name" required #anameM="ngModel"
                           [class.is-error]="showError(anameM)" [(ngModel)]="newAddress.fullName" />
                  </div>
                </div>
                <div class="field">
                  <label class="field__label" for="a-phone">Teléfono</label>
                  <input id="a-phone" class="input" name="phone" inputmode="tel" maxlength="10" required pattern="\\d{10}"
                         #aphoneM="ngModel" [class.is-error]="showError(aphoneM)" [(ngModel)]="newAddress.phone" />
                </div>
                <div class="addr-actions">
                  <app-button type="submit">Guardar dirección</app-button>
                  <app-button variant="ghost" (pressed)="adding.set(false)">Cancelar</app-button>
                </div>
              </form>
            } @else {
              <app-button variant="ghost" (pressed)="startAdd()">+ Agregar dirección</app-button>
            }
          </div>
        </ng-template>
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 720px; }
    .gate { background: $dimgray-light-1; border-radius: $rounded; padding: $space-5; text-align: center; }
    .gate p { margin-bottom: $space-3; }
    .tabs { display: flex; gap: $space-2; margin: $space-3 0 $space-4; flex-wrap: wrap; }
    .tab { background: none; border: 1px solid $color-border; border-radius: $rounded-full; cursor: pointer;
           font-family: inherit; font-size: $font-size-body; font-weight: $font-weight-semibold;
           color: $color-text-secondary; padding: $space-2 $space-3; }
    .tab.on { background: $purple-regular; border-color: $purple-regular; color: $white; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; @include md { padding: $space-4; } }
    .card h3 { margin-bottom: $space-3; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; @include xs-only { grid-template-columns: 1fr; gap: 0; } }
    .muted { color: $color-text-secondary; font-size: $font-size-body; margin: $space-1 0; }
    .flash { color: $green-regular; font-weight: $font-weight-semibold; margin-left: $space-3; }
    .addr, .pm { display: flex; justify-content: space-between; align-items: center; gap: $space-3;
                 border-bottom: 1px solid $dimgray-light-3; padding: $space-3 0; }
    .pm__brand { font-weight: $font-weight-black; color: $purple-regular; }
    .linkbtn { background: none; border: 0; color: $red-regular; cursor: pointer; font: inherit; text-decoration: underline; }
    .addr-add, .pm-add { margin-top: $space-3; padding-top: $space-3; border-top: 1px dashed $color-border; }
    .addr-actions { display: flex; gap: $space-3; flex-wrap: wrap; }
    .card > app-button { display: inline-grid; margin-top: $space-3; }
  `],
})
export class MisDatosPage {
  readonly auth = inject(AuthService);
  readonly profile = inject(ProfileService);

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'personales', label: 'Personales' },
    { id: 'origen', label: 'Direcciones de origen' },
    { id: 'destino', label: 'Direcciones de destino' },
    { id: 'facturacion', label: 'Facturación' },
    { id: 'pagos', label: 'Métodos de pago' },
  ];

  readonly tab = signal<Tab>('personales');
  readonly adding = signal(false);
  readonly attempted = signal(false);
  readonly savedFlash = signal(false);

  personalName = this.auth.user()?.name ?? '';
  personalPhone = this.profile.phone();
  fiscal = { rfc: '', businessName: '', cfdiUse: 'G03', zip: '', ...(this.profile.fiscal() ?? {}) };
  newAddress = { ...EMPTY_ADDRESS };
  newCard = { number: '', exp: '' };

  /** Un campo enseña su error si es inválido y ya fue tocado o hubo intento de envío. */
  showError(ctrl: { invalid: boolean | null; touched: boolean | null }): boolean {
    return !!ctrl.invalid && (!!ctrl.touched || this.attempted());
  }

  listFor(kind: 'origin' | 'destination'): SavedAddress[] {
    return kind === 'origin' ? this.profile.originAddresses() : this.profile.destinationAddresses();
  }

  startAdd(): void {
    this.newAddress = { ...EMPTY_ADDRESS };
    this.attempted.set(false);
    this.adding.set(true);
  }

  savePersonal(): void {
    this.profile.phone.set(this.personalPhone);
    this.flash();
  }

  saveFiscal(f: NgForm): void {
    this.attempted.set(true);
    if (f.invalid) { f.form.markAllAsTouched(); return; }
    this.profile.saveFiscal({ ...this.fiscal });
    this.flash();
  }

  addAddress(f: NgForm, kind: 'origin' | 'destination'): void {
    this.attempted.set(true);
    if (f.invalid) { f.form.markAllAsTouched(); return; }
    this.profile.addAddress(kind, { ...this.newAddress });
    this.adding.set(false);
    this.attempted.set(false);
  }

  addCard(f: NgForm): void {
    this.attempted.set(true);
    if (f.invalid) { f.form.markAllAsTouched(); return; }
    this.profile.addPaymentMethod(this.newCard.number, this.newCard.exp);
    this.newCard = { number: '', exp: '' };
    this.attempted.set(false);
    f.resetForm();
  }

  private flash(): void {
    this.savedFlash.set(true);
    setTimeout(() => this.savedFlash.set(false), 2000);
  }
}
