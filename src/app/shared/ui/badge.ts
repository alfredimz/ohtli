import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant = 'discount' | 'success' | 'info';

/** Átomo Badge: etiqueta compacta (descuento, estado, info). */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'badge badge--' + variant()"><ng-content /></span>`,
  styles: [`
    @use 'styles/tokens' as *;

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px $space-2;
      font-size: $font-size-micro;
      font-weight: $font-weight-black;
      letter-spacing: .02em;
      border-radius: $rounded-full;
      white-space: nowrap;
    }
    .badge--discount { background: rgba($orange-regular, .15); color: $orange-dark; }
    .badge--success  { background: rgba($green-regular, .15);  color: #047857; }
    .badge--info     { background: $dimgray-light-4;            color: $purple-regular; }
  `],
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('info');
}
