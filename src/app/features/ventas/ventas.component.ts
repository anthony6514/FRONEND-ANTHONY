import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { SoundService } from '../../core/services/sound.service';
import { Venta } from '../../core/models';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent implements OnInit {
  ds    = inject(DataService);
  sound = inject(SoundService);

  ventas:  Venta[] = [];
  loading  = signal(true);
  search   = signal('');

  ngOnInit() {
    this.ds.getVentasHttp().subscribe(data => {
      this.ventas = data;
      this.loading.set(false);
    });
  }

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q ? this.ventas.filter(v =>
      v.numero.toLowerCase().includes(q) ||
      v.clienteNombre.toLowerCase().includes(q) ||
      v.vendedor.toLowerCase().includes(q)
    ) : this.ventas;
  });

  get totalVentas() { return this.ventas.length; }
  get montoTotal()  { return this.ventas.reduce((s, v) => s + v.totalVenta, 0); }
  get saldoTotal()  { return this.ventas.reduce((s, v) => s + v.saldoPendiente, 0); }
  get cobrado()     { return this.ventas.reduce((s, v) => s + v.totalAbonado, 0); }

  estadoBadge(e: string) {
    const m: Record<string,string> = { PENDIENTE:'badge--warning', PAGADA:'badge--success', ANULADA:'badge--danger', PARCIAL:'badge--info' };
    return m[e] ?? 'badge--neutral';
  }
}
