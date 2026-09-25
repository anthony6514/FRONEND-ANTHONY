import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Interfaces exactas del backend ──────────────────────────────────────────

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

// Producto — usa "id" (no idProducto)
export interface BackendProducto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  presentacion?: string;
  volumen?: number;
  unidad: string;
  costoUnitario: number;
  estado: string;
}

// Inventario — usa "idProducto" (diferente a productos)
export interface BackendStock {
  idProducto: number;
  codigo: string;
  nombre: string;
  presentacion?: string;
  unidad: string;
  costoUnitario: number;
  stockActual: number;
  valorInventario: number;
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
  tipoMovimiento: string;
  cantidad: number;
  fecha: string;
  usuario?: { id: number; nombre: string };
  documentoOrigen?: string;
  observacion?: string;
  saldoAcumulado: number;
}

// Cliente — usa "id"
export interface BackendCliente {
  id: number;
  identificacion: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado: string;
}

// Proforma — clienteId, vendedorId (no objetos anidados)
export interface BackendProforma {
  id: number;
  numero: string;
  fecha: string;
  clienteId: number;
  vendedorId: number;
  estado: string;
  total: number;
  observacion?: string;
  detalles: BackendDetalle[];
}

export interface BackendDetalle {
  id: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Venta — clienteId, vendedorId, proformaId
export interface BackendVenta {
  id: number;
  numero: string;
  fecha: string;
  clienteId: number;
  vendedorId: number;
  proformaId?: number;
  estado: string;
  total: number;
  totalAbonado: number;
  saldo: number;
  detalles: BackendDetalle[];
}

// Recibo — ventaId, usuarioId
export interface BackendRecibo {
  id: number;
  numero: string;
  ventaId: number;
  fecha: string;
  monto: number;
  observacion?: string;
  usuarioId: number;
}

// Dashboard
export interface BackendDashboard {
  litrosVendidosMes: number;
  metaRepsol: number;
  cumplimientoMeta: number;
  totalVentasMes: number;
  totalVentasUSD: number;
  saldoPendienteTotal: number;
  productosStockBajo: number;
  totalProductos: number;
  ventasHoy: number;
  recibosHoy: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ─── Auth ─────────────────────────────────────────────────────────────────
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, req)
      .pipe(catchError(this.handle));
  }

  getMe(): Observable<{ id: number; nombre: string; email: string; rol: string }> {
    return this.http.get<any>(`${this.base}/auth/me`).pipe(catchError(this.handle));
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/forgot-password`, { email })
      .pipe(catchError(this.handle));
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/reset-password`, { token, newPassword })
      .pipe(catchError(this.handle));
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────
  getDashboardStats(year?: number, month?: number): Observable<BackendDashboard> {
    let url = `${this.base}/dashboard/stats`;
    if (year && month) url += `?year=${year}&month=${month}`;
    return this.http.get<BackendDashboard>(url).pipe(catchError(this.handle));
  }

  // ─── Productos ────────────────────────────────────────────────────────────
  getProductos(): Observable<BackendProducto[]> {
    return this.http.get<BackendProducto[]>(`${this.base}/products`).pipe(catchError(this.handle));
  }
  getProducto(id: number): Observable<BackendProducto> {
    return this.http.get<BackendProducto>(`${this.base}/products/${id}`).pipe(catchError(this.handle));
  }
  createProducto(body: any): Observable<BackendProducto> {
    return this.http.post<BackendProducto>(`${this.base}/products`, body).pipe(catchError(this.handle));
  }
  updateProducto(id: number, body: any): Observable<BackendProducto> {
    return this.http.put<BackendProducto>(`${this.base}/products/${id}`, body).pipe(catchError(this.handle));
  }
  patchProductoStatus(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.base}/products/${id}/status`, { estado }).pipe(catchError(this.handle));
  }

  // ─── Inventario ───────────────────────────────────────────────────────────
  getInventario(): Observable<BackendStock[]> {
    return this.http.get<BackendStock[]>(`${this.base}/inventory`).pipe(catchError(this.handle));
  }
  getStockProducto(productId: number): Observable<BackendStock> {
    return this.http.get<BackendStock>(`${this.base}/inventory/${productId}`).pipe(catchError(this.handle));
  }
  getKardex(productId: number): Observable<BackendKardex> {
    return this.http.get<BackendKardex>(`${this.base}/inventory/kardex/${productId}`).pipe(catchError(this.handle));
  }
  registrarEntrada(body: { productoId: number; cantidad: number; documentoOrigen?: string; observacion?: string }): Observable<BackendMovimiento> {
    return this.http.post<BackendMovimiento>(`${this.base}/inventory/entries`, body).pipe(catchError(this.handle));
  }
  registrarAjusteIn(body: any): Observable<BackendMovimiento> {
    return this.http.post<BackendMovimiento>(`${this.base}/inventory/adjustments/in`, body).pipe(catchError(this.handle));
  }
  registrarAjusteOut(body: any): Observable<BackendMovimiento> {
    return this.http.post<BackendMovimiento>(`${this.base}/inventory/adjustments/out`, body).pipe(catchError(this.handle));
  }

  // ─── Clientes ─────────────────────────────────────────────────────────────
  getClientes(): Observable<BackendCliente[]> {
    return this.http.get<BackendCliente[]>(`${this.base}/customers`).pipe(catchError(this.handle));
  }
  getCliente(id: number): Observable<BackendCliente> {
    return this.http.get<BackendCliente>(`${this.base}/customers/${id}`).pipe(catchError(this.handle));
  }
  createCliente(body: any): Observable<BackendCliente> {
    return this.http.post<BackendCliente>(`${this.base}/customers`, body).pipe(catchError(this.handle));
  }
  updateCliente(id: number, body: any): Observable<BackendCliente> {
    return this.http.put<BackendCliente>(`${this.base}/customers/${id}`, body).pipe(catchError(this.handle));
  }

  // ─── Proformas ────────────────────────────────────────────────────────────
  getProformas(): Observable<BackendProforma[]> {
    return this.http.get<BackendProforma[]>(`${this.base}/quotes`).pipe(catchError(this.handle));
  }
  getProforma(id: number): Observable<BackendProforma> {
    return this.http.get<BackendProforma>(`${this.base}/quotes/${id}`).pipe(catchError(this.handle));
  }
  createProforma(body: { clienteId: number; detalles: { productoId: number; cantidad: number; precioUnitario: number }[]; observacion?: string }): Observable<BackendProforma> {
    return this.http.post<BackendProforma>(`${this.base}/quotes`, body).pipe(catchError(this.handle));
  }
  cancelProforma(id: number): Observable<any> {
    return this.http.patch(`${this.base}/quotes/${id}/cancel`, {}).pipe(catchError(this.handle));
  }
  getProformaPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/proformas/${id}/pdf`, { responseType: 'blob' }).pipe(catchError(this.handle));
  }

  // ─── Ventas ───────────────────────────────────────────────────────────────
  getVentas(): Observable<BackendVenta[]> {
    return this.http.get<BackendVenta[]>(`${this.base}/sales`).pipe(catchError(this.handle));
  }
  getVenta(id: number): Observable<BackendVenta> {
    return this.http.get<BackendVenta>(`${this.base}/sales/${id}`).pipe(catchError(this.handle));
  }
  createVentaDesdeProforma(proformaId: number): Observable<BackendVenta> {
    return this.http.post<BackendVenta>(`${this.base}/sales`, { proformaId }).pipe(catchError(this.handle));
  }
  createVentaDirecta(body: { clienteId: number; detalles: any[] }): Observable<BackendVenta> {
    return this.http.post<BackendVenta>(`${this.base}/sales`, body).pipe(catchError(this.handle));
  }
  cancelVenta(id: number): Observable<any> {
    return this.http.patch(`${this.base}/sales/${id}/cancel`, {}).pipe(catchError(this.handle));
  }

  // ─── Recibos ──────────────────────────────────────────────────────────────
  getRecibos(): Observable<BackendRecibo[]> {
    return this.http.get<BackendRecibo[]>(`${this.base}/receipts`).pipe(catchError(this.handle));
  }
  getRecibo(id: number): Observable<BackendRecibo> {
    return this.http.get<BackendRecibo>(`${this.base}/receipts/${id}`).pipe(catchError(this.handle));
  }
  createRecibo(body: { ventaId: number; monto: number; observacion?: string }): Observable<BackendRecibo> {
    return this.http.post<BackendRecibo>(`${this.base}/receipts`, body).pipe(catchError(this.handle));
  }

  // ─── Usuarios ─────────────────────────────────────────────────────────────
  // Nuevo contrato: /api/usuarios (español), PATCH /{id}/estado
  getUsuarios(): Observable<BackendUser[]> {
    return this.http.get<BackendUser[]>(`${this.base}/usuarios`).pipe(catchError(this.handle));
  }
  createUsuario(body: { nombre: string; email: string; password: string; rol: string }): Observable<BackendUser> {
    return this.http.post<BackendUser>(`${this.base}/usuarios`, body).pipe(catchError(this.handle));
  }
  updateUsuario(id: number, body: any): Observable<BackendUser> {
    return this.http.put<BackendUser>(`${this.base}/usuarios/${id}`, body).pipe(catchError(this.handle));
  }
  patchUsuarioStatus(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.base}/usuarios/${id}/estado`, { estado }).pipe(catchError(this.handle));
  }
  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.base}/usuarios/${id}`).pipe(catchError(this.handle));
  }

  // ─── Error handler ────────────────────────────────────────────────────────
  private handle(err: HttpErrorResponse) {
    const msg = err.error?.message ?? err.message ?? 'Error desconocido';
    console.error('[API ERROR]', err.status, msg);
    return throwError(() => ({ status: err.status, message: msg }));
  }
}
