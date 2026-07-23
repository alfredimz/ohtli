import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

/** Barra de navegación principal. Responsive con menú colapsable en móvil. */
@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="nav">
      <div class="nav__inner container">
        <a routerLink="/" class="nav__brand" aria-label="OHTLI — inicio">
          <img src="/assets/img/logo-ohtli-normal.svg" alt="OHTLI" height="28" />
        </a>

        <button class="nav__toggle" (click)="toggle()" aria-label="Menú">
          <img src="/assets/img/icon-menu-purple.svg" alt="" width="24" height="24" />
        </button>

        <nav class="nav__links" [class.is-open]="open()">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="close()">Cotizar</a>
          <a routerLink="/rastrear" routerLinkActive="active" (click)="close()">Rastrear</a>
          <a routerLink="/mis-envios" routerLinkActive="active" (click)="close()">Mis envíos</a>
          <a routerLink="/ayuda/faq" routerLinkActive="active" (click)="close()">Ayuda</a>
          <a routerLink="/contacto" routerLinkActive="active" (click)="close()">Contacto</a>
          @if (cart.count() > 0) {
            <a routerLink="/envios-por-pagar" routerLinkActive="active" (click)="close()">Carrito ({{ cart.count() }})</a>
          }

          @if (auth.isAuthenticated()) {
            <a routerLink="/buscar" routerLinkActive="active" (click)="close()">Buscar</a>
            <a routerLink="/mis-datos" routerLinkActive="active" (click)="close()">Mis datos</a>
            @if (auth.isAdmin()) {
              <a routerLink="/admin/pedidos" routerLinkActive="active" (click)="close()">Pedidos</a>
            }
            <span class="nav__user">Hola, {{ auth.user()!.name }}</span>
            <a routerLink="/" (click)="logout()" class="nav__login">Salir</a>
          } @else {
            <a routerLink="/auth/login" routerLinkActive="active" (click)="close()" class="nav__login">Iniciar sesión</a>
          }
        </nav>
      </div>
    </header>
  `,
  styles: [`
    @use 'styles/tokens' as *;

    .nav { background: $white; border-bottom: 1px solid $color-border; position: sticky; top: 0; z-index: 50; }
    .nav__inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .nav__brand { display: inline-flex; align-items: center; }
    /* El nav colapsa a hamburguesa hasta lg (1024): con sesión llega a tener
       11 elementos y en el rango tablet (768-1023) desbordaba con scroll. */
    .nav__toggle { display: inline-flex; background: none; border: 0; cursor: pointer; @include lg { display: none; } }

    .nav__links {
      display: none;
      flex-direction: column;
      gap: $space-2;
      position: absolute; left: 0; right: 0; top: 64px;
      background: $white; padding: $space-3; border-bottom: 1px solid $color-border;
      box-shadow: $shadow;

      &.is-open { display: flex; }

      a { color: $color-text; font-weight: $font-weight-semibold; padding: $space-2 0; }
      a.active { color: $purple-regular; }
      a:hover { text-decoration: none; color: $purple-regular; }

      @include lg {
        display: flex; flex-direction: row; align-items: center; gap: $space-4;
        position: static; padding: 0; border: 0; box-shadow: none; background: none;
      }
    }

    .nav__user { color: $color-text-secondary; font-size: $font-size-body; }
    .nav__login {
      color: $purple-regular !important; font-weight: $font-weight-black;
      border: 1px solid $color-border; border-radius: $rounded-sm; padding: 8px $space-3 !important;
    }
  `],
})
export class NavComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly open = signal(false);

  toggle(): void { this.open.update((v) => !v); }
  close(): void { this.open.set(false); }
  logout(): void { this.auth.logout(); this.close(); }
}
