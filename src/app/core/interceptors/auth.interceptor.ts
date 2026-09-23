import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Leer token del localStorage (solo browser)
  const token = typeof localStorage !== 'undefined'
    ? localStorage.getItem('butcoint-token')
    : null;

  // Clonar la request añadiendo el Bearer token si existe
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Si el token venció o no es válido → redirigir al login
      if (err.status === 401) {
        localStorage.removeItem('butcoint-token');
        localStorage.removeItem('butcoint-user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
