import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ShipmentService } from '../services/shipment.service';

/**
 * Protege los pasos del flujo de contratación: si el usuario no ha cotizado ni
 * seleccionado una opción, lo devuelve al inicio. (No es autenticación: el flujo
 * es guest; solo evita entrar a un paso sin datos previos.)
 */
export const selectionGuard: CanActivateFn = () => {
  const shipment = inject(ShipmentService);
  const router = inject(Router);
  return shipment.hasSelection() ? true : router.createUrlTree(['/']);
};
