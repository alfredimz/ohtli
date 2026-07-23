import { Routes } from '@angular/router';
import { selectionGuard } from './core/guards/selection.guard';

/**
 * Rutas de la aplicación. Cada pantalla se carga de forma diferida con
 * `loadComponent` (lazy loading de componentes standalone): el código de cada
 * vista se descarga solo cuando el usuario navega a ella.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
    title: 'OHTLI · Cotiza y compara tu envío',
  },

  // ---- Flujo de cotización ----
  {
    path: 'cotizar/resultados',
    loadComponent: () => import('./pages/resultados/resultados').then((m) => m.ResultadosPage),
    title: 'OHTLI · Resultados de cotización',
  },

  // ---- Flujo de contratación (guest, protegido por selección previa) ----
  {
    path: 'envio/detalles',
    canActivate: [selectionGuard],
    loadComponent: () => import('./pages/detalles/detalles').then((m) => m.DetallesPage),
    title: 'OHTLI · Detalles del envío',
  },
  {
    path: 'envio/revision',
    canActivate: [selectionGuard],
    loadComponent: () => import('./pages/revision/revision').then((m) => m.RevisionPage),
    title: 'OHTLI · Revisa tu pedido',
  },
  {
    path: 'envio/pago',
    canActivate: [selectionGuard],
    loadComponent: () => import('./pages/pago/pago').then((m) => m.PagoPage),
    title: 'OHTLI · Pago',
  },
  {
    path: 'envio/confirmacion',
    loadComponent: () => import('./pages/confirmacion/confirmacion').then((m) => m.ConfirmacionPage),
    title: 'OHTLI · Envío contratado',
  },

  // ---- Rastreo ----
  {
    path: 'rastrear',
    loadComponent: () => import('./pages/rastrear/rastrear').then((m) => m.RastrearPage),
    title: 'OHTLI · Rastrea tu guía',
  },

  // ---- Cuenta ----
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginPage),
    title: 'OHTLI · Iniciar sesión',
  },
  {
    path: 'auth/registro',
    loadComponent: () => import('./pages/auth/registro').then((m) => m.RegistroPage),
    title: 'OHTLI · Crear cuenta',
  },
  {
    path: 'mis-envios',
    loadComponent: () => import('./pages/mis-envios/mis-envios').then((m) => m.MisEnviosPage),
    title: 'OHTLI · Mis envíos',
  },

  // ---- Ayuda ----
  {
    path: 'ayuda/faq',
    loadComponent: () => import('./pages/faq/faq').then((m) => m.FaqPage),
    title: 'OHTLI · Preguntas frecuentes',
  },

  { path: '**', redirectTo: '' },
];
