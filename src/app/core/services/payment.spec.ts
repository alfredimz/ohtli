import { evaluateCard } from './payment';

describe('evaluateCard (simulación de pasarela)', () => {
  it('acepta una tarjeta normal', () => {
    expect(evaluateCard('4242 4242 4242 4242')).toBe('ok');
  });

  it('rechaza la tarjeta de prueba terminada en 0000', () => {
    expect(evaluateCard('4242 4242 4242 0000')).toBe('declined');
  });

  it('ignora espacios y guiones al evaluar', () => {
    expect(evaluateCard('4242-4242-4242-0000')).toBe('declined');
  });
});
