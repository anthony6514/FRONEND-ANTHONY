import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
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

  recibos: Recibo[] = [];
  loading  = signal(true);
  search   = signal('');
  showNew  = signal(false);
  saving   = signal(false);

  // Form
  reciboForm = { ventaId: '', monto: '', observacion: '' };

  ngOnInit() {
    this.ds.getRecibosHttp().subscribe(data => {
      this.recibos = data;
      this.loading.set(false);
    });
  }

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q ? this.recibos.filter(r =>
      r.numero.toLowerCase().includes(q) ||
      r.clienteNombre.toLowerCase().includes(q) ||
      r.proformaNro.toLowerCase().includes(q)
    ) : this.recibos;
  });

  get cobrosHoy()   { return this.recibos.reduce((s, r) => s + r.monto, 0); }
  get saldoTotal()  { return this.recibos.reduce((s, r) => s + r.saldoPendiente, 0); }
  get totalRecibos(){ return this.recibos.length; }
  get proformasNoCobradas() { return this.recibos.filter(r => r.saldoPendiente > 0).length; }

  metodo(m: string) {
    const icons: Record<string,string> = { TRANSFERENCIA:'swap_horiz', EFECTIVO:'payments', CHEQUE:'article', DEPOSITO:'account_balance' };
    return icons[m] ?? 'payment';
  }

  openNew() { this.showNew.set(true); this.sound.play('click'); }

  saveRecibo() {
    this.saving.set(true);
    this.api.createRecibo({
      ventaId: Number(this.reciboForm.ventaId),
      monto: Number(this.reciboForm.monto),
      observacion: this.reciboForm.observacion || undefined,
    }).subscribe({
      next: () => {
        this.ds.getRecibosHttp().subscribe(data => {
          this.recibos = data;
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
