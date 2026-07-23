import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Address } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ShipmentService } from '../../core/services/shipment.service';
import { AddressFormComponent } from '../../shared/components/address-form';
import { WizardProgressComponent } from '../../shared/components/wizard-progress';
import { ButtonComponent } from '../../shared/ui/button';

/**
 * Detalles del envío (paso 2/5). Tres sub-pasos con su propio estado:
 * 1) datos del paquete · 2) dirección de origen · 3) dirección de destino.
 * Es un flujo guest: el login es diferido y opcional (resuelve P01).
 */
@Component({
  selector: 'app-detalles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AddressFormComponent, WizardProgressComponent, ButtonComponent, RouterLink],
  template: `
    <section class="container page">
      <app-wizard-progress [current]="2" />

      @if (!auth.isAuthenticated()) {
        <div class="guest">
          <p class="guest__text">
            Continúas como invitado.
            <button type="button" class="guest__toggle" (click)="showLogin.set(!showLogin())">
              {{ showLogin() ? 'Seguir como invitado' : 'Inicia sesión aquí' }}
            </button>
            para usar tus direcciones guardadas.
          </p>

          @if (showLogin()) {
            <form class="guest__form" (ngSubmit)="inlineLogin(lf)" #lf="ngForm" novalidate>
              @if (loginError()) { <p class="guest__error" role="alert">{{ loginError() }}</p> }
              <div class="guest__row">
                <div class="field">
                  <label class="field__label" for="il-email">Correo</label>
                  <input id="il-email" class="input" name="email" type="email" required email #ilEmailM="ngModel"
                         [class.is-error]="ilEmailM.invalid && ilEmailM.touched" [(ngModel)]="loginEmail" />
                </div>
                <div class="field">
                  <label class="field__label" for="il-pass">Contraseña</label>
                  <input id="il-pass" class="input" name="pass" type="password" required #ilPassM="ngModel"
                         [class.is-error]="ilPassM.invalid && ilPassM.touched" [(ngModel)]="loginPassword" />
                </div>
              </div>
              <div class="guest__actions">
                <app-button type="submit" size="md" [disabled]="loggingIn()">
                  {{ loggingIn() ? 'Entrando…' : 'Entrar y continuar' }}
                </app-button>
                <a routerLink="/auth/registro">¿No tienes cuenta? Créala</a>
              </div>
            </form>
          }
        </div>
      } @else {
        <p class="guest guest--in">Sesión iniciada como <strong>{{ auth.user()!.name }}</strong> — tus direcciones guardadas están disponibles en los formularios.</p>
      }

      <div class="substeps">
        <span [class.on]="sub() === 1">1 · Paquete</span>
        <span [class.on]="sub() === 2">2 · Origen</span>
        <span [class.on]="sub() === 3">3 · Destino</span>
      </div>

      @switch (sub()) {
        @case (1) {
          <form class="card" (ngSubmit)="next(f)" #f="ngForm" novalidate>
            <h3>¿Qué envías?</h3>
            <div class="field">
              <label class="field__label" for="pkg">Descripción del paquete</label>
              <input id="pkg" class="input" name="pkg" required #pkgM="ngModel"
                     [class.is-error]="showError(pkgM)"
                     placeholder="Ej. Ropa, 1 caja mediana" [(ngModel)]="packageName" />
              @if (showError(pkgM)) { <span class="field__error">Describe brevemente qué envías.</span> }
            </div>
            <app-button type="submit" [block]="true">Continuar</app-button>
          </form>
        }
        @case (2) {
          <app-address-form id="origen" title="Dirección de origen"
                            [savedAddresses]="auth.isAuthenticated() ? profile.originAddresses() : []"
                            submitLabel="Continuar al destino" (save)="onOrigin($event)" />
        }
        @case (3) {
          <app-address-form id="destino" title="Dirección de destino" [branchPickup]="true"
                            [savedAddresses]="auth.isAuthenticated() ? profile.destinationAddresses() : []"
                            submitLabel="Revisar pedido" (save)="onDestination($event)" />
        }
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 640px; }
    .guest { background: $dimgray-light-4; color: $purple-regular; padding: $space-2 $space-3; border-radius: $rounded-sm; }
    .guest--in { color: $color-text; }
    .guest__text { margin: 0; }
    .guest__toggle { background: none; border: 0; padding: 0; cursor: pointer; font: inherit;
                     color: $color-link; text-decoration: underline; }
    .guest__form { margin-top: $space-3; padding-top: $space-3; border-top: 1px dashed $purple-light; }
    .guest__row { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3;
                  @include xs-only { grid-template-columns: 1fr; gap: 0; } }
    .guest__actions { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; font-size: $font-size-body; }
    .guest__error { color: $color-error; font-weight: $font-weight-semibold; font-size: $font-size-body; margin: 0 0 $space-2; }
    .substeps { display: flex; flex-wrap: wrap; gap: $space-2 $space-3; margin: $space-3 0 $space-4; font-size: $font-size-body; color: $color-text-disabled; }
    .substeps .on { color: $purple-regular; font-weight: $font-weight-black; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-4; }
  `],
})
export class DetallesPage {
  readonly auth = inject(AuthService);
  readonly profile = inject(ProfileService);
  private readonly shipment = inject(ShipmentService);
  private readonly router = inject(Router);

  readonly sub = signal(1);
  readonly attempted = signal(false);
  packageName = '';

  // Login inline: iniciar sesión sin abandonar el wizard (flujo 07 de DEBOX).
  readonly showLogin = signal(false);
  readonly loggingIn = signal(false);
  readonly loginError = signal<string | null>(null);
  loginEmail = '';
  loginPassword = '';

  inlineLogin(f: NgForm): void {
    if (f.invalid) {
      f.form.markAllAsTouched();
      return;
    }
    this.loggingIn.set(true);
    this.loginError.set(null);
    this.auth.login(this.loginEmail, this.loginPassword).subscribe({
      next: () => this.loggingIn.set(false),
      error: (e: Error) => {
        this.loginError.set(e.message);
        this.loggingIn.set(false);
      },
    });
  }

  /** Un campo enseña su error si es inválido y ya fue tocado o hubo intento de envío. */
  showError(ctrl: { invalid: boolean | null; touched: boolean | null }): boolean {
    return !!ctrl.invalid && (!!ctrl.touched || this.attempted());
  }

  next(f: NgForm): void {
    this.attempted.set(true);
    if (f.invalid) {
      f.form.markAllAsTouched();
      return;
    }
    this.shipment.setPackageName(this.packageName);
    this.sub.set(2);
  }

  onOrigin(address: Address): void {
    this.shipment.setOrigin(address);
    this.sub.set(3);
  }

  onDestination(address: Address): void {
    this.shipment.setDestination(address);
    this.router.navigate(['/envio/revision']);
  }
}
