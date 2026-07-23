import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Section { title: string; body: string[]; }

/** Términos y condiciones (flujo 04). Secciones plegables, misma UI que FAQ. */
@Component({
  selector: 'app-terminos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container page">
      <h2>Términos y condiciones</h2>
      <p class="intro">
        Última actualización: julio de 2026. Al usar OHTLI aceptas estas condiciones.
        Este documento es parte del prototipo académico del TFM y resume las cláusulas
        habituales de un servicio de intermediación de mensajería.
      </p>

      <div class="toc">
        @for (s of sections; track s.title; let i = $index) {
          <details class="toc__item" [open]="i === 0">
            <summary>{{ i + 1 }}. {{ s.title }}</summary>
            @for (p of s.body; track p) { <p>{{ p }}</p> }
          </details>
        }
      </div>
    </section>
  `,
  styles: [`
    @use 'styles/tokens' as *;
    .page { padding-block: $space-5; max-width: 720px; }
    .intro { color: $color-text-secondary; margin: $space-2 0 $space-4; }
    .toc { display: flex; flex-direction: column; gap: $space-2; }
    .toc__item { background: $white; border: 1px solid $color-border; border-radius: $rounded; padding: $space-3 $space-4; }
    summary { cursor: pointer; font-weight: $font-weight-black; color: $purple-regular; }
    .toc__item p { color: $color-text-secondary; margin: $space-2 0 0; }
  `],
})
export class TerminosPage {
  readonly sections: Section[] = [
    {
      title: 'Objeto del servicio',
      body: [
        'OHTLI es un comparador y contratador de servicios de mensajería que actúa como intermediario entre el usuario y las paqueterías integradas (Redpack, FedEx, DHL e iVoy). OHTLI no transporta paquetes: gestiona la cotización, contratación y seguimiento de guías con tarifas preferentes.',
      ],
    },
    {
      title: 'Cotizaciones y tarifas',
      body: [
        'Las cotizaciones se calculan con el peso declarado y el peso volumétrico del paquete (largo × ancho × alto / 5000); la paquetería cobrará el mayor de los dos. El precio mostrado incluye el descuento negociado por OHTLI y es válido al momento de la cotización.',
        'Diferencias entre el peso declarado y el verificado por la paquetería pueden generar cargos adicionales que se trasladan al usuario.',
      ],
    },
    {
      title: 'Recolección y entrega',
      body: [
        'Los tiempos de entrega son estimados por cada paquetería y corren a partir de la recolección efectiva. Las entregas en sucursal requieren identificación oficial del destinatario.',
        'Está prohibido enviar artículos restringidos por la legislación mexicana o por las políticas de cada transportista (dinero, armas, perecederos sin embalaje adecuado, materiales peligrosos).',
      ],
    },
    {
      title: 'Pagos y facturación',
      body: [
        'El pago se procesa al contratar el envío. Puedes solicitar factura (CFDI) durante el pago proporcionando tus datos fiscales; la factura se emite dentro de las 72 horas siguientes.',
      ],
    },
    {
      title: 'Incidencias, seguros y devoluciones',
      body: [
        'Ante pérdida o daño aplica la política de la paquetería contratada. OHTLI gestiona la reclamación en nombre del usuario. Los envíos incluyen la cobertura básica del transportista salvo contratación de seguro adicional.',
      ],
    },
    {
      title: 'Privacidad y datos personales',
      body: [
        'Los datos de contacto y direcciones se usan exclusivamente para gestionar los envíos y se comparten solo con la paquetería contratada, conforme al aviso de privacidad y a la LFPDPPP.',
      ],
    },
  ];
}
