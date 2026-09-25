import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
import { ExportService } from '../../core/services/export.service';
import { AuthService } from '../../core/services/auth.service';
import { Producto } from '../../core/models';
// rebuild-trigger

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  ds    = inject(DataService);
  api   = inject(ApiService);
  sound = inject(SoundService);
  exp   = inject(ExportService);
  auth  = inject(AuthService);

  get isAdmin() { return this.auth.isAdmin(); }

  searchTerm       = signal('');
  filtroStock      = signal<'todos' | 'bajo' | 'critico' | 'normal'>('todos');
  loading          = signal(true);
  saving           = signal(false);
  showProductoForm = signal(false);
  showEntradaForm  = signal(false);
  errorMsg         = '';

  productos = signal<Producto[]>([]);

  formProd    = { codigo:'', nombre:'', descripcion:'', presentacion:'', volumen:1, unidad:'L', costoUnitario:0 };
  formEntrada = { productoId:'' as string, cantidad:null as number | null, documentoOrigen:'', observacion:'' };

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.ds.getInventarioHttp().subscribe({
      next: data => { this.productos.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); }
    });
  }

  filtered = computed(() => {
    const q    = this.searchTerm().toLowerCase();
    const f    = this.filtroStock();
    let list   = this.productos();

    if (f === 'bajo')    list = list.filter(p => p.stock > 0 && p.stock < (p.stockMinimo ?? 100));
    if (f === 'critico') list = list.filter(p => p.stock <= 0);
    if (f === 'normal')  list = list.filter(p => p.stock >= (p.stockMinimo ?? 100));

    return q
      ? list.filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          p.presentacion.toLowerCase().includes(q))
      : list;
  });

  get totalStock() { return this.productos().reduce((s, p) => s + p.stock * p.volumen, 0); }
  get totalValor() { return this.productos().reduce((s, p) => s + p.stock * p.precio, 0); }
  get stockBajos() { return this.productos().filter(p => p.stock <= (p.stockMinimo ?? 100)).length; }

  stockStatus(p: Producto): 'ok' | 'low' | 'critical' {
    if (p.stock <= 0)                     return 'critical';
    if (p.stock < (p.stockMinimo ?? 100)) return 'low';
    return 'ok';
  }
  stockBadge(p: Producto) {
    const s = this.stockStatus(p);
    if (s === 'critical') return { cls: 'badge--danger',  label: 'Sin stock' };
    if (s === 'low')      return { cls: 'badge--warning', label: 'Stock bajo' };
    return                       { cls: 'badge--success', label: 'Óptimo' };
  }

  onSearch(e: Event)    { this.searchTerm.set((e.target as HTMLInputElement).value); }
  onFiltroStock(e: Event) {
    this.filtroStock.set((e.target as HTMLSelectElement).value as any);
  }

  exportarExcel() {
    const rows = this.filtered().map(p => ({
      'Código':         p.codigo,
      'Producto':       p.nombre,
      'Presentación':   p.presentacion,
      'Precio compra':  p.precio,
      'Stock':          p.stock,
      'Total (L/kg)':   p.stock * p.volumen,
      'Valor (S/)':     +(p.stock * p.precio).toFixed(2),
      'Estado stock':   this.stockBadge(p).label,
    }));
    this.exp.toExcel(rows, `Inventario-${new Date().toISOString().slice(0,10)}`, 'Inventario');
    this.sound.play('success');
  }

  imprimir() { this.sound.play('click'); window.print(); }

  openNuevoProducto() {
    this.formProd = { codigo:'', nombre:'', descripcion:'', presentacion:'', volumen:1, unidad:'L', costoUnitario:0 };
    this.errorMsg = '';
    this.showProductoForm.set(true);
    this.sound.play('click');
  }

  openRegistrarEntrada() {
    this.formEntrada = { productoId:'', cantidad:null, documentoOrigen:'', observacion:'' };
    this.errorMsg = '';
    this.showEntradaForm.set(true);
    this.sound.play('click');
  }

  closeModals() { this.showProductoForm.set(false); this.showEntradaForm.set(false); }

  guardarProducto() {
    if (!this.formProd.codigo || !this.formProd.nombre || !this.formProd.costoUnitario) {
      this.errorMsg = 'Código, nombre y costo son obligatorios.'; return;
    }
    this.saving.set(true); this.errorMsg = '';
    this.api.createProducto({
      codigo: this.formProd.codigo, nombre: this.formProd.nombre,
      descripcion:  this.formProd.descripcion  || undefined,
      presentacion: this.formProd.presentacion || undefined,
      volumen: this.formProd.volumen, unidad: this.formProd.unidad,
      costoUnitario: this.formProd.costoUnitario,
    }).subscribe({
      next: () => { this.sound.play('success'); this.saving.set(false); this.closeModals(); this.cargar(); },
      error: e  => { this.errorMsg = e?.message ?? 'Error al guardar.'; this.saving.set(false); }
    });
  }

  guardarEntrada() {
    if (!this.formEntrada.productoId) {
      this.errorMsg = 'Selecciona un producto.'; return;
    }
    if (!this.formEntrada.cantidad || +this.formEntrada.cantidad < 1) {
      this.errorMsg = 'La cantidad debe ser mayor a 0.'; return;
    }
    this.saving.set(true); this.errorMsg = '';
    this.api.registrarEntrada({
      productoId:      +this.formEntrada.productoId,
      cantidad:        +this.formEntrada.cantidad,
      documentoOrigen: this.formEntrada.documentoOrigen || undefined,
      observacion:     this.formEntrada.observacion     || undefined,
    }).subscribe({
      next: () => { this.sound.play('success'); this.saving.set(false); this.closeModals(); this.cargar(); },
      error: e  => {
        this.errorMsg = e?.message ?? e?.error?.message ?? 'Error al registrar la entrada. Verifica conexión con el servidor.';
        this.saving.set(false);
      }
    });
  }
}

