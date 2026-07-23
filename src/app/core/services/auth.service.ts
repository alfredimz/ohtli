import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models';
import { mockLookup, mockResponse } from './mock-http';
import { clearState, loadState, saveState } from './storage';

/** Contraseña de demostración que simula credenciales incorrectas. */
export const WRONG_PASSWORD_DEMO = 'error123';

/**
 * Autenticación simulada. Reproduce `POST /api/auth/login` y
 * `POST /api/auth/register`. El registro deja el email como NO verificado y
 * `verifyEmail()` simula el clic en el enlace de confirmación (resuelve P06).
 *
 * El login NUNCA es obligatorio para cotizar ni para contratar (guest flow):
 * solo habilita funciones de usuario recurrente como "Mis envíos".
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSig = signal<User | null>(loadState<User>('session'));

  readonly user = this.userSig.asReadonly();
  readonly isAuthenticated = computed(() => this.userSig() !== null);

  /**
   * Rol administrador simulado (flujo «Pedidos para administradores»):
   * cualquier correo que empiece con `admin@` entra con rol admin.
   */
  readonly isAdmin = computed(() => this.userSig()?.email.toLowerCase().startsWith('admin@') ?? false);

  login(email: string, password: string): Observable<User> {
    // Regla determinista para demostrar el caso de error de credenciales
    // (pantalla «Iniciar sesión – error» del flujo 09).
    if (password === WRONG_PASSWORD_DEMO) {
      return mockLookup<User>(null, 'Correo o contraseña incorrectos. Verifica tus datos.');
    }
    const user: User = { name: this.nameFromEmail(email), email, emailVerified: true };
    return mockResponse(user).pipe(tap((u) => this.setUser(u)));
  }

  register(name: string, email: string, _password: string): Observable<User> {
    const user: User = { name, email, emailVerified: false };
    return mockResponse(user, 800).pipe(tap((u) => this.setUser(u)));
  }

  /** Simula la verificación del correo (enlace del email de confirmación). */
  verifyEmail(): Observable<User> {
    const current = this.userSig();
    const verified: User = { ...(current as User), emailVerified: true };
    return mockResponse(verified, 500).pipe(tap((u) => this.setUser(u)));
  }

  logout(): void {
    this.setUser(null);
  }

  /** Actualiza la sesión y la persiste (sobrevive a recargar la página). */
  private setUser(user: User | null): void {
    this.userSig.set(user);
    if (user) saveState('session', user);
    else clearState('session');
  }

  private nameFromEmail(email: string): string {
    const handle = email.split('@')[0] ?? 'Usuario';
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
}
