import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
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
      const saved = localStorage.getItem('butcoint-user');
      if (saved) this.currentUser.set(JSON.parse(saved));
    }
  }

  // ─── Login real contra el backend ─────────────────────────────────────────
  loginReal(email: string, password: string): Observable<boolean> {
    return this.api.login({ email, password }).pipe(
      tap(res => {
        // Guardar token JWT
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('butcoint-token', res.accessToken);
        }
        // Mapear usuario del backend al modelo local
        const user: User = {
          id:     res.usuario.id,
          nombre: res.usuario.nombre,
          email:  res.usuario.email,
          rol:    this.mapRol(res.usuario.roles),
          estado: res.usuario.estado as 'ACTIVO' | 'INACTIVO',
        };
        this.currentUser.set(user);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('butcoint-user', JSON.stringify(user));
        }
        this.router.navigate(['/dashboard']);
      }),
      // Si el backend falla → intentamos con mock
      catchError(() => of(false as any))
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
    if (roles.includes('ADMIN'))      return 'ADMIN';
    if (roles.includes('SUPERVISOR')) return 'SUPERVISOR';
    return 'VENDEDOR';
  }
}
