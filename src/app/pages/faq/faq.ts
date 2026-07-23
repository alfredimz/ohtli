import { ChangeDetectionStrategy, Component } from '@angular/core';

interface QA { q: string; a: string; }

/** Preguntas frecuentes (acordeón nativo con <details>). */
@Component({
  selector: 'app-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container page">
      <h2>Preguntas frecuentes</h2>
      <div class="faq">
        @for (item of items; track item.q) {
          <details class="faq__item">
            <summary>{{ item.q }}</summary>
            <p>{{ item.a }}</p>
          </details>
        }
      </div>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding: $space-5 0; max-width: 720px; }
    .faq { display: flex; flex-direction: column; gap: $space-2; margin-top: $space-4; }
    .faq__item { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3 $space-4; }
    summary { cursor: pointer; font-weight: $font-weight-black; color: $purple-regular; }
    .faq__item p { color: $color-text-secondary; margin: $space-2 0 0; }
  `],
})
export class FaqPage {
  readonly items: QA[] = [
    { q: '¿Necesito una cuenta para cotizar?', a: 'No. Puedes cotizar y comparar precios de todas las paqueterías sin registrarte. La cuenta solo es necesaria si quieres guardar direcciones o ver tu historial.' },
    { q: '¿Cómo consigue OHTLI precios más bajos?', a: 'OHTLI negocia tarifas preferentes con Redpack, FedEx, DHL e iVoy gracias al volumen agregado de envíos, y traslada ese descuento al usuario.' },
    { q: '¿Puedo rastrear mi envío sin iniciar sesión?', a: 'Sí. Con tu número de guía puedes consultar el estado del envío de forma anónima desde la sección Rastrear.' },
    { q: '¿Puedo facturar mi compra?', a: 'Sí. Durante el pago puedes indicar que requieres factura e ingresar tus datos fiscales (RFC).' },
    { q: '¿Qué pasa si me equivoco en la dirección?', a: 'Antes de pagar verás una pantalla de revisión con todos los datos del envío para que puedas corregir cualquier dato.' },
  ];
}
