import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

/**
 * Átomo Botón del design system OHTLI.
 * Variantes: primary (CTA naranja, etiqueta oscura por contraste), secondary
 * (morado de marca), ghost y danger. Estados: default / hover / disabled.
 */
@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [class]="'btn btn--' + variant() + ' btn--' + size()"
      [class.btn--block]="block()"
      (click)="pressed.emit($event)">
      <span class="btn__label"><ng-content /></span>
    </button>
  `,
  styles: [`
    @use 'styles/tokens' as *;

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: $space-2;
      font-family: $font-family-base;
      font-weight: $font-weight-black;
      font-size: $font-size-body;
      line-height: 1;
      border: 1px solid transparent;
      border-radius: $rounded-sm;
      cursor: pointer;
      transition: background-color .15s, border-color .15s, color .15s;
      white-space: nowrap;
    }
    .btn--md { padding: 11px $space-4; }
    .btn--lg { padding: 15px $space-5; font-size: $font-size-section; }
    .btn--block { display: flex; width: 100%; }

    .btn--primary {
      background: $color-cta-bg;
      color: $color-cta-label;       // texto oscuro sobre naranja (AA)
      &:hover:not(:disabled) { background: #E06A24; }
    }
    .btn--secondary {
      background: $purple-regular;
      color: $white;
      &:hover:not(:disabled) { background: $purple-strong; }
    }
    .btn--ghost {
      background: transparent;
      color: $purple-regular;
      border-color: $color-border;
      &:hover:not(:disabled) { background: $dimgray-light-4; }
    }
    .btn--danger {
      background: $red-regular;
      color: $white;
      &:hover:not(:disabled) { background: #A40303; }
    }
    .btn:disabled {
      background: $dimgray-light-3;
      color: $color-text-disabled;
      border-color: transparent;
      cursor: not-allowed;
    }
  `],
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input<boolean>(false);
  readonly block = input<boolean>(false);
  readonly pressed = output<MouseEvent>();
}
