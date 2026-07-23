import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label class="field__label" for="email">Correo</label>
            <input id="email" class="input" name="email" type="email" required [(ngModel)]="email" />
          </div>
          <div class="field">
            <label class="field__label" for="pass">Contraseña</label>
            <input id="pass" class="input" name="pass" type="password" required [(ngModel)]="password" />
          </div>
          <app-button type="submit" [block]="true" [disabled]="f.invalid || loading()">
            {{ loading() ? 'Entrando…' : 'Entrar' }}
          </app-button>
        </form>
        <p class="alt">¿No tienes cuenta? <a routerLink="/auth/registro">Crea una</a></p>
      </div>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding: $space-6 0; max-width: 420px; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-5; }
    .alt { margin-top: $space-3; font-size: $font-size-body; color: $color-text-secondary; }
  `],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);

  submit(): void {
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe(() => {
      this.router.navigate(['/mis-envios']);
    });
  }
}
