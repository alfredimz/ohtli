import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ShipmentService, ShipmentSummary } from '../../core/services/shipment.service';
import { BadgeComponent } from '../../shared/ui/badge';
import { ButtonComponent } from '../../shared/ui/button';

/** Historial de envíos del usuario (requiere sesión). */
@Component({
  selector: 'app-mis-envios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, BadgeComponent, ButtonComponent],
  template: `
    <section class="container page">
      <h2>Mis envíos</h2>

      @if (!auth.isAuthenticated()) {
        <div class="gate">
          <p>Inicia sesión para ver tu historial de envíos.</p>
          <a routerLink="/auth/login"><app-button variant="secondary">Iniciar sesión</app-button></a>
        </div>
      } @else if (loading()) {
        <div class="state">Cargando tus envíos…</div>
      } @else {
        <div class="list">
          @for (s of shipments(); track s.guide) {
            <article class="item">
              <div class="item__main">
                <span class="item__guide">Guía {{ s.guide }}</span>
                <span class="item__meta">{{ s.carrierName }} · {{ s.serviceLabel }} → {{ s.destinationCity }}</span>
                <span class="item__date">{{ s.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="item__side">
                <app-badge [variant]="s.status === 'entregado' ? 'success' : 'info'">{{ label(s.status) }}</app-badge>
                <span class="item__total">{{ s.total | currency:'MXN':'symbol-narrow' }}</span>
                <a [routerLink]="['/rastrear']" [queryParams]="{ guia: s.guide }" class="item__track">Rastrear</a>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding: $space-5 0; max-width: 820px; }
    .gate { background: $dimgray-light-1; border-radius: $rounded; padding: $space-5; text-align: center; }
    .gate p { margin-bottom: $space-3; }
    .state { padding: $space-5; text-align: center; color: $color-text-secondary; }
    .list { display: flex; flex-direction: column; gap: $space-3; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: $space-3;
            background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; flex-wrap: wrap; }
    .item__main { display: flex; flex-direction: column; }
    .item__guide { font-weight: $font-weight-black; color: $purple-regular; }
    .item__meta { color: $color-text-secondary; font-size: $font-size-body; }
    .item__date { font-size: $font-size-micro; color: $color-text-disabled; }
    .item__side { display: flex; align-items: center; gap: $space-3; }
    .item__total { font-weight: $font-weight-black; }
  `],
})
export class MisEnviosPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly shipmentService = inject(ShipmentService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly shipments = signal<ShipmentSummary[]>([]);

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) { this.loading.set(false); return; }
    this.shipmentService.getMyShipments().subscribe((list) => {
      this.shipments.set(list);
      this.loading.set(false);
    });
  }

  label(status: ShipmentSummary['status']): string {
    return { recoleccion: 'En recolección', en_camino: 'En camino', en_reparto: 'En reparto', entregado: 'Entregado' }[status];
  }
}
