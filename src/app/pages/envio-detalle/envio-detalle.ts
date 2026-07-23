import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { downloadFile } from '../../core/services/list-utils';
import { AuthService } from '../../core/services/auth.service';
import { ShipmentService, ShipmentSummary } from '../../core/services/shipment.service';
import { TrackingService } from '../../core/services/tracking.service';
import { TrackingInfo } from '../../core/models';
import { TrackingTimelineComponent } from '../../shared/components/tracking-timeline';
import { BadgeComponent } from '../../shared/ui/badge';
import { ButtonComponent } from '../../shared/ui/button';

const STATUS_LABEL: Record<ShipmentSummary['status'], string> = {
  recoleccion: 'En recolección',
  en_camino: 'En camino',
  en_reparto: 'En reparto',
  entregado: 'Entregado',
};

/**
 * Detalle de un envío del historial («Envíos - Detalles y factura», flujo 05/10):
 * resumen del servicio, rastreo integrado y descarga de la factura simulada.
 */
@Component({
  selector: 'app-envio-detalle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, TrackingTimelineComponent, BadgeComponent, ButtonComponent],
  template: `
    <section class="container page">
      @if (!auth.isAuthenticated()) {
        <div class="gate">
          <p>Inicia sesión para consultar el detalle de tus envíos.</p>
          <a routerLink="/auth/login"><app-button variant="secondary">Iniciar sesión</app-button></a>
        </div>
      } @else if (loading()) {
        <div class="state">Cargando el envío…</div>
      } @else if (!shipmentData()) {
        <div class="state">
          No encontramos la guía «{{ guide }}» en tu historial.
          <a routerLink="/mis-envios">Volver a Mis envíos</a>
        </div>
      } @else {
        <a class="back" routerLink="/mis-envios">← Mis envíos</a>
        <header class="head">
          <div>
            <h2>Guía {{ shipmentData()!.guide }}</h2>
            <p class="sub">{{ shipmentData()!.carrierName }} · {{ shipmentData()!.serviceLabel }}</p>
          </div>
          <app-badge [variant]="shipmentData()!.status === 'entregado' ? 'success' : 'info'">
            {{ label(shipmentData()!.status) }}
          </app-badge>
        </header>

        <div class="grid">
          <article class="card">
            <h3>Destino</h3>
            <p class="big">{{ shipmentData()!.destinationCity }}</p>
          </article>
          <article class="card">
            <h3>Contratado</h3>
            <p class="big">{{ shipmentData()!.createdAt | date:'mediumDate' }}</p>
          </article>
          <article class="card">
            <h3>Total pagado</h3>
            <p class="big">{{ shipmentData()!.total | currency:'MXN':'symbol-narrow' }}</p>
          </article>
        </div>

        <div class="actions">
          <app-button variant="primary" (pressed)="downloadInvoice()">Descargar factura</app-button>
          <a [routerLink]="['/rastrear']" [queryParams]="{ guia: guide }">
            <app-button variant="ghost">Abrir en Rastrear</app-button>
          </a>
        </div>

        @if (tracking(); as t) {
          <h3 class="tl-title">Historial de rastreo</h3>
          <app-tracking-timeline [info]="t" />
        }
      }
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 720px; }
    .gate, .state { background: $dimgray-light-1; border-radius: $rounded; padding: $space-5; text-align: center; color: $color-text-secondary; }
    .gate p { margin-bottom: $space-3; }
    .back { display: inline-block; margin-bottom: $space-3; font-weight: $font-weight-semibold; }
    .head { display: flex; justify-content: space-between; align-items: center; gap: $space-2; flex-wrap: wrap; margin-bottom: $space-3; }
    .sub { color: $color-text-secondary; margin: $space-1 0 0; }
    .grid { display: grid; gap: $space-3; grid-template-columns: 1fr; margin-bottom: $space-4; @include md { grid-template-columns: repeat(3, 1fr); } }
    .card { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3; }
    .card h3 { font-size: $font-size-body; color: $color-text-secondary; text-transform: uppercase; letter-spacing: .04em; margin-bottom: $space-1; }
    .big { font-size: $font-size-card; font-weight: $font-weight-black; color: $color-text; margin: 0; }
    .actions { display: flex; gap: $space-3; flex-wrap: wrap; margin-bottom: $space-5; }
    .tl-title { margin-bottom: $space-3; }
    @include xs-only {
      .actions { flex-direction: column; }
      .actions app-button, .actions a { display: grid; }
    }
  `],
})
export class EnvioDetallePage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly shipmentService = inject(ShipmentService);
  private readonly trackingService = inject(TrackingService);

  guide = '';
  readonly loading = signal(true);
  readonly shipmentData = signal<ShipmentSummary | null>(null);
  readonly tracking = signal<TrackingInfo | null>(null);

  ngOnInit(): void {
    this.guide = this.route.snapshot.paramMap.get('guide') ?? '';
    if (!this.auth.isAuthenticated()) { this.loading.set(false); return; }

    this.shipmentService.getMyShipments().subscribe((list) => {
      this.shipmentData.set(list.find((s) => s.guide === this.guide) ?? null);
      this.loading.set(false);
    });
    this.trackingService.track(this.guide).subscribe({
      next: (info) => this.tracking.set(info),
      error: () => this.tracking.set(null),
    });
  }

  label(status: ShipmentSummary['status']): string {
    return STATUS_LABEL[status];
  }

  /** Genera y descarga la factura simulada (HTML) del envío. */
  downloadInvoice(): void {
    const s = this.shipmentData();
    if (!s) return;
    const iva = s.total * 0.16 / 1.16;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura ${s.guide}</title>
<style>body{font-family:system-ui;margin:40px;color:#383943}h1{color:#493B77}table{border-collapse:collapse;width:100%;margin-top:16px}
td,th{border:1px solid #E8E8E8;padding:8px;text-align:left}.tot{font-weight:bold}</style></head><body>
<h1>OHTLI · Factura simulada</h1>
<p>Sistema de Cotización y Contratación Ohtli — comprobante de demostración (TFM UNIR). Sin validez fiscal.</p>
<table>
<tr><th>Guía</th><td>${s.guide}</td></tr>
<tr><th>Servicio</th><td>${s.carrierName} · ${s.serviceLabel}</td></tr>
<tr><th>Destino</th><td>${s.destinationCity}</td></tr>
<tr><th>Fecha</th><td>${s.createdAt}</td></tr>
<tr><th>Subtotal</th><td>$${(s.total - iva).toFixed(2)} MXN</td></tr>
<tr><th>IVA (16%)</th><td>$${iva.toFixed(2)} MXN</td></tr>
<tr class="tot"><th>Total</th><td>$${s.total.toFixed(2)} MXN</td></tr>
</table></body></html>`;
    downloadFile(`factura-${s.guide}.html`, html, 'text/html;charset=utf-8');
  }
}
