import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { DataService }   from '../../core/services/data.service';
import { SoundService }  from '../../core/services/sound.service';
import { ApiService }    from '../../core/services/api.service';
import { Proforma, Producto, Cliente } from '../../core/models';
import { AuthService }   from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';

export interface LineaDetalle {
  productoId:     number;
  productoNombre: string;
  presentacion:   string;
  unidad:         string;
  cantidad:       number;
  precioUnitario: number;
  importe:        number;
}

@Component({
  selector: 'app-proformas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proformas.component.html',
  styleUrl: './proformas.component.scss',
})
export class ProformasComponent implements OnInit {
  ds    = inject(DataService);
  sound = inject(SoundService);
  api   = inject(ApiService);
  auth  = inject(AuthService);
  exp   = inject(ExportService);

  // ── Signals para que computed() detecte cambios ────────────────────────────
  proformas = signal<Proforma[]>([]);
  productos = signal<Producto[]>([]);
  clientes  = signal<Cliente[]>([]);

  loading  = signal(true);
  search   = signal('');
  showNew  = signal(false);
  filtroMoneda = signal<'TODOS' | 'PEN' | 'USD'>('TODOS');

  // ── Modal de detalle ───────────────────────────────────────────────────────
  proformaSeleccionada = signal<Proforma | null>(null);
  showDetalle          = signal(false);

  // ── Anular ─────────────────────────────────────────────────────────────────
  anulando         = signal(false);
  proformaAnularId = signal<number | null>(null);
  showConfirmAnular= signal(false);

  // ── PDF ────────────────────────────────────────────────────────────────────
  descargandoPdf   = signal<number | null>(null);

  // ── Formulario nueva proforma ──────────────────────────────────────────────
  nro            = '';
  fecha          = '';
  moneda: 'PEN' | 'USD' = 'PEN';
  clienteId      = 0;
  vendedorNombre = '';
  observacion    = '';
  lineas: LineaDetalle[] = [];

  clienteSearch        = '';
  clientesFiltrados: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;

  saving   = signal(false);
  errorMsg = '';

