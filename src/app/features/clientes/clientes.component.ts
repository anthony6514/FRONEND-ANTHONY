import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesComponent implements OnInit {
  ds    = inject(DataService);
  api   = inject(ApiService);
  sound = inject(SoundService);

  clientes: Cliente[] = [];
  loading     = signal(true);
  search      = signal('');
  showForm    = signal(false);
  editCliente = signal<Cliente | null>(null);
  saving      = signal(false);

  form = { nombre:'', ruc:'', telefono:'', ciudad:'', vendedor:'' };

  ngOnInit() {
    this.ds.getClientesHttp().subscribe(data => {
      this.clientes = data;
      this.loading.set(false);
    });
  }

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q
      ? this.clientes.filter(c =>
          c.nombre.toLowerCase().includes(q) ||
          c.ruc.includes(q) ||
          (c.ciudad ?? '').toLowerCase().includes(q)
        )
      : this.clientes;
  });

  get totalClientes()   { return this.clientes.length; }
  get clientesActivos() { return this.clientes.filter(c => c.estado === 'ACTIVO').length; }
  get conSaldo()        { return this.clientes.filter(c => c.saldoPendiente > 0).length; }
  get totalSaldo()      { return this.clientes.reduce((s, c) => s + c.saldoPendiente, 0); }

  openNew() {
    this.editCliente.set(null);
    this.form = { nombre:'', ruc:'', telefono:'', ciudad:'', vendedor:'' };
    this.showForm.set(true);
    this.sound.play('click');
  }

  openEdit(c: Cliente) {
    this.editCliente.set(c);
    this.form = { nombre:c.nombre, ruc:c.ruc, telefono:c.telefono??'', ciudad:c.ciudad??'', vendedor:c.vendedor??'' };
    this.showForm.set(true);
    this.sound.play('click');
  }

  save() {
    this.saving.set(true);
    const body = { identificacion: this.form.ruc, nombre: this.form.nombre, telefono: this.form.telefono, direccion: this.form.ciudad };
    const edit = this.editCliente();

    const req = edit
      ? this.api.updateCliente(edit.id, body)
      : this.api.createCliente(body);

    req.subscribe({
      next: () => {
        // Recargar lista
        this.ds.getClientesHttp().subscribe(data => {
          this.clientes = data;
          this.saving.set(false);
          this.showForm.set(false);
          this.sound.play('success');
        });
      },
      error: () => {
        // Fallback: actualizar localmente
        if (edit) {
          const idx = this.clientes.findIndex(c => c.id === edit.id);
          if (idx >= 0) Object.assign(this.clientes[idx], { nombre: this.form.nombre, ruc: this.form.ruc, telefono: this.form.telefono, ciudad: this.form.ciudad });
        } else {
          this.clientes.push({ id: Date.now(), ...this.form, totalCompras:0, saldoPendiente:0, estado:'ACTIVO' });
        }
        this.saving.set(false);
        this.showForm.set(false);
        this.sound.play('success');
      }
    });
  }

  close() { this.showForm.set(false); }
}
