import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * WizardProgress — indicador de progreso global del flujo de contratación.
 * Resuelve el problema UX P03 (el prototipo no mostraba en qué paso estaba el
 * usuario). Pasos fijos: Cotizar → Detalles → Revisión → Pago → Confirmación.
 */
@Component({
  selector: 'app-wizard-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="wp" [attr.aria-label]="'Paso ' + current() + ' de ' + steps.length">
      @for (step of steps; track step; let i = $index) {
        <li class="wp__step"
            [class.is-done]="i + 1 < current()"
            [class.is-active]="i + 1 === current()">
          <span class="wp__dot">{{ i + 1 }}</span>
          <span class="wp__label">{{ step }}</span>
        </li>
      }
    </ol>
  `,
  styles: [`
    @use 'styles/tokens' as *;

    .wp { display: flex; list-style: none; margin: 0 0 $space-5; padding: 0; gap: $space-2; }
    .wp__step {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: $space-1;
      position: relative; color: $color-text-disabled; font-size: $font-size-micro; text-align: center;

      &::before {
        content: ''; position: absolute; top: 15px; left: -50%; width: 100%; height: 2px;
        background: $dimgray-light-3; z-index: 0;
      }
      &:first-child::before { display: none; }
    }
    .wp__dot {
      width: 32px; height: 32px; border-radius: $rounded-full; z-index: 1;
      display: inline-flex; align-items: center; justify-content: center;
      background: $dimgray-light-3; color: $white; font-weight: $font-weight-black;
    }
    .wp__label { font-weight: $font-weight-semibold; }

    .wp__step.is-active { color: $purple-regular; }
    .wp__step.is-active .wp__dot { background: $purple-regular; }
    .wp__step.is-done { color: $green-regular; }
    .wp__step.is-done .wp__dot { background: $green-regular; }
    .wp__step.is-done::before,
    .wp__step.is-active::before { background: $purple-light; }
  `],
})
export class WizardProgressComponent {
  /** Paso actual (1-indexado). */
  readonly current = input.required<number>();
  readonly steps = ['Cotizar', 'Detalles', 'Revisión', 'Pago', 'Confirmación'];

  protected readonly total = computed(() => this.steps.length);
}