  // ── Ciclo de vida ──────────────────────────────────────────────────────────
  ngOnInit() {
    this.ds.getProformasHttp().subscribe({
      next:  data => { this.proformas.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); },
    });
    this.ds.getProductosHttp().subscribe({
      next:  data => { this.productos.set(data.filter(p => p.estado === 'ACTIVO')); },
      error: ()   => {},
    });
    this.ds.getClientesHttp().subscribe({
      next:  data => { this.clientes.set(data); },
      error: ()   => {},
    });
  }

  // ── Tabla ──────────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const mon  = this.filtroMoneda();
    let list   = this.proformas();
    if (mon !== 'TODOS') list = list.filter(p => p.moneda === mon);
    return q
      ? list.filter(p =>
          p.numero.toLowerCase().includes(q) ||
          p.clienteNombre.toLowerCase().includes(q) ||
          p.vendedor.toLowerCase().includes(q))
      : list;
  });

  get totalProformas() { return this.proformas().length; }
  get delMes() {
    const prefix = new Date().toISOString().slice(0, 7);
    return this.proformas().filter(p => p.fecha.startsWith(prefix)).length;
  }
  get aprobadas() { return this.proformas().filter(p => p.estado === 'EMITIDA').length; }
  get montoMes()  {
    const prefix = new Date().toISOString().slice(0, 7);
    return this.proformas().filter(p => p.fecha.startsWith(prefix)).reduce((s, p) => s + p.total, 0);
  }

  estadoBadge(e: string) { return e === 'EMITIDA' ? 'badge--success' : 'badge--danger'; }

  // ── Abrir/cerrar formulario ────────────────────────────────────────────────
  openNew() {
    this.sound.play('click');
    this._resetForm();
    this.showNew.set(true);
  }

  close() {
    this.showNew.set(false);
    this.errorMsg = '';
  }

  private _resetForm() {
    this.nro                 = `PRO-${this.proformas().length + 1}`;
    this.fecha               = new Date().toISOString().split('T')[0];
    this.moneda              = 'PEN';
    this.clienteId           = 0;
    this.clienteSearch       = '';
    this.clienteSeleccionado = null;
    this.clientesFiltrados   = [];
    this.vendedorNombre      = '';
    this.observacion         = '';
    this.lineas              = [];
    this.errorMsg            = '';
    this.addLinea();
  }

  // ── Búsqueda de cliente ────────────────────────────────────────────────────
  onClienteInput() {
    const q = this.clienteSearch.toLowerCase();
    this.clientesFiltrados = q.length > 1
      ? this.clientes().filter(c =>
          c.nombre.toLowerCase().includes(q) || (c.ruc ?? '').includes(q))
      : [];
  }

  seleccionarCliente(c: Cliente) {
    this.clienteSeleccionado = c;
    this.clienteId           = c.id;
    this.clienteSearch       = c.nombre;
    this.clientesFiltrados   = [];
  }

  // ── Líneas de detalle ──────────────────────────────────────────────────────
  addLinea() {
    this.lineas.push({
      productoId: 0, productoNombre: '', presentacion: '',
      unidad: '', cantidad: 1, precioUnitario: 0, importe: 0,
    });
  }

  removeLinea(i: number) { this.lineas.splice(i, 1); }

  onProductoChange(i: number, idStr: string) {
    const id = +idStr;
    const p  = this.productos().find(x => x.id === id);
    if (!p) return;
    this.lineas[i].productoId     = p.id;
    this.lineas[i].productoNombre = p.nombre;
    this.lineas[i].presentacion   = p.presentacion ?? '';
    this.lineas[i].unidad         = p.unidad;
    this.lineas[i].precioUnitario = p.precioVenta ?? p.precio;
    this.calcLinea(i);
  }

  calcLinea(i: number) {
    const l = this.lineas[i];
    l.importe = +(l.cantidad * l.precioUnitario).toFixed(2);
  }

  // ── Totales ────────────────────────────────────────────────────────────────
  get subtotalCalc() { return this.lineas.reduce((s, l) => s + l.importe, 0); }
  get igvCalc()      { return +(this.subtotalCalc * 0.18).toFixed(2); }
  get totalCalc()    { return +(this.subtotalCalc + this.igvCalc).toFixed(2); }

  get hoy() { return new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }); }
  get fechaVenceCalc() {
    const d = new Date(this.fecha || new Date());
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── Guardar ────────────────────────────────────────────────────────────────
  guardar() {
    this.errorMsg = '';
    if (!this.clienteId)            { this.errorMsg = 'Selecciona un cliente.'; return; }
    if (this.lineas.length === 0)   { this.errorMsg = 'Agrega al menos un producto.'; return; }
    const lineasValidas = this.lineas.filter(l => l.productoId > 0 && l.cantidad > 0);
    if (lineasValidas.length === 0) { this.errorMsg = 'Completa al menos una línea de detalle.'; return; }

    this.saving.set(true);
    this.api.createProforma({
      clienteId:   this.clienteId,
      detalles:    lineasValidas.map(l => ({ productoId: l.productoId, cantidad: l.cantidad, precioUnitario: l.precioUnitario })),
      observacion: this.observacion || undefined,
    }).subscribe({
      next: () => {
        this.sound.play('success');
        this.saving.set(false);
        this.ds.getProformasHttp().subscribe(data => this.proformas.set(data));
        this.close();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Error al guardar. Revisa los datos.';
        this.saving.set(false);
      },
    });
  }

  // ── Exportar Excel ────────────────────────────────────────────────────────
  exportarExcel() {
    const rows = this.proformas().map(p => ({
      'N° Proforma':  p.numero,
      'Fecha':        p.fecha,
      'Cliente':      p.clienteNombre,
      'Vendedor':     p.vendedor,
      'Moneda':       p.moneda,
      'Subtotal':     p.subtotal,
      'IGV':          p.igv,
      'Total':        p.total,
      'Estado':       p.estado,
    }));
    this.exp.toExcel(rows, `Proformas-${new Date().toISOString().slice(0,10)}`, 'Proformas');
    this.sound.play('success');
  }

  // ── Ver detalle ────────────────────────────────────────────────────────────
  verDetalle(p: Proforma) {
    this.sound.play('click');
    this.proformaSeleccionada.set(p);
    this.showDetalle.set(true);
  }

  cerrarDetalle() {
    this.showDetalle.set(false);
    this.proformaSeleccionada.set(null);
  }

  // ── Descargar PDF ──────────────────────────────────────────────────────────
  descargarPdf(p: Proforma) {
    this.sound.play('click');
    this.descargandoPdf.set(p.id);
    this.api.getProformaPdf(p.id).subscribe({
      next: (blob) => {
        // Crear URL temporal y disparar descarga
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `Proforma-${p.numero}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.descargandoPdf.set(null);
        this.sound.play('success');
      },
      error: () => {
        // Si el backend aún no genera PDF, abrir vista previa imprimible
        this.descargandoPdf.set(null);
        this.verDetalle(p);
        setTimeout(() => window.print(), 400);
      },
    });
  }

  // ── Anular (con confirmación) ──────────────────────────────────────────────
  confirmarAnular(p: Proforma) {
    if (p.estado === 'ANULADA') return;
    this.proformaAnularId.set(p.id);
    this.showConfirmAnular.set(true);
    this.sound.play('click');
  }

  cancelarAnular() {
    this.proformaAnularId.set(null);
    this.showConfirmAnular.set(false);
  }

  ejecutarAnular() {
    const id = this.proformaAnularId();
    if (!id) return;
    this.anulando.set(true);
    this.api.cancelProforma(id).subscribe({
      next: () => {
        this.sound.play('success');
        this.anulando.set(false);
        this.cancelarAnular();
        // Actualizar estado localmente sin re-fetch
        this.proformas.set(
          this.proformas().map(p => p.id === id ? { ...p, estado: 'ANULADA' } : p)
        );
      },
      error: (err) => {
        alert(err?.message ?? 'No se pudo anular la proforma.');
        this.anulando.set(false);
        this.cancelarAnular();
      },
    });
  }
}
