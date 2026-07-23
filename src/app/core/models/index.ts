// Modelos de dominio de OHTLI (comparador/contratador de mensajería).

export type ServiceType = 'terrestre' | 'estandar' | 'express' | 'sameday';

/** Servicio concreto ofertado por una paquetería. */
export interface CarrierService {
  type: ServiceType;
  label: string;
  days: string;          // tiempo estimado de entrega, p. ej. "3-5"
  listPrice: number;     // precio de lista (MXN)
  discount: number;      // % de descuento negociado por OHTLI
  ohtliPrice: number;    // precio final con tarifa preferente OHTLI
}

/** Paquetería integrada (Redpack, FedEx, DHL, iVoy). */
export interface Carrier {
  id: string;
  name: string;
  logo: string | null;
  services: CarrierService[];
}

/** Datos del paquete a cotizar. */
export interface ParcelInput {
  kind: 'paquete' | 'sobre';
  originZip: string;
  destinationZip: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

/** Una opción de envío concreta devuelta por la cotización. */
export interface QuoteOption {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierLogo: string | null;
  serviceType: ServiceType;
  serviceLabel: string;
  days: string;
  listPrice: number;
  discount: number;
  ohtliPrice: number;
}

/** Dirección de origen o destino. */
export interface Address {
  fullName: string;
  phone: string;
  street: string;
  extNumber: string;
  intNumber?: string;
  neighborhood: string;   // colonia
  zip: string;
  city: string;
  state: string;
  references?: string;
}

/** Borrador de envío que se va completando a lo largo del wizard. */
export interface ShipmentDraft {
  parcel: ParcelInput | null;
  selectedOption: QuoteOption | null;
  packageName: string;
  origin: Address | null;
  destination: Address | null;
}

/** Envío ya contratado (respuesta del "back-end" simulado). */
export interface Shipment {
  guide: string;          // número de guía generado
  carrierName: string;
  serviceLabel: string;
  origin: Address;
  destination: Address;
  total: number;
  createdAt: string;      // ISO
  status: TrackingStatus;
}

export type TrackingStatus = 'recoleccion' | 'en_camino' | 'en_reparto' | 'entregado';

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  event: string;
}

export interface TrackingInfo {
  guide: string;
  carrier: string;
  status: TrackingStatus;
  events: TrackingEvent[];
}

export interface User {
  name: string;
  email: string;
  emailVerified: boolean;
}
