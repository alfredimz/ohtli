/**
 * Simulación de la pasarela de pago (mock, sin back-end real).
 *
 * Regla determinista para poder demostrar y probar el caso de error del flujo
 * Pagar (pantalla «Error» del diseño): toda tarjeta cuyos dígitos terminen en
 * `0000` se rechaza; cualquier otra se acepta. En producción este resultado
 * vendría del PSP (Stripe/Conekta/etc.).
 */
export type PaymentOutcome = 'ok' | 'declined';

/** Tarjeta de prueba documentada en la UI para provocar el rechazo. */
export const DECLINED_CARD_SUFFIX = '0000';

export function evaluateCard(cardNumber: string): PaymentOutcome {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.endsWith(DECLINED_CARD_SUFFIX) ? 'declined' : 'ok';
}
