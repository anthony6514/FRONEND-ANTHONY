import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router     = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Solo en browser leemos localStorage
  const token = isPlatformBrowser(platformId)
    ? localStorage.getItem('butcoint-token')
    : null;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isPlatformBrowser(platformId)) {
        localStorage.removeItem('butcoint-token');
        localStorage.removeItem('butcoint-user');
        // Solo navegar si NO estamos ya en /login para evitar loops y
        // romper el ciclo de detección de cambios durante ngOnInit
        if (!router.url.startsWith('/login')) {
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
