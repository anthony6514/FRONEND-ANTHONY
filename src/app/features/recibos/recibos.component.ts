import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
import { ExportService } from '../../core/services/export.service';
import { Recibo } from '../../core/models';

@Component({
  selector: 'app-recibos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recibos.component.html',
  styleUrl: './recibos.component.scss',
})
export class RecibosComponent implements OnInit {
  ds    = inject(DataService);
  api   = inject(ApiService);
  sound = inject(SoundService);
  exp   = inject(ExportService);

  recibos = signal<Recibo[]>([]);
  loading = signal(true);
  search  = signal('');
  showNew = signal(false);
  saving  = signal(false);
  filtroMoneda = signal<'TODOS' | 'PEN' | 'USD'>('TODOS');

  reciboForm = { ventaId: '', monto: '', observacion: '' };

  ngOnInit() {
    this.ds.getRecibosHttp().subscribe({
      next: data => { this.recibos.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); }
    });
  }

  filtered = computed(() => {
    const q    = this.search().toLowerCase();
    const mon  = this.filtroMoneda();
    let list   = this.recibos();
    if (mon !== 'TODOS') list = list.filter(r => r.moneda === mon);
    return q ? list.filter(r =>
      r.numero.toLowerCase().includes(q) ||
      (r.clienteNombre ?? '').toLowerCase().includes(q) ||
      (r.proformaNro   ?? '').toLowerCase().includes(q)
    ) : list;
  });

  get cobrosHoy()           { return this.recibos().reduce((s, r) => s + r.monto, 0); }
  get saldoTotal()          { return this.recibos().reduce((s, r) => s + r.saldoPendiente, 0); }
  get totalRecibos()        { return this.recibos().length; }
  get proformasNoCobradas() { return this.recibos().filter(r => r.saldoPendiente > 0).length; }

  metodo(m: string) {
    const icons: Record<string, string> = {
      TRANSFERENCIA: 'swap_horiz', EFECTIVO: 'payments',
      CHEQUE: 'article', DEPOSITO: 'account_balance'
    };
    return icons[m] ?? 'payment';
  }

  exportarExcel() {
    const rows = this.filtered().map(r => ({
      'N° Recibo':        r.numero,
      'Fecha':            r.fecha,
      'N° Venta/Proforma':r.proformaNro ?? '',
      'Cliente':          r.clienteNombre ?? '',
      'Vendedor':         r.vendedor ?? '',
      'Moneda':           r.moneda,
      'Abono':            r.monto,
      'Método de pago':   r.metodoPago,
      'Saldo pendiente':  r.saldoPendiente,
    }));
    this.exp.toExcel(rows, `Recibos-${new Date().toISOString().slice(0,10)}`, 'Recibos');
    this.sound.play('success');
  }

  imprimir() { this.sound.play('click'); window.print(); }

  openNew() { this.showNew.set(true); this.sound.play('click'); }

  saveRecibo() {
    this.saving.set(true);
    this.api.createRecibo({
      ventaId:     Number(this.reciboForm.ventaId),
      monto:       Number(this.reciboForm.monto),
      observacion: this.reciboForm.observacion || undefined,
    }).subscribe({
      next: () => {
        this.ds.getRecibosHttp().subscribe(data => {
          this.recibos.set(data);
          this.saving.set(false);
          this.showNew.set(false);
          this.sound.play('success');
        });
      },
      error: (err) => {
        alert('Error al guardar: ' + (err?.message ?? 'Sin conexión con el servidor'));
        this.saving.set(false);
      }
    });
  }

  close() { this.showNew.set(false); }
}

