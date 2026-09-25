import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
import { Producto } from '../../core/models';

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
  cdr   = inject(ChangeDetectorRef);

  searchTerm       = signal('');
  loading          = signal(true);
  saving           = signal(false);
  showProductoForm = signal(false);
  showEntradaForm  = signal(false);
  errorMsg         = '';

  // Signal en lugar de array normal — computed() puede rastrearlo
  productos = signal<Producto[]>([]);

  formProd    = { codigo:'', nombre:'', descripcion:'', presentacion:'', volumen:1, unidad:'L', costoUnitario:0 };
  formEntrada = { productoId:'', cantidad:0, documentoOrigen:'', observacion:'' };

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.ds.getInventarioHttp().subscribe({
      next: data => { this.productos.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); }
    });
  }

  // computed() ahora detecta cambios en productos() porque es un signal
  filtered = computed(() => {
    const q    = this.searchTerm().toLowerCase();
    const list = this.productos();
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
    if (p.stock <= 0)                        return 'critical';
    if (p.stock < (p.stockMinimo ?? 100))    return 'low';
    return 'ok';
  }
  stockBadge(p: Producto) {
    const s = this.stockStatus(p);
    if (s === 'critical') return { cls: 'badge--danger',  label: 'Sin stock' };
    if (s === 'low')      return { cls: 'badge--warning', label: 'Stock bajo' };
    return                       { cls: 'badge--success', label: 'Óptimo' };
  }

  onSearch(e: Event) { this.searchTerm.set((e.target as HTMLInputElement).value); }

  openNuevoProducto() {
    this.formProd = { codigo:'', nombre:'', descripcion:'', presentacion:'', volumen:1, unidad:'L', costoUnitario:0 };
    this.errorMsg = '';
    this.showProductoForm.set(true);
    this.sound.play('click');
  }

  openRegistrarEntrada() {
    this.formEntrada = { productoId:'', cantidad:0, documentoOrigen:'', observacion:'' };
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
      codigo:       this.formProd.codigo,
      nombre:       this.formProd.nombre,
      descripcion:  this.formProd.descripcion  || undefined,
      presentacion: this.formProd.presentacion || undefined,
      volumen:      this.formProd.volumen,
      unidad:       this.formProd.unidad,
      costoUnitario:this.formProd.costoUnitario,
    }).subscribe({
      next: () => { this.sound.play('success'); this.saving.set(false); this.closeModals(); this.cargar(); },
      error: e  => { this.errorMsg = e?.message ?? 'Error al guardar.'; this.saving.set(false); }
    });
  }

  guardarEntrada() {
    if (!this.formEntrada.productoId || !this.formEntrada.cantidad) {
      this.errorMsg = 'Producto y cantidad son obligatorios.'; return;
    }
    this.saving.set(true); this.errorMsg = '';
    this.api.registrarEntrada({
      productoId:      +this.formEntrada.productoId,
      cantidad:        +this.formEntrada.cantidad,
      documentoOrigen: this.formEntrada.documentoOrigen || undefined,
      observacion:     this.formEntrada.observacion     || undefined,
    }).subscribe({
      next: () => { this.sound.play('success'); this.saving.set(false); this.closeModals(); this.cargar(); },
      error: e  => { this.errorMsg = e?.message ?? 'Error al registrar.'; this.saving.set(false); }
    });
  }
}
