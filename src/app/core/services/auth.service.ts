import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, map } from 'rxjs';
import { User } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private router     = inject(Router);
  private api        = inject(ApiService);

  currentUser = signal<User | null>(null);

  // Mock users para cuando el backend no esté disponible
  private MOCK_USERS: User[] = [
    { id: 1, nombre: 'Chris Barón',   email: 'admin@butcoint.com',    rol: 'ADMIN',     estado: 'ACTIVO' },
    { id: 2, nombre: 'Jaime Ríos',    email: 'jaime@butcoint.com',    rol: 'VENDEDOR',  estado: 'ACTIVO' },
    { id: 3, nombre: 'Barón López',   email: 'baron@butcoint.com',    rol: 'VENDEDOR',  estado: 'ACTIVO' },
    { id: 4, nombre: 'Supervisora A', email: 'super@butcoint.com',    rol: 'SUPERVISOR',estado: 'ACTIVO' },
  ];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedUser  = localStorage.getItem('butcoint-user');
      const savedToken = localStorage.getItem('butcoint-token');
      // Solo restaurar la sesión si hay TANTO usuario como token guardados.
      // Si solo hay usuario pero no token (sesión mock o token borrado por 401),
      // limpiamos el usuario para forzar un login real con credenciales.
      if (savedUser && savedToken) {
        this.currentUser.set(JSON.parse(savedUser));
      } else {
        // Limpiar estado inconsistente
        localStorage.removeItem('butcoint-user');
        localStorage.removeItem('butcoint-token');
      }
    }
  }

  // ─── Login real contra el backend ─────────────────────────────────────────
  loginReal(email: string, password: string): Observable<boolean> {
    return this.api.login({ email, password }).pipe(
      tap(res => {
        // Guardar JWT
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('butcoint-token', res.accessToken);
        }
        // res.usuario es el BackendUser que tiene roles: string[]
        // Soportamos tanto el contrato nuevo { user } como el viejo { usuario }
        const u = (res as any).user ?? res.usuario;
        // Roles: puede ser array [ 'ROLE_ADMIN' ] o campo único rol: 'ADMIN'
        const roles: string[] = Array.isArray(u.roles)
          ? u.roles
          : (u.rol ? [u.rol] : []);
        const user: User = {
          id:     u.id,
          nombre: u.nombre,
          email:  u.email,
          rol:    this.mapRol(roles),
          estado: (u.estado ?? 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
        };
        this.currentUser.set(user);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('butcoint-user', JSON.stringify(user));
        }
        this.router.navigate(['/dashboard']);
      }),
      map(() => true),
      catchError(err => { throw err; })
    );
  }

  // ─── Login mock (fallback cuando el backend está caído) ───────────────────
  login(email: string, password: string): boolean {
    const user = this.MOCK_USERS.find(u => u.email === email);
    if (user && password === '123456') {
      this.currentUser.set(user);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('butcoint-user', JSON.stringify(user));
        localStorage.removeItem('butcoint-token'); // sin token real
      }
      this.router.navigate(['/dashboard']);
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('butcoint-user');
      localStorage.removeItem('butcoint-token');
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return !!this.currentUser(); }
  isAdmin(): boolean    { return this.currentUser()?.rol === 'ADMIN'; }
  hasToken(): boolean   {
    if (!isPlatformBrowser(this.platformId)) return false;
    return !!localStorage.getItem('butcoint-token');
  }

  private mapRol(roles: string[]): 'ADMIN' | 'SUPERVISOR' | 'VENDEDOR' {
    // Normaliza: elimina prefijo ROLE_ y convierte a mayúsculas
    // Soporta ['ROLE_ADMIN'], ['ADMIN'], ['admin'], etc.
    const normalized = roles.map(r => r.replace(/^ROLE_/i, '').toUpperCase());
    if (normalized.includes('ADMIN'))      return 'ADMIN';
    if (normalized.includes('SUPERVISOR')) return 'SUPERVISOR';
    return 'VENDEDOR';
  }
}
