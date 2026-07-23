import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Pie de página corporativo. */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer__inner container">
        <img src="/assets/img/logo-ohtli-normal.svg" alt="OHTLI" height="24" />
        <p class="footer__tagline">Compara y contrata mensajería en México desde un solo lugar.</p>
        <p class="footer__legal">Prototipo académico · TFM UNIR · {{ year }}</p>
      </div>
    </footer>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .footer { background: $purple-regular; color: $white; margin-top: $space-7; padding: $space-5 0; }
    .footer__inner { display: flex; flex-direction: column; gap: $space-2; align-items: flex-start; }
    .footer__tagline { margin: 0; font-size: $font-size-section; }
    .footer__legal { margin: 0; font-size: $font-size-micro; color: $dimgray-light-3; }
  `],
})
export class FooterComponent {
  readonly year = 2026;
}
