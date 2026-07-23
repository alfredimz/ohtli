import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui/button';

/** Inicio de sesión. El login es opcional en OHTLI (no bloquea cotizar/contratar). */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, ButtonComponent],
  template: `
    <section class="container page">
      <div class="card">
        <h2>Iniciar sesión</h2>
        @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
        <form (ngSubmit)="submit(f)" #f="ngForm" novalidate>
          <div class="field">
            <label class="field__label" for="email">Correo</label>
            <input id="email" class="input" name="email" type="email" required email #emailM="ngModel"
                   [class.is-error]="showError(emailM)" [(ngModel)]="email" />
            @if (showError(emailM)) { <span class="field__error">Escribe un correo válido.</span> }
          </div>
          <div class="field">
            <label class="field__label" for="pass">Contraseña</label>
            <input id="pass" class="input" name="pass" type="password" required #passM="ngModel"
                   [class.is-error]="showError(passM)" [(ngModel)]="password" />
            @if (showError(passM)) { <span class="field__error">Escribe tu contraseña.</span> }
          </div>
          <app-button type="submit" [block]="true" [disabled]="loading()">
            {{ loading() ? 'Entrando…' : 'Entrar' }}
          </app-button>
        </form>
        <p class="alt">¿No tienes cuenta? <a routerLink="/auth/registro">Crea una</a></p>
        <p class="demo">Demo: cualquier correo inicia sesión · un correo <strong>admin&#64;…</strong> activa el rol administrador · la contraseña <strong>error123</strong> simula credenciales incorrectas.</p>
      </div>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-6; max-width: 420px; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-5; }
    .alt { margin-top: $space-3; font-size: $font-size-body; color: $color-text-secondary; }
    .demo { margin-top: $space-2; font-size: $font-size-micro; color: $color-text-disabled; }
    .err { background: rgba($red-regular, .08); color: $red-regular; font-weight: $font-weight-semibold;
           font-size: $font-size-body; border-radius: $rounded-sm; padding: $space-2 $space-3; margin: $space-2 0 $space-3; }
  `],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly attempted = signal(false);
  readonly error = signal<string | null>(null);

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
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/mis-envios']),
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
