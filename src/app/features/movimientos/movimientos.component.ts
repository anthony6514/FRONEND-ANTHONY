import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
import { MovimientoInventario, Producto } from '../../core/models';

type Tab   = 'todos' | 'entradas' | 'salidas' | 'ajustes';
type Vista = 'lista' | 'entrada' | 'salida' | 'ajuste';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.scss',
})
export class MovimientosComponent implements OnInit {
  ds    = inject(DataService);
  api   = inject(ApiService);
  sound = inject(SoundService);

  // Signals para que computed() pueda detectar cambios
  movimientos = signal<MovimientoInventario[]>([]);
  productos   = signal<Producto[]>([]);
  loading     = signal(true);
  saving      = signal(false);
  errorMsg    = '';

  tab    = signal<Tab>('todos');
  vista  = signal<Vista>('lista');
  search = signal('');

  ngOnInit() {
    this.ds.getProductosHttp().subscribe({
      next: data => {
        this.productos.set(data);
        const p = data.find(x => x.stock > 0) ?? data[0];
        if (p) {
          this.ds.getKardexHttp(p.id).subscribe({
            next:  movs => { this.movimientos.set(movs); this.loading.set(false); },
            error: ()   => { this.loading.set(false); },
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => { this.loading.set(false); },
    });
  }

  filtered = computed(() => {
    let list = this.movimientos();
    const t  = this.tab();
    if (t === 'entradas') list = list.filter(m => m.tipoMovimiento === 'ENTRADA');
    if (t === 'salidas')  list = list.filter(m => m.tipoMovimiento === 'SALIDA');
    if (t === 'ajustes')  list = list.filter(m =>
      m.tipoMovimiento === 'AJUSTE_ENTRADA' || m.tipoMovimiento === 'AJUSTE_SALIDA');
    const q = this.search().toLowerCase();
    if (q) list = list.filter(m =>
      m.productoNombre.toLowerCase().includes(q) ||
      (m.documentoOrigen ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  get totalEntradas()    { return this.movimientos().filter(m => m.tipoMovimiento === 'ENTRADA').length; }
  get totalSalidas()     { return this.movimientos().filter(m => m.tipoMovimiento === 'SALIDA').length; }
  get totalAjustes()     { return this.movimientos().filter(m => m.tipoMovimiento.startsWith('AJUSTE')).length; }
  get litrosIngresados() { return this.movimientos().filter(m => m.tipoMovimiento === 'ENTRADA').reduce((s, m) => s + m.cantidad, 0); }

  formEntrada = { productoId: 0, cantidad: 0, documentoOrigen: '', observacion: '', fecha: new Date().toISOString().split('T')[0] };
  formSalida  = { productoId: 0, cantidad: 0, precioVenta: 0, documentoOrigen: '', observacion: '', fecha: new Date().toISOString().split('T')[0] };
  formAjuste  = { productoId: 0, tipoAjuste: 'in' as 'in' | 'out', cantidad: 0, observacion: '', fecha: new Date().toISOString().split('T')[0] };

  get costoEntrada()   { return this.productos().find(p => p.id === +this.formEntrada.productoId)?.precio ?? 0; }
  get stockDisponible(){ return this.productos().find(p => p.id === +this.formSalida.productoId)?.stock ?? 0; }
  get importeSalida()  { return +(this.formSalida.cantidad * this.formSalida.precioVenta).toFixed(2); }

  setTab(t: Tab)   { this.tab.set(t); }
  abrirEntrada()   {
    this.formEntrada = { productoId: 0, cantidad: 0, documentoOrigen: '', observacion: '', fecha: new Date().toISOString().split('T')[0] };
    this.vista.set('entrada'); this.errorMsg = ''; this.sound.play('click');
  }
  abrirSalida()    {
    this.formSalida = { productoId: 0, cantidad: 0, precioVenta: 0, documentoOrigen: '', observacion: '', fecha: new Date().toISOString().split('T')[0] };
    this.vista.set('salida');  this.errorMsg = ''; this.sound.play('click');
  }
  abrirAjuste()    {
    this.formAjuste = { productoId: 0, tipoAjuste: 'in', cantidad: 0, observacion: '', fecha: new Date().toISOString().split('T')[0] };
    this.vista.set('ajuste');  this.errorMsg = ''; this.sound.play('click');
  }
  volver()         { this.vista.set('lista');   this.sound.play('click'); }

  tipoIcon(t: string) {
    const m: Record<string, string> = { ENTRADA:'arrow_downward', SALIDA:'arrow_upward', AJUSTE_ENTRADA:'add_circle', AJUSTE_SALIDA:'remove_circle' };
    return m[t] ?? 'swap_horiz';
  }
  tipoBadge(t: string) {
    const m: Record<string, string> = { ENTRADA:'badge--success', SALIDA:'badge--danger', AJUSTE_ENTRADA:'badge--info', AJUSTE_SALIDA:'badge--warning' };
    return m[t] ?? 'badge--neutral';
  }

  private recargar(productoId: number) {
    this.ds.getProductosHttp().subscribe(prods => {
      this.productos.set(prods);
      this.ds.getKardexHttp(productoId).subscribe(movs => {
        this.movimientos.set(movs);
        this.saving.set(false);
        this.sound.play('success');
        this.volver();
      });
    });
  }

  guardarEntrada() {
    if (!this.formEntrada.productoId || !this.formEntrada.cantidad) { this.errorMsg = 'Completa los campos requeridos.'; return; }
    this.saving.set(true); this.errorMsg = '';
    this.api.registrarEntrada({
      productoId:      +this.formEntrada.productoId,
      cantidad:        +this.formEntrada.cantidad,
      documentoOrigen: this.formEntrada.documentoOrigen || undefined,
      observacion:     this.formEntrada.observacion     || undefined,
    }).subscribe({
      next:  () => this.recargar(+this.formEntrada.productoId),
      error: e  => { this.errorMsg = e?.message ?? 'Error al guardar.'; this.saving.set(false); }
    });
  }

  guardarSalida() {
    if (!this.formSalida.productoId || !this.formSalida.cantidad) { this.errorMsg = 'Completa los campos requeridos.'; return; }
    this.saving.set(true); this.errorMsg = '';
    this.api.registrarAjusteOut({
      productoId:  +this.formSalida.productoId,
      cantidad:    +this.formSalida.cantidad,
      observacion: this.formSalida.observacion || 'Salida de inventario',
    }).subscribe({
      next:  () => this.recargar(+this.formSalida.productoId),
      error: e  => { this.errorMsg = e?.message ?? 'Error al guardar.'; this.saving.set(false); }
    });
  }

  guardarAjuste() {
    if (!this.formAjuste.productoId || !this.formAjuste.cantidad) { this.errorMsg = 'Completa los campos requeridos.'; return; }
    this.saving.set(true); this.errorMsg = '';
    const fn = this.formAjuste.tipoAjuste === 'in'
      ? this.api.registrarAjusteIn({ productoId: +this.formAjuste.productoId, cantidad: +this.formAjuste.cantidad, observacion: this.formAjuste.observacion || 'Ajuste' })
      : this.api.registrarAjusteOut({ productoId: +this.formAjuste.productoId, cantidad: +this.formAjuste.cantidad, observacion: this.formAjuste.observacion || 'Ajuste' });
    fn.subscribe({
      next:  () => this.recargar(+this.formAjuste.productoId),
      error: e  => { this.errorMsg = e?.message ?? 'Error al guardar.'; this.saving.set(false); }
    });
  }
}
