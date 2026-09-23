import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import {
  Producto, Cliente, Proforma, Venta, Recibo, MovimientoInventario, DashboardStats
} from '../models';
import { ApiService, BackendProducto, BackendCliente, BackendProforma, BackendVenta, BackendRecibo, BackendMovimiento } from './api.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  private api = inject(ApiService);

  // ─── PRODUCTOS (real + fallback mock) ─────────────────────────────────────
  getProductosHttp(): Observable<Producto[]> {
    return this.api.getProductos().pipe(
      map(list => list.map(p => this.mapProducto(p))),
      catchError(() => of(this.getProductos()))
    );
  }

  private mapProducto(p: BackendProducto): Producto {
    return {
      id: p.idProducto,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      presentacion: p.presentacion ?? '',
      volumen: 1,
      unidad: p.unidad,
      precio: p.costoUnitario,
      precioVenta: p.costoUnitario,
      stock: p.stockActual ?? 0,
      stockMinimo: 100,
      estado: (p.estado ?? 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
      imagen: 'assets/products/repsol-generic.png',
    };
  }

  // ─── INVENTARIO HTTP ──────────────────────────────────────────────────────
  getInventarioHttp(): Observable<Producto[]> {
    return this.api.getInventario().pipe(
      map(list => list.map(p => this.mapProducto(p))),
      catchError(() => of(this.getProductos()))
    );
  }

  // ─── CLIENTES HTTP ────────────────────────────────────────────────────────
  getClientesHttp(): Observable<Cliente[]> {
    return this.api.getClientes().pipe(
      map(list => list.map(c => this.mapCliente(c))),
      catchError(() => of(this.getClientes()))
    );
  }

  private mapCliente(c: BackendCliente): Cliente {
    return {
      id: c.idCliente,
      ruc: c.identificacion,
      nombre: c.nombre,
      telefono: c.telefono,
      ciudad: c.direccion,
      vendedor: '',
      totalCompras: 0,
      saldoPendiente: 0,
      estado: (c.estado ?? 'ACTIVO') as 'ACTIVO' | 'INACTIVO',
    };
  }

  // ─── PROFORMAS HTTP ───────────────────────────────────────────────────────
  getProformasHttp(): Observable<Proforma[]> {
    return this.api.getProformas().pipe(
      map(list => list.map(p => this.mapProforma(p))),
      catchError(() => of(this.getProformas()))
    );
  }

  private mapProforma(p: BackendProforma): Proforma {
    return {
      id: p.idProforma,
      numero: p.numero,
      fecha: p.fecha?.split('T')[0] ?? '',
      fechaVence: '',
      clienteId: p.cliente.idCliente,
      clienteNombre: p.cliente.nombre,
      vendedor: p.vendedor.nombre,
      moneda: 'PEN',
      estado: p.estado as 'EMITIDA' | 'ANULADA',
      subtotal: p.subtotal,
      igv: 0,
      total: p.total,
      detalles: (p.detalles ?? []).map(d => ({
        id: d.idDetalle,
        proformaId: p.idProforma,
        productoId: d.producto.idProducto,
        productoNombre: d.producto.nombre,
        presentacion: '',
        volumen: 1,
        unidad: d.producto.unidad,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        importe: d.subtotal,
      })),
    };
  }

  // ─── VENTAS HTTP ──────────────────────────────────────────────────────────
  getVentasHttp(): Observable<Venta[]> {
    return this.api.getVentas().pipe(
      map(list => list.map(v => this.mapVenta(v))),
      catchError(() => of(this.getVentas()))
    );
  }

  private mapVenta(v: BackendVenta): Venta {
    const estadoMap: Record<string, 'PENDIENTE' | 'PAGADA' | 'ANULADA' | 'PARCIAL'> = {
      PENDIENTE: 'PENDIENTE', PAGADA: 'PAGADA', ANULADA: 'ANULADA', PARCIAL: 'PARCIAL'
    };
    return {
      id: v.idVenta,
      numero: v.numero,
      fecha: v.fecha?.split('T')[0] ?? '',
      clienteId: v.cliente.idCliente,
      clienteNombre: v.cliente.nombre,
      vendedor: v.vendedor.nombre,
      moneda: 'PEN',
      estado: estadoMap[v.estado] ?? 'PENDIENTE',
      totalVenta: v.total,
      totalAbonado: v.totalAbonado,
      saldoPendiente: v.saldo,
      detalles: [],
    };
  }

  // ─── RECIBOS HTTP ─────────────────────────────────────────────────────────
  getRecibosHttp(): Observable<Recibo[]> {
    return this.api.getRecibos().pipe(
      map(list => list.map(r => this.mapRecibo(r))),
      catchError(() => of(this.getRecibos()))
    );
  }

  private mapRecibo(r: BackendRecibo): Recibo {
    return {
      id: r.idRecibo,
      numero: r.numero,
      fecha: r.fecha?.split('T')[0] ?? '',
      proformaId: 0,
      proformaNro: r.venta?.numero ?? '',
      clienteNombre: '',
      vendedor: '',
      moneda: 'PEN',
      monto: r.monto,
      metodoPago: 'TRANSFERENCIA',
      nroOperacion: undefined,
      saldoPendiente: 0,
    };
  }

  // ─── KARDEX HTTP ──────────────────────────────────────────────────────────
  getKardexHttp(productId: number): Observable<MovimientoInventario[]> {
    return this.api.getKardex(productId).pipe(
      map(k => k.movimientos.map(m => this.mapMovimiento(m, productId))),
      catchError(() => of(this.getMovimientos()))
    );
  }

  private mapMovimiento(m: BackendMovimiento, productId: number): MovimientoInventario {
    const tipoMap: Record<string, 'ENTRADA' | 'SALIDA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA'> = {
      ENTRADA:       'ENTRADA',
      SALIDA:        'SALIDA',
      AJUSTE_ENTRADA:'AJUSTE_ENTRADA',
      AJUSTE_SALIDA: 'AJUSTE_SALIDA',
    };
    return {
      id: m.idMovimiento,
      productoId: productId,
      productoNombre: '',
      tipoMovimiento: tipoMap[m.tipoMovimiento] ?? 'ENTRADA',
      cantidad: m.cantidad,
      fecha: m.fecha?.split('T')[0] ?? '',
      usuario: m.usuario?.nombre ?? 'Sistema',
      documentoOrigen: m.documentoOrigen,
      observacion: m.observacion,
      stockResultante: m.saldoAcumulado,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DATOS MOCK (fallback cuando el backend no está disponible)
  // ══════════════════════════════════════════════════════════════════════════

  getProductos(): Producto[] {
    return [
      { id:1, codigo:'BP-F-AT1',  nombre:'REPSOL BP-1',         presentacion:'Caja 12×1 L',     volumen:1,  unidad:'L',  precio:60.50,  precioVenta:72.00,  stock:4200, stockMinimo:500,  estado:'ACTIVO' },
      { id:2, codigo:'BPAT-004',  nombre:'REPSOL BP-AT',        presentacion:'Caja 4×4 L',       volumen:4,  unidad:'L',  precio:142.00, precioVenta:168.00, stock:1900, stockMinimo:200,  estado:'ACTIVO' },
      { id:3, codigo:'DIES-019',  nombre:'REPSOL D-mot 80',     presentacion:'Cilindro 1×40 L',  volumen:40, unidad:'L',  precio:520.00, precioVenta:620.00, stock:850,  stockMinimo:100,  estado:'ACTIVO' },
      { id:4, codigo:'GAE-02',    nombre:'REPSOL Gasolina 90',  presentacion:'Bidón 20 L',        volumen:20, unidad:'L',  precio:290.20, precioVenta:340.00, stock:2400, stockMinimo:300,  estado:'ACTIVO' },
      { id:5, codigo:'GASPE-040', nombre:'REPSOL Gasolina 95',  presentacion:'Cilindro 1×60 L',  volumen:60, unidad:'L',  precio:480.50, precioVenta:570.00, stock:5250, stockMinimo:500,  estado:'ACTIVO' },
      { id:6, codigo:'ATF-003',   nombre:'REPSOL ATF',          presentacion:'Caja 12×1 L',     volumen:1,  unidad:'L',  precio:58.50,  precioVenta:70.00,  stock:75,   stockMinimo:100,  estado:'ACTIVO' },
      { id:7, codigo:'COOL-KFC',  nombre:'REPSOL Refrigerante', presentacion:'Caja 12×1 L',     volumen:1,  unidad:'L',  precio:34.80,  precioVenta:42.00,  stock:340,  stockMinimo:150,  estado:'ACTIVO' },
      { id:8, codigo:'GRES-031',  nombre:'Grasa Lima GP-2',     presentacion:'Balde 5 kg',       volumen:5,  unidad:'kg', precio:65.30,  precioVenta:78.00,  stock:125,  stockMinimo:80,   estado:'ACTIVO' },
      { id:9, codigo:'TIP-050',   nombre:'REPSOL Trans MTE',    presentacion:'Balde 20 L',       volumen:20, unidad:'L',  precio:280.00, precioVenta:330.00, stock:463,  stockMinimo:100,  estado:'ACTIVO' },
      { id:10,codigo:'MRZ-030',   nombre:'Aceite Hidráulico 32',presentacion:'Balde 20 L',       volumen:20, unidad:'L',  precio:310.00, precioVenta:370.00, stock:902,  stockMinimo:80,   estado:'ACTIVO' },
    ];
  }

  getClientes(): Cliente[] {
    return [
      { id:1,  ruc:'20571441113', nombre:'Comercial Industrial Andina S.A.C.',       telefono:'+51 987 763 541', ciudad:'Lima',     vendedor:'Barón', totalCompras:46500, saldoPendiente:5450, estado:'ACTIVO' },
      { id:2,  ruc:'20467974576', nombre:'Cannisiones del Perú E.I.R.L.',            telefono:'+51 981 712 134', ciudad:'Trujillo', vendedor:'Jaime', totalCompras:34500, saldoPendiente:0,    estado:'ACTIVO' },
      { id:3,  ruc:'20549921479', nombre:'Transportes Andinas S.A.C.',               telefono:'+51 982 032 111', ciudad:'Lima',     vendedor:'Barón', totalCompras:12450, saldoPendiente:1200, estado:'ACTIVO' },
      { id:4,  ruc:'20467970645', nombre:'Inversiones Gold Field S.A.',              telefono:'+51 942 283 831', ciudad:'Arequipa', vendedor:'Jaime', totalCompras:23400, saldoPendiente:0,    estado:'ACTIVO' },
      { id:5,  ruc:'20379712101', nombre:'Fundición Gold Flexi S.A.',                telefono:'+51 958 632 190', ciudad:'Ica',      vendedor:'Barón', totalCompras:21600, saldoPendiente:4100, estado:'ACTIVO' },
      { id:6,  ruc:'20579842111', nombre:'Empresas Generales del Sur E.I.R.L.',      telefono:'+51 993 024 221', ciudad:'Chiclayo', vendedor:'Jaime', totalCompras:14780, saldoPendiente:0,    estado:'ACTIVO' },
      { id:7,  ruc:'20379771277', nombre:'Inversiones y Servicios Múltiples S.A.C.', telefono:'+51 993 534 231', ciudad:'Chiclayo', vendedor:'Jaime', totalCompras:14780, saldoPendiente:5600, estado:'ACTIVO' },
      { id:8,  ruc:'20597819446', nombre:'Agregados San Martín S.A.C.',              telefono:'+51 987 166 210', ciudad:'Lima',     vendedor:'Barón', totalCompras:27400, saldoPendiente:2000, estado:'ACTIVO' },
      { id:9,  ruc:'20579316449', nombre:'Distribución del Pacífico S.A.C.',         telefono:'+51 987 452 192', ciudad:'Piura',    vendedor:'Jaime', totalCompras:32150, saldoPendiente:0,    estado:'ACTIVO' },
      { id:10, ruc:'20371451644', nombre:'Commercialización & W.A.C.',               telefono:'+51 987 154 234', ciudad:'Lima',     vendedor:'Barón', totalCompras:22400, saldoPendiente:1100, estado:'ACTIVO' },
    ];
  }

  getMovimientos(): MovimientoInventario[] {
    return [
      { id:1, productoId:1, productoNombre:'REPSOL BP-1',        tipoMovimiento:'ENTRADA', cantidad:500, fecha:'2026-09-15', usuario:'Admin', documentoOrigen:'OC-0023', observacion:'Compra mensual',       stockResultante:4200 },
      { id:2, productoId:1, productoNombre:'REPSOL BP-1',        tipoMovimiento:'SALIDA',  cantidad:120, fecha:'2026-09-15', usuario:'Barón', documentoOrigen:'SAL-001', observacion:'Venta Comercial Andina', stockResultante:4080 },
      { id:3, productoId:4, productoNombre:'REPSOL Gasolina 90', tipoMovimiento:'ENTRADA', cantidad:300, fecha:'2026-09-14', usuario:'Admin', documentoOrigen:'OC-0022', observacion:undefined,              stockResultante:2400 },
      { id:4, productoId:6, productoNombre:'REPSOL ATF',         tipoMovimiento:'SALIDA',  cantidad:50,  fecha:'2026-09-14', usuario:'Jaime', documentoOrigen:'SAL-002', observacion:'Venta Gold Field',     stockResultante:75   },
      { id:5, productoId:2, productoNombre:'REPSOL BP-AT',       tipoMovimiento:'ENTRADA', cantidad:200, fecha:'2026-09-13', usuario:'Admin', documentoOrigen:'OC-0021', observacion:'Compra',               stockResultante:1900 },
      { id:6, productoId:5, productoNombre:'REPSOL Gasolina 95', tipoMovimiento:'SALIDA',  cantidad:300, fecha:'2026-09-12', usuario:'Barón', documentoOrigen:'SAL-003', observacion:undefined,              stockResultante:5250 },
      { id:7, productoId:3, productoNombre:'REPSOL D-mot 80',    tipoMovimiento:'AJUSTE_ENTRADA', cantidad:10,  fecha:'2026-09-10', usuario:'Admin', documentoOrigen:undefined, observacion:'Ajuste de inventario', stockResultante:850  },
    ];
  }

  getProformas(): Proforma[] {
    return [
      { id:1, numero:'PF-2026-00248', fecha:'2026-09-10', fechaVence:'2026-09-25', clienteId:1, clienteNombre:'Comercial Industrial Andina S.A.C.',  vendedor:'Barón', moneda:'PEN', estado:'EMITIDA', subtotal:13200, igv:2376, total:15576, detalles:[] },
      { id:2, numero:'PF-2026-00247', fecha:'2026-09-08', fechaVence:'2026-09-23', clienteId:2, clienteNombre:'Cannisiones del Perú E.I.R.L.',       vendedor:'Jaime', moneda:'USD', estado:'EMITIDA', subtotal:4890,  igv:880,  total:5770,  detalles:[] },
      { id:3, numero:'PF-2026-00246', fecha:'2026-09-05', fechaVence:'2026-09-20', clienteId:3, clienteNombre:'Transportes Andinas S.A.C.',          vendedor:'Barón', moneda:'PEN', estado:'EMITIDA', subtotal:8100,  igv:1458, total:9558,  detalles:[] },
      { id:4, numero:'PF-2026-00245', fecha:'2026-09-03', fechaVence:'2026-09-18', clienteId:4, clienteNombre:'Inversiones Gold Field S.A.',         vendedor:'Jaime', moneda:'PEN', estado:'ANULADA', subtotal:3290,  igv:592,  total:3882,  detalles:[] },
      { id:5, numero:'PF-2026-00244', fecha:'2026-09-01', fechaVence:'2026-09-16', clienteId:5, clienteNombre:'Fundición Gold Flexi S.A.',           vendedor:'Barón', moneda:'PEN', estado:'EMITIDA', subtotal:7500,  igv:1350, total:8850,  detalles:[] },
      { id:6, numero:'PF-2026-00243', fecha:'2026-08-28', fechaVence:'2026-09-12', clienteId:6, clienteNombre:'Empresas Generales del Sur E.I.R.L.', vendedor:'Jaime', moneda:'USD', estado:'EMITIDA', subtotal:2900,  igv:522,  total:3422,  detalles:[] },
    ];
  }

  getVentas(): Venta[] {
    return [
      { id:1, numero:'V-2026-00045', fecha:'2026-09-15', clienteId:1, clienteNombre:'Comercial Industrial Andina S.A.C.', vendedor:'Barón', proformaNro:'PF-2026-00248', moneda:'PEN', estado:'PENDIENTE', totalVenta:15576, totalAbonado:5500,  saldoPendiente:10076, detalles:[] },
      { id:2, numero:'V-2026-00044', fecha:'2026-09-14', clienteId:2, clienteNombre:'Cannisiones del Perú E.I.R.L.',      vendedor:'Jaime', proformaNro:'PF-2026-00247', moneda:'USD', estado:'PAGADA',    totalVenta:5770,  totalAbonado:5770,  saldoPendiente:0,     detalles:[] },
      { id:3, numero:'V-2026-00043', fecha:'2026-09-12', clienteId:3, clienteNombre:'Transportes Andinas S.A.C.',         vendedor:'Barón', proformaNro:'PF-2026-00246', moneda:'PEN', estado:'PARCIAL',   totalVenta:9558,  totalAbonado:4000,  saldoPendiente:5558,  detalles:[] },
      { id:4, numero:'V-2026-00042', fecha:'2026-09-10', clienteId:5, clienteNombre:'Fundición Gold Flexi S.A.',          vendedor:'Barón', proformaNro:'PF-2026-00245', moneda:'PEN', estado:'PAGADA',    totalVenta:8850,  totalAbonado:8850,  saldoPendiente:0,     detalles:[] },
      { id:5, numero:'V-2026-00041', fecha:'2026-09-08', clienteId:8, clienteNombre:'Agregados San Martín S.A.C.',        vendedor:'Barón', proformaNro:undefined,       moneda:'PEN', estado:'PENDIENTE', totalVenta:12300, totalAbonado:0,     saldoPendiente:12300, detalles:[] },
      { id:6, numero:'V-2026-00040', fecha:'2026-09-05', clienteId:6, clienteNombre:'Empresas Generales del Sur E.I.R.L.',vendedor:'Jaime', proformaNro:'PF-2026-00243', moneda:'USD', estado:'ANULADA',   totalVenta:3422,  totalAbonado:0,     saldoPendiente:0,     detalles:[] },
    ];
  }

  getRecibos(): Recibo[] {
    return [
      { id:1, numero:'REC-000429', fecha:'2026-09-15', proformaId:1, proformaNro:'PF-2026-00248', clienteNombre:'Comercial Industrial Andina S.A.C.', vendedor:'Barón', moneda:'PEN', monto:3500, metodoPago:'TRANSFERENCIA', nroOperacion:'OP-41795', saldoPendiente:6609 },
      { id:2, numero:'REC-000428', fecha:'2026-09-15', proformaId:1, proformaNro:'PF-2026-00248', clienteNombre:'Comercial Industrial Andina S.A.C.', vendedor:'Barón', moneda:'PEN', monto:4200, metodoPago:'TRANSFERENCIA', nroOperacion:'OP-41138', saldoPendiente:5400 },
      { id:3, numero:'REC-000427', fecha:'2026-09-14', proformaId:2, proformaNro:'PF-2026-00247', clienteNombre:'Cannisiones del Perú E.I.R.L.',      vendedor:'Jaime', moneda:'PEN', monto:2300, metodoPago:'EFECTIVO',      nroOperacion:undefined,  saldoPendiente:5448 },
      { id:4, numero:'REC-000426', fecha:'2026-09-13', proformaId:3, proformaNro:'PF-2026-00246', clienteNombre:'Transportes Andinas S.A.C.',         vendedor:'Barón', moneda:'PEN', monto:1800, metodoPago:'CHEQUE',        nroOperacion:'CH-0020',  saldoPendiente:3100 },
      { id:5, numero:'REC-000425', fecha:'2026-09-12', proformaId:5, proformaNro:'PF-2026-00245', clienteNombre:'Fundición Gold Flexi S.A.',          vendedor:'Barón', moneda:'PEN', monto:1700, metodoPago:'TRANSFERENCIA', nroOperacion:'OP-40350', saldoPendiente:3000 },
      { id:6, numero:'REC-000424', fecha:'2026-09-10', proformaId:2, proformaNro:'PF-2026-00247', clienteNombre:'Cannisiones del Perú E.I.R.L.',      vendedor:'Jaime', moneda:'USD', monto:1560, metodoPago:'DEPOSITO',      nroOperacion:'DEP-00321',saldoPendiente:3000 },
    ];
  }

  getDashboardStats(): DashboardStats {
    return {
      litrosVendidosMes: 48650, metaRepsol: 55000, cumplimientoMeta: 88.5,
      totalVentasMes: 284750,   totalVentasUSD: 32480, saldoPendienteTotal: 46320,
      productosStockBajo: 7,    totalProductos: 86,    ventasHoy: 4, recibosHoy: 2,
    };
  }

  getVentasChart() {
    return {
      labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep'],
      litros: [5500,6200,7400,7100,6800,7500,8200,7950,8650],
      meta:   [7000,7000,7500,7500,8000,8000,8500,8500,9000],
    };
  }

  getProductosMasVendidos() {
    return [
      { nombre:'BP-1',       litros:14750, pct:30 },
      { nombre:'BP-AT',      litros:12960, pct:26 },
      { nombre:'Gasolina 90',litros:8960,  pct:18 },
      { nombre:'Industrial', litros:4034,  pct:8  },
      { nombre:'Gasolina 95',litros:2120,  pct:4  },
    ];
  }

  getTopClientes() {
    return [
      { nombre:'Transportes Andinos S.A.C.',           litros:12450, monto:84750 },
      { nombre:'Excavaciones del Norte S.R.L.',         litros:8960,  monto:64480 },
      { nombre:'Minera Gold Field S.A.',                litros:7950,  monto:57350 },
      { nombre:'Agregados San Martín S.A.C.',           litros:6645,  monto:47845 },
      { nombre:'Inversiones y Serv. Múltiples S.A.C.', litros:5320,  monto:38300 },
    ];
  }

  getVentedores() {
    return [
      { nombre:'Barón', ventas:28, litros:28460, monto:169850, pct:41 },
      { nombre:'Jaime', ventas:19, litros:20190, monto:114900, pct:35 },
    ];
  }
}
