import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pie de página corporativo con enlaces legales y de ayuda. */
@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer__inner container">
        <img src="/assets/img/logo-ohtli-normal.svg" alt="OHTLI" height="24" />
        <p class="footer__tagline">Compara y contrata mensajería en México desde un solo lugar.</p>
        <nav class="footer__links" aria-label="Enlaces del pie">
          <a routerLink="/ayuda/faq">Preguntas frecuentes</a>
          <a routerLink="/terminos">Términos y condiciones</a>
          <a routerLink="/contacto">Contacto</a>
        </nav>
        <p class="footer__legal">Prototipo académico · TFM UNIR · {{ year }}</p>
      </div>
    </footer>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .footer { background: $purple-regular; color: $white; margin-top: $space-7; padding: $space-5 0; }
    .footer__inner { display: flex; flex-direction: column; gap: $space-2; align-items: flex-start; }
    .footer__tagline { margin: 0; font-size: $font-size-section; }
    .footer__links { display: flex; gap: $space-4; flex-wrap: wrap; }
    .footer__links a { color: $white; font-size: $font-size-body; text-decoration: underline; }
    .footer__legal { margin: 0; font-size: $font-size-micro; color: $dimgray-light-3; }
  `],
})
export class FooterComponent {
  readonly year = 2026;
}
