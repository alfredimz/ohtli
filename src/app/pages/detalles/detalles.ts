import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Address } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ShipmentService } from '../../core/services/shipment.service';
import { AddressFormComponent } from '../../shared/components/address-form';
import { WizardProgressComponent } from '../../shared/components/wizard-progress';
import { ButtonComponent } from '../../shared/ui/button';

/**
 * Detalles del envío (paso 2/5). Tres sub-pasos con su propio estado:
 * 1) datos del paquete · 2) dirección de origen · 3) dirección de destino.
 * Es un flujo guest: el login es diferido y opcional (resuelve P01).
 */
@Component({
  selector: 'app-detalles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AddressFormComponent, WizardProgressComponent, ButtonComponent, RouterLink],
  template: `
    <section class="container page">
      <app-wizard-progress [current]="2" />

      @if (!auth.isAuthenticated()) {
        <p class="guest">
          Continúas como invitado.
          <a routerLink="/auth/login">Inicia sesión</a> si quieres guardar tus direcciones.
        </p>
      }

      <div class="substeps">
        <span [class.on]="sub() === 1">1 · Paquete</span>
        <span [class.on]="sub() === 2">2 · Origen</span>
        <span [class.on]="sub() === 3">3 · Destino</span>
      </div>

      @switch (sub()) {
        @case (1) {
          <form class="card" (ngSubmit)="next()" #f="ngForm">
            <h3>¿Qué envías?</h3>
            <div class="field">
              <label class="field__label" for="pkg">Descripción del paquete</label>
              <input id="pkg" class="input" name="pkg" required
                     placeholder="Ej. Ropa, 1 caja mediana" [(ngModel)]="packageName" />
            </div>
            <app-button type="submit" [block]="true" [disabled]="!!f.invalid">Continuar</app-button>
          </form>
        }
        @case (2) {
          <app-address-form id="origen" title="Dirección de origen"
                            submitLabel="Continuar al destino" (save)="onOrigin($event)" />
        }
        @case (3) {
          <app-address-form id="destino" title="Dirección de destino"
                            submitLabel="Revisar pedido" (save)="onDestination($event)" />
        }
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding: $space-5 0; max-width: 640px; }
    .guest { background: $dimgray-light-4; color: $purple-regular; padding: $space-2 $space-3; border-radius: $rounded-sm; }
    .substeps { display: flex; gap: $space-3; margin: $space-3 0 $space-4; font-size: $font-size-body; color: $color-text-disabled; }
    .substeps .on { color: $purple-regular; font-weight: $font-weight-black; }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-4; }
  `],
})
export class DetallesPage {
  readonly auth = inject(AuthService);
  private readonly shipment = inject(ShipmentService);
  private readonly router = inject(Router);

  readonly sub = signal(1);
  packageName = '';

  next(): void {
    this.shipment.setPackageName(this.packageName);
    this.sub.set(2);
  }

  onOrigin(address: Address): void {
    this.shipment.setOrigin(address);
    this.sub.set(3);
  }

  onDestination(address: Address): void {
    this.shipment.setDestination(address);
    this.router.navigate(['/envio/revision']);
  }
}
