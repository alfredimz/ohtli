import { Injectable, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models';
import { mockResponse } from './mock-http';

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
  private readonly userSig = signal<User | null>(null);

  readonly user = this.userSig.asReadonly();
  readonly isAuthenticated = computed(() => this.userSig() !== null);

  login(email: string, _password: string): Observable<User> {
    const user: User = { name: this.nameFromEmail(email), email, emailVerified: true };
    return mockResponse(user).pipe(tap((u) => this.userSig.set(u)));
  }

  register(name: string, email: string, _password: string): Observable<User> {
    const user: User = { name, email, emailVerified: false };
    return mockResponse(user, 800).pipe(tap((u) => this.userSig.set(u)));
  }

  /** Simula la verificación del correo (enlace del email de confirmación). */
  verifyEmail(): Observable<User> {
    const current = this.userSig();
    const verified: User = { ...(current as User), emailVerified: true };
    return mockResponse(verified, 500).pipe(tap((u) => this.userSig.set(u)));
  }

  logout(): void {
    this.userSig.set(null);
  }

  private nameFromEmail(email: string): string {
    const handle = email.split('@')[0] ?? 'Usuario';
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
}
