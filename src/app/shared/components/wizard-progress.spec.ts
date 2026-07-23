import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WizardProgressComponent } from './wizard-progress';

/**
 * Blinda el flujo de contratación de 5 pasos (Cotizar → Detalles → Revisión →
 * Pago → Confirmación). Evita que se reintroduzca la contradicción con el
 * documento, que afirma un "indicador de cinco pasos".
 */
describe('WizardProgressComponent', () => {
  let fixture: ComponentFixture<WizardProgressComponent>;
  let element: HTMLElement;

  const labels = () =>
    Array.from(element.querySelectorAll('.wp__label')).map((el) => el.textContent!.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [WizardProgressComponent] });
    fixture = TestBed.createComponent(WizardProgressComponent);
    fixture.componentRef.setInput('current', 4);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('define exactamente los 5 pasos del flujo, con Confirmación al final', () => {
    expect(fixture.componentInstance.steps).toEqual([
      'Cotizar',
      'Detalles',
      'Revisión',
      'Pago',
      'Confirmación',
    ]);
  });

  it('renderiza 5 pasos', () => {
    expect(element.querySelectorAll('.wp__step').length).toBe(5);
    expect(labels()).toEqual(['Cotizar', 'Detalles', 'Revisión', 'Pago', 'Confirmación']);
  });

  it('marca como activo el paso actual', () => {
    const active = element.querySelector('.wp__step.is-active .wp__label');
    expect(active?.textContent?.trim()).toBe('Pago'); // current = 4
  });

  it('expone el total de pasos en el aria-label accesible', () => {
    const ol = element.querySelector('.wp');
    expect(ol?.getAttribute('aria-label')).toBe('Paso 4 de 5');
  });
});
