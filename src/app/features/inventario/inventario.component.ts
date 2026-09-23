import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { SoundService } from '../../core/services/sound.service';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent implements OnInit {
  ds    = inject(DataService);
  sound = inject(SoundService);

  searchTerm = signal('');
  loading    = signal(true);
  productos: Producto[] = [];

  // Carga desde el backend (con fallback automático a mock)
  ngOnInit() {
    this.ds.getInventarioHttp().subscribe(data => {
      this.productos = data;
      this.loading.set(false);
    });
  }

  filtered = computed(() => {
    const q = this.searchTerm().toLowerCase();
    return q
      ? this.productos.filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          p.presentacion.toLowerCase().includes(q)
        )
      : this.productos;
  });

  get totalStock()  { return this.productos.reduce((s, p) => s + p.stock * p.volumen, 0); }
  get totalValor()  { return this.productos.reduce((s, p) => s + p.stock * p.precio, 0); }
  get stockBajos()  { return this.productos.filter(p => p.stock <= (p.stockMinimo ?? 100)).length; }

  stockStatus(p: Producto): 'ok' | 'low' | 'critical' {
    const min = p.stockMinimo ?? 100;
    if (p.stock <= 0)   return 'critical';
    if (p.stock < min)  return 'low';
    return 'ok';
  }

  stockBadge(p: Producto) {
    const s = this.stockStatus(p);
    if (s === 'critical') return { cls: 'badge--danger',  label: 'Sin stock' };
    if (s === 'low')      return { cls: 'badge--warning', label: 'Stock bajo' };
    return                       { cls: 'badge--success', label: 'Normal' };
  }

  onSearch(e: Event) {
    this.searchTerm.set((e.target as HTMLInputElement).value);
  }
}
