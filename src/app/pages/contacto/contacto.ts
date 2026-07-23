import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonComponent } from '../../shared/ui/button';

/**
 * Contacto (flujo 03, nuevo respecto al prototipo). Canales de atención +
 * formulario de mensaje con validación visible y confirmación simulada.
 */
@Component({
  selector: 'app-contacto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  template: `
    <section class="container page">
      <h2>Contacto</h2>
      <p class="intro">¿Dudas con una cotización o un envío? Escríbenos y te respondemos el mismo día hábil.</p>

      <div class="cols">
        <aside class="channels">
          <h3>Canales de atención</h3>
          <ul>
            <li><strong>Correo:</strong> hola&#64;ohtli.mx</li>
            <li><strong>Teléfono / WhatsApp:</strong> 55 5555 0100</li>
            <li><strong>Horario:</strong> L–V 9:00–19:00 · S 9:00–14:00</li>
          </ul>
          <p class="hint">Para rastrear un envío no necesitas escribirnos: usa la sección Rastrear con tu número de guía.</p>
        </aside>

        <div class="formcol">
          @if (sent()) {
            <div class="ok" role="status">
              <h3>¡Mensaje enviado!</h3>
              <p>Gracias, {{ name }}. Te contactaremos en {{ email }} a la brevedad.</p>
              <app-button variant="ghost" (pressed)="reset()">Enviar otro mensaje</app-button>
            </div>
          } @else {
            <form class="card" (ngSubmit)="submit(f)" #f="ngForm" novalidate>
              <div class="field">
                <label class="field__label" for="c-name">Nombre</label>
                <input id="c-name" class="input" name="name" required #nameM="ngModel"
                       [class.is-error]="showError(nameM)" [(ngModel)]="name" />
                @if (showError(nameM)) { <span class="field__error">¿Cómo te llamas?</span> }
              </div>
              <div class="field">
                <label class="field__label" for="c-email">Correo</label>
                <input id="c-email" class="input" name="email" type="email" required email #emailM="ngModel"
                       [class.is-error]="showError(emailM)" [(ngModel)]="email" />
                @if (showError(emailM)) { <span class="field__error">Escribe un correo válido.</span> }
              </div>
              <div class="field">
                <label class="field__label" for="c-msg">Mensaje</label>
                <textarea id="c-msg" class="textarea" name="msg" required minlength="10" #msgM="ngModel"
                          [class.is-error]="showError(msgM)" [(ngModel)]="message"></textarea>
                @if (showError(msgM)) { <span class="field__error">Cuéntanos un poco más (mínimo 10 caracteres).</span> }
              </div>
              <app-button type="submit" [block]="true">Enviar mensaje</app-button>
            </form>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 860px; }
    .intro { color: $color-text-secondary; margin: $space-2 0 $space-4; }
    .cols { display: grid; gap: $space-4; grid-template-columns: 1fr; @include md { grid-template-columns: .8fr 1.2fr; } }
    .channels { background: $dimgray-light-4; border-radius: $rounded; padding: $space-4; align-self: start; }
    .channels h3 { margin-bottom: $space-2; }
    .channels ul { list-style: none; margin: 0; padding: 0; }
    .channels li { margin-bottom: $space-2; color: $color-text; }
    .hint { font-size: $font-size-micro; color: $color-text-secondary; margin: $space-3 0 0; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; @include md { padding: $space-4; } }
    .ok { background: $white; border: 1px solid $green-regular; border-radius: $rounded; padding: $space-5; text-align: center; }
    .ok h3 { color: $green-regular; margin-bottom: $space-2; }
    .ok p { color: $color-text-secondary; margin-bottom: $space-3; }
  `],
})
export class ContactoPage {
  name = '';
  email = '';
  message = '';
  readonly sent = signal(false);
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
    this.sent.set(true);
  }

  reset(): void {
    this.message = '';
    this.attempted.set(false);
    this.sent.set(false);
  }
}
