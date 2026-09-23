export interface LoginRequest  { username: string; password: string; }
export interface LoginResponse { token: string; user: User; }

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'VENDEDOR';
  estado: 'ACTIVO' | 'INACTIVO';
  avatar?: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  presentacion: string;
  volumen: number;
  unidad: string;
  precio: number;
  precioVenta?: number;
  stock: number;
  estado: 'ACTIVO' | 'INACTIVO';
  imagen?: string;
  stockMinimo?: number;
}

export interface Cliente {
  id: number;
  ruc: string;
  nombre: string;
  telefono?: string;
  ciudad?: string;
  vendedor?: string;
  totalCompras: number;
  saldoPendiente: number;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface MovimientoInventario {
  id: number;
  productoId: number;
  productoNombre: string;
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA';
  cantidad: number;
  fecha: string;
  usuario: string;
  documentoOrigen?: string;
  observacion?: string;
  stockResultante: number;
}

export interface Proforma {
  id: number;
  numero: string;
  fecha: string;
  fechaVence: string;
  clienteId: number;
  clienteNombre: string;
  vendedor: string;
  moneda: 'PEN' | 'USD';
  estado: 'EMITIDA' | 'ANULADA';
  subtotal: number;
  igv: number;
  total: number;
  detalles: ProformaDetalle[];
}

export interface ProformaDetalle {
  id: number;
  proformaId: number;
  productoId: number;
  productoNombre: string;
  presentacion: string;
  volumen: number;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface Venta {
  id: number;
  numero: string;
  fecha: string;
  clienteId: number;
  clienteNombre: string;
  vendedor: string;
  proformaId?: number;
  proformaNro?: string;
  moneda: 'PEN' | 'USD';
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA' | 'PARCIAL';
  totalVenta: number;
  totalAbonado: number;
  saldoPendiente: number;
  detalles: VentaDetalle[];
}

export interface VentaDetalle {
  id: number;
  ventaId: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface Recibo {
  id: number;
  numero: string;
  fecha: string;
  proformaId: number;
  proformaNro: string;
  clienteNombre: string;
  vendedor: string;
  moneda: 'PEN' | 'USD';
  monto: number;
  metodoPago: 'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE' | 'DEPOSITO';
  nroOperacion?: string;
  saldoPendiente: number;
}

export interface DashboardStats {
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
