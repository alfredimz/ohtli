import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui/button';

/**
 * Registro con verificación de correo (resuelve P06): tras registrarse, el email
 * queda NO verificado y se muestra el paso de confirmación. `verifyEmail()`
 * simula el clic en el enlace recibido por correo.
 */
@Component({
  selector: 'app-registro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, ButtonComponent],
  template: `
    <section class="container page">
      <div class="card">
        @if (!registered()) {
          <h2>Crear cuenta</h2>
          <form (ngSubmit)="submit(f)" #f="ngForm" novalidate>
            <div class="field">
              <label class="field__label" for="name">Nombre</label>
              <input id="name" class="input" name="name" required #nameM="ngModel"
                     [class.is-error]="showError(nameM)" [(ngModel)]="name" />
              @if (showError(nameM)) { <span class="field__error">¿Cómo te llamas?</span> }
            </div>
            <div class="field">
              <label class="field__label" for="email">Correo</label>
              <input id="email" class="input" name="email" type="email" required email #emailM="ngModel"
                     [class.is-error]="showError(emailM)" [(ngModel)]="email" />
              @if (showError(emailM)) { <span class="field__error">Escribe un correo válido.</span> }
            </div>
            <div class="field">
              <label class="field__label" for="pass">Contraseña</label>
              <input id="pass" class="input" name="pass" type="password" required minlength="6" #passM="ngModel"
                     [class.is-error]="showError(passM)" [(ngModel)]="password" />
              @if (showError(passM)) { <span class="field__error">Mínimo 6 caracteres.</span> }
            </div>
            <app-button type="submit" [block]="true" [disabled]="loading()">
              {{ loading() ? 'Creando…' : 'Crear cuenta' }}
            </app-button>
          </form>
          <p class="alt">¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
        } @else if (!verified()) {
          <h2>Verifica tu correo</h2>
          <img src="/assets/img/icon-calendar-white.svg" alt="" hidden />
          <p class="lead">Enviamos un enlace de confirmación a <strong>{{ email }}</strong>.
            Haz clic en él para activar tu cuenta.</p>
          <app-button [block]="true" (pressed)="confirm()">Ya verifiqué mi correo</app-button>
        } @else {
          <h2>¡Cuenta verificada!</h2>
          <img src="/assets/img/icon-check-green.svg" alt="" width="48" height="48" />
          <p class="lead">Tu correo quedó confirmado. Ya puedes guardar direcciones y ver tu historial.</p>
          <app-button [block]="true" (pressed)="goShipments()">Ir a Mis envíos</app-button>
        }
      </div>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-6; max-width: 440px; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-5; }
    .lead { color: $color-text-secondary; }
    .alt { margin-top: $space-3; font-size: $font-size-body; color: $color-text-secondary; }
  `],
})
export class RegistroPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly registered = signal(false);
  readonly verified = signal(false);
  readonly attempted = signal(false);

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
    this.loading.set(true);
    this.auth.register(this.name, this.email, this.password).subscribe(() => {
      this.loading.set(false);
      this.registered.set(true);
    });
  }

  confirm(): void {
    this.auth.verifyEmail().subscribe(() => this.verified.set(true));
  }

  goShipments(): void { this.router.navigate(['/mis-envios']); }
}
