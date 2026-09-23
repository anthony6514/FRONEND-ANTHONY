import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Interfaces que mapean las respuestas reales del backend ──────────────────

export interface LoginRequest  { email: string; password: string; }
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: BackendUser;
}

export interface BackendUser {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  estado: string;
}

export interface BackendProducto {
  idProducto: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  presentacion?: string;
  unidad: string;
  costoUnitario: number;
  stockActual: number;
  valorInventario: number;
  estado?: string;
}

export interface BackendCliente {
  idCliente: number;
  identificacion: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: string;
}

export interface BackendKardex {
  idProducto: number;
  codigo: string;
  nombre: string;
  stockActual: number;
  movimientos: BackendMovimiento[];
}

export interface BackendMovimiento {
  idMovimiento: number;
  idProducto: number;
  fecha: string;
  tipoMovimiento: string;
  cantidad: number;
  documentoOrigen?: string;
  observacion?: string;
  usuario?: { id: number; nombre: string };
  saldoAcumulado: number;
}

export interface BackendProforma {
  idProforma: number;
  numero: string;
  fecha: string;
  estado: string;
  cliente: { idCliente: number; nombre: string };
  vendedor: { id: number; nombre: string };
  subtotal: number;
  total: number;
  detalles: BackendProformaDetalle[];
}

