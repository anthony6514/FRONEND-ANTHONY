import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { SoundService } from '../../core/services/sound.service';
import { ExportService } from '../../core/services/export.service';
import { AuthService } from '../../core/services/auth.service';
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
  exp   = inject(ExportService);
  auth  = inject(AuthService);

  ventas  = signal<Venta[]>([]);
  loading = signal(true);
  search  = signal('');
  filtroMoneda = signal<'TODOS' | 'PEN' | 'USD'>('TODOS');

  ngOnInit() {
    this.ds.getVentasHttp().subscribe({
      next: data => { this.ventas.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); }
    });
  }

  filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const mon  = this.filtroMoneda();
    let list   = this.ventas();
    if (mon !== 'TODOS') list = list.filter(v => v.moneda === mon);
    return q ? list.filter(v =>
      v.numero.toLowerCase().includes(q) ||
      v.clienteNombre.toLowerCase().includes(q) ||
      v.vendedor.toLowerCase().includes(q)
    ) : list;
  });

  get totalVentas() { return this.ventas().length; }
  get montoTotal()  { return this.ventas().reduce((s, v) => s + v.totalVenta, 0); }
  get saldoTotal()  { return this.ventas().reduce((s, v) => s + v.saldoPendiente, 0); }
  get cobrado()     { return this.ventas().reduce((s, v) => s + v.totalAbonado, 0); }

  exportarExcel() {
    const rows = this.filtered().map(v => ({
      'N° Venta':         v.numero,
      'Fecha':            v.fecha,
      'Cliente':          v.clienteNombre,
      'Vendedor':         v.vendedor,
      'N° Proforma':      v.proformaNro ?? '',
      'Moneda':           v.moneda,
      'Estado':           v.estado,
      'Total venta':      v.totalVenta,
      'Total abonado':    v.totalAbonado,
      'Saldo pendiente':  v.saldoPendiente,
    }));
    this.exp.toExcel(rows, `Ventas-${new Date().toISOString().slice(0,10)}`, 'Ventas');
    this.sound.play('success');
  }

  imprimir() { this.sound.play('click'); window.print(); }

  estadoBadge(e: string) {
    const m: Record<string, string> = {
      PENDIENTE: 'badge--warning', PAGADA: 'badge--success',
      ANULADA:   'badge--danger',  PARCIAL: 'badge--info'
    };
    return m[e] ?? 'badge--neutral';
  }
}

