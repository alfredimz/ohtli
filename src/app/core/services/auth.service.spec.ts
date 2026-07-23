import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { User } from '../models';

/**
 * Prueba la autenticación simulada: el login deriva el nombre del email y deja
 * el correo verificado; el registro lo deja SIN verificar (resuelve P06) hasta
 * que `verifyEmail()` simula el clic en el enlace de confirmación.
 */
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('arranca sin sesión', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeNull();
  });

  it('login autentica y deriva el nombre a partir del email', fakeAsync(() => {
    let user!: User;
    service.login('ana@ohtli.mx', 'secreto').subscribe((u) => (user = u));
    tick(600);
    expect(service.isAuthenticated()).toBeTrue();
    expect(user.emailVerified).toBeTrue();
    expect(user.name).toBe('Ana');
  }));

  it('register deja el email sin verificar', fakeAsync(() => {
    let user!: User;
    service.register('Ana', 'ana@ohtli.mx', 'secreto').subscribe((u) => (user = u));
    tick(800);
    expect(user.emailVerified).toBeFalse();
    expect(service.user()?.name).toBe('Ana');
  }));

  it('verifyEmail marca el correo como verificado', fakeAsync(() => {
    service.register('Ana', 'ana@ohtli.mx', 'secreto').subscribe();
    tick(800);
    expect(service.user()?.emailVerified).toBeFalse();
    service.verifyEmail().subscribe();
    tick(500);
    expect(service.user()?.emailVerified).toBeTrue();
  }));

  it('logout limpia la sesión', fakeAsync(() => {
    service.login('ana@ohtli.mx', 'secreto').subscribe();
    tick(600);
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
  }));
});