export interface BackendProformaDetalle {
  idDetalle: number;
  producto: { idProducto: number; nombre: string; unidad: string };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface BackendVenta {
  idVenta: number;
  numero: string;
  fecha: string;
  estado: string;
  cliente: { idCliente: number; nombre: string };
  vendedor: { id: number; nombre: string };
  total: number;
  totalAbonado: number;
  saldo: number;
  detalles: any[];
}

export interface BackendRecibo {
  idRecibo: number;
  numero: string;
  fecha: string;
  venta: { idVenta: number; numero: string };
  monto: number;
  observacion?: string;
}

export interface BackendEntradaRequest {
  productoId: number;
  cantidad: number;
  documentoOrigen?: string;
  observacion?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ─── Auth ──────────────────────────────────────────────────────────────────
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, req)
      .pipe(catchError(this.handle));
  }

  // ─── Productos ─────────────────────────────────────────────────────────────
  getProductos(): Observable<BackendProducto[]> {
    return this.http.get<BackendProducto[]>(`${this.base}/products`)
      .pipe(catchError(this.handle));
  }
  createProducto(body: any): Observable<BackendProducto> {
    return this.http.post<BackendProducto>(`${this.base}/products`, body)
      .pipe(catchError(this.handle));
  }
  updateProducto(id: number, body: any): Observable<BackendProducto> {
    return this.http.put<BackendProducto>(`${this.base}/products/${id}`, body)
      .pipe(catchError(this.handle));
  }
  patchProductoStatus(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.base}/products/${id}/status`, { estado })
      .pipe(catchError(this.handle));
  }

  // ─── Clientes ──────────────────────────────────────────────────────────────
  getClientes(): Observable<BackendCliente[]> {
    return this.http.get<BackendCliente[]>(`${this.base}/customers`)
      .pipe(catchError(this.handle));
  }
  createCliente(body: any): Observable<BackendCliente> {
    return this.http.post<BackendCliente>(`${this.base}/customers`, body)
      .pipe(catchError(this.handle));
  }
  updateCliente(id: number, body: any): Observable<BackendCliente> {
    return this.http.put<BackendCliente>(`${this.base}/customers/${id}`, body)
      .pipe(catchError(this.handle));
  }

  // ─── Inventario ────────────────────────────────────────────────────────────
  getInventario(): Observable<BackendProducto[]> {
    return this.http.get<BackendProducto[]>(`${this.base}/inventory`)
      .pipe(catchError(this.handle));
  }
  getKardex(productId: number): Observable<BackendKardex> {
    return this.http.get<BackendKardex>(`${this.base}/inventory/kardex/${productId}`)
      .pipe(catchError(this.handle));
  }
  registrarEntrada(body: BackendEntradaRequest): Observable<BackendMovimiento> {
    return this.http.post<BackendMovimiento>(`${this.base}/inventory/entries`, body)
      .pipe(catchError(this.handle));
  }
  registrarAjusteIn(body: BackendEntradaRequest): Observable<BackendMovimiento> {
    return this.http.post<BackendMovimiento>(`${this.base}/inventory/adjustments/in`, body)
      .pipe(catchError(this.handle));
  }
  registrarAjusteOut(body: BackendEntradaRequest): Observable<BackendMovimiento> {
    return this.http.post<BackendMovimiento>(`${this.base}/inventory/adjustments/out`, body)
      .pipe(catchError(this.handle));
  }

  // ─── Proformas ─────────────────────────────────────────────────────────────
  getProformas(): Observable<BackendProforma[]> {
    return this.http.get<BackendProforma[]>(`${this.base}/quotes`)
      .pipe(catchError(this.handle));
  }
  getProforma(id: number): Observable<BackendProforma> {
    return this.http.get<BackendProforma>(`${this.base}/quotes/${id}`)
      .pipe(catchError(this.handle));
  }
  createProforma(body: any): Observable<BackendProforma> {
    return this.http.post<BackendProforma>(`${this.base}/quotes`, body)
      .pipe(catchError(this.handle));
  }
  cancelProforma(id: number): Observable<any> {
    return this.http.patch(`${this.base}/quotes/${id}/cancel`, {})
      .pipe(catchError(this.handle));
  }

  // ─── Ventas ────────────────────────────────────────────────────────────────
  getVentas(): Observable<BackendVenta[]> {
    return this.http.get<BackendVenta[]>(`${this.base}/sales`)
      .pipe(catchError(this.handle));
  }
  getVenta(id: number): Observable<BackendVenta> {
    return this.http.get<BackendVenta>(`${this.base}/sales/${id}`)
      .pipe(catchError(this.handle));
  }
  createVentaDesdeProforma(proformaId: number): Observable<BackendVenta> {
    return this.http.post<BackendVenta>(`${this.base}/sales`, { proformaId })
      .pipe(catchError(this.handle));
  }
  createVentaDirecta(body: any): Observable<BackendVenta> {
    return this.http.post<BackendVenta>(`${this.base}/sales`, body)
      .pipe(catchError(this.handle));
  }
  cancelVenta(id: number): Observable<any> {
    return this.http.patch(`${this.base}/sales/${id}/cancel`, {})
      .pipe(catchError(this.handle));
  }

  // ─── Recibos ───────────────────────────────────────────────────────────────
  getRecibos(): Observable<BackendRecibo[]> {
    return this.http.get<BackendRecibo[]>(`${this.base}/receipts`)
      .pipe(catchError(this.handle));
  }
  createRecibo(body: { ventaId: number; monto: number; observacion?: string }): Observable<BackendRecibo> {
    return this.http.post<BackendRecibo>(`${this.base}/receipts`, body)
      .pipe(catchError(this.handle));
  }

  // ─── Usuarios ──────────────────────────────────────────────────────────────
  getUsuarios(): Observable<BackendUser[]> {
    return this.http.get<BackendUser[]>(`${this.base}/users`)
      .pipe(catchError(this.handle));
  }
  createUsuario(body: any): Observable<BackendUser> {
    return this.http.post<BackendUser>(`${this.base}/users`, body)
      .pipe(catchError(this.handle));
  }
  updateUsuario(id: number, body: any): Observable<BackendUser> {
    return this.http.put<BackendUser>(`${this.base}/users/${id}`, body)
      .pipe(catchError(this.handle));
  }
  patchUsuarioStatus(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.base}/users/${id}/status`, { estado })
      .pipe(catchError(this.handle));
  }

  // ─── Error handler ─────────────────────────────────────────────────────────
  private handle(err: HttpErrorResponse) {
    const msg = err.error?.message ?? err.message ?? 'Error desconocido';
    console.error('[API ERROR]', err.status, msg);
    return throwError(() => ({ status: err.status, message: msg }));
  }
}
