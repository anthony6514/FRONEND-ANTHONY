import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { SoundService } from '../../core/services/sound.service';
import { MovimientoInventario, Producto } from '../../core/models';

type Tab = 'todos' | 'entradas' | 'salidas' | 'ajustes';
type Vista = 'lista' | 'entrada' | 'salida' | 'ajuste';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.scss',
})
export class MovimientosComponent {
  ds    = inject(DataService);
  sound = inject(SoundService);

  movimientos: MovimientoInventario[] = this.ds.getMovimientos();
  productos: Producto[] = this.ds.getProductos();

  tab    = signal<Tab>('todos');
  vista  = signal<Vista>('lista');
  search = signal('');

  filtered = computed(() => {
    let list = this.movimientos;
    const t = this.tab();
    if (t === 'entradas') list = list.filter(m => m.tipoMovimiento === 'ENTRADA');
    if (t === 'salidas')  list = list.filter(m => m.tipoMovimiento === 'SALIDA');
    if (t === 'ajustes')  list = list.filter(m => m.tipoMovimiento === 'AJUSTE_ENTRADA' || m.tipoMovimiento === 'AJUSTE_SALIDA');
    const q = this.search().toLowerCase();
    if (q) list = list.filter(m =>
      m.productoNombre.toLowerCase().includes(q) ||
      (m.documentoOrigen ?? '').toLowerCase().includes(q) ||
      m.usuario.toLowerCase().includes(q)
    );
    return list;
  });

  get totalEntradas() { return this.movimientos.filter(m => m.tipoMovimiento === 'ENTRADA').length; }
  get totalSalidas()  { return this.movimientos.filter(m => m.tipoMovimiento === 'SALIDA').length; }
  get totalAjustes()  { return this.movimientos.filter(m => m.tipoMovimiento === 'AJUSTE_ENTRADA' || m.tipoMovimiento === 'AJUSTE_SALIDA').length; }
  get litrosIngresados() {
    return this.movimientos
      .filter(m => m.tipoMovimiento === 'ENTRADA')
      .reduce((s, m) => s + m.cantidad, 0);
  }

  // ── Formulario entrada ──────────────────────────────────────────────────────
  // Al registrar entrada el costo es el mismo del producto en stock
  formEntrada = {
    productoId: 0,
    cantidad: 0,
    documentoOrigen: '',
    observacion: '',
    fecha: new Date().toISOString().split('T')[0],
  };

  get costoEntrada(): number {
    const p = this.productos.find(p => p.id === +this.formEntrada.productoId);
    return p?.precio ?? 0;
  }

  // ── Formulario salida ───────────────────────────────────────────────────────
  // Al registrar salida se agrega manualmente un precio de venta
  formSalida = {
    productoId: 0,
    cantidad: 0,
    precioVenta: 0,
    documentoOrigen: '',
    observacion: '',
    fecha: new Date().toISOString().split('T')[0],
  };

  get stockDisponible(): number {
    const p = this.productos.find(p => p.id === +this.formSalida.productoId);
    return p?.stock ?? 0;
  }

  get importeSalida(): number {
    return Math.round(this.formSalida.cantidad * this.formSalida.precioVenta * 100) / 100;
  }

  // ── Formulario ajuste ───────────────────────────────────────────────────────
  formAjuste = {
    productoId: 0,
    tipoAjuste: 'in' as 'in' | 'out',
    cantidad: 0,
    observacion: '',
    fecha: new Date().toISOString().split('T')[0],
  };

  setTab(t: Tab)   { this.tab.set(t); }
  abrirEntrada()   { this.vista.set('entrada'); this.sound.play('click'); }
  abrirSalida()    { this.vista.set('salida');  this.sound.play('click'); }
  abrirAjuste()    { this.vista.set('ajuste');  this.sound.play('click'); }
  volver()         { this.vista.set('lista');   this.sound.play('click'); }

  guardarEntrada() {
    const p = this.productos.find(p => p.id === +this.formEntrada.productoId);
    if (!p || !this.formEntrada.cantidad) return;
    const nuevo: MovimientoInventario = {
      id: this.movimientos.length + 1,
      productoId: p.id,
      productoNombre: p.nombre,
      tipoMovimiento: 'ENTRADA',
      cantidad: +this.formEntrada.cantidad,
      fecha: this.formEntrada.fecha,
      usuario: 'Admin',
      documentoOrigen: this.formEntrada.documentoOrigen || undefined,
      observacion: this.formEntrada.observacion || undefined,
      stockResultante: p.stock + +this.formEntrada.cantidad,
    };
    this.movimientos.unshift(nuevo);
    p.stock += +this.formEntrada.cantidad;
    this.sound.play('success');
    this.volver();
  }

  guardarSalida() {
    const p = this.productos.find(p => p.id === +this.formSalida.productoId);
    if (!p || !this.formSalida.cantidad) return;
    const nuevo: MovimientoInventario = {
      id: this.movimientos.length + 1,
      productoId: p.id,
      productoNombre: p.nombre,
      tipoMovimiento: 'SALIDA',
      cantidad: +this.formSalida.cantidad,
      fecha: this.formSalida.fecha,
      usuario: 'Admin',
      documentoOrigen: this.formSalida.documentoOrigen || undefined,
      observacion: this.formSalida.observacion || undefined,
      stockResultante: p.stock - +this.formSalida.cantidad,
    };
    this.movimientos.unshift(nuevo);
    p.stock -= +this.formSalida.cantidad;
    this.sound.play('success');
    this.volver();
  }

  guardarAjuste() {
    const p = this.productos.find(p => p.id === +this.formAjuste.productoId);
    if (!p || !this.formAjuste.cantidad) return;
    const esEntrada = this.formAjuste.tipoAjuste === 'in';
    const tipo = esEntrada ? 'AJUSTE_ENTRADA' : 'AJUSTE_SALIDA';
    const nuevo: MovimientoInventario = {
      id: this.movimientos.length + 1,
      productoId: p.id,
      productoNombre: p.nombre,
      tipoMovimiento: tipo,
      cantidad: +this.formAjuste.cantidad,
      fecha: this.formAjuste.fecha,
      usuario: 'Admin',
      documentoOrigen: undefined,
      observacion: this.formAjuste.observacion || 'Ajuste de inventario',
      stockResultante: esEntrada
        ? p.stock + +this.formAjuste.cantidad
        : p.stock - +this.formAjuste.cantidad,
    };
    this.movimientos.unshift(nuevo);
    if (esEntrada) p.stock += +this.formAjuste.cantidad;
    else           p.stock -= +this.formAjuste.cantidad;
    this.sound.play('success');
    this.volver();
  }

  tipoBadge(tipo: string) {
    if (tipo === 'ENTRADA')       return 'badge--success';
    if (tipo === 'SALIDA')        return 'badge--danger';
    if (tipo === 'AJUSTE_ENTRADA') return 'badge--info';
    return 'badge--warning';
  }

  tipoIcon(tipo: string) {
    if (tipo === 'ENTRADA')       return 'add_circle';
    if (tipo === 'SALIDA')        return 'remove_circle';
    if (tipo === 'AJUSTE_ENTRADA') return 'add_task';
    return 'undo';
  }
}
