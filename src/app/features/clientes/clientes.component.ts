import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
import { ExportService } from '../../core/services/export.service';
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
  exp   = inject(ExportService);

  clientes    = signal<Cliente[]>([]);
  loading     = signal(true);
  search      = signal('');
  filtroEstado  = signal<'todos' | 'ACTIVO' | 'INACTIVO'>('todos');
  filtroVendedor= signal('todos');
  filtroCiudad  = signal('todos');
  showForm    = signal(false);
  editCliente = signal<Cliente | null>(null);
  saving      = signal(false);

  form = { nombre:'', ruc:'', telefono:'', ciudad:'', vendedor:'' };

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.ds.getClientesHttp().subscribe({
      next: data => { this.clientes.set(data); this.loading.set(false); },
      error: ()   => { this.loading.set(false); }
    });
  }

  get vendedoresUnicos(): string[] {
    const set = new Set(this.clientes().map(c => c.vendedor ?? '').filter(v => v));
    return [...set].sort();
  }

  get ciudadesUnicas(): string[] {
    const set = new Set(this.clientes().map(c => c.ciudad ?? '').filter(c => c));
    return [...set].sort();
  }

  filtered = computed(() => {
    let list = this.clientes();
    const q  = this.search().toLowerCase();
    const fe = this.filtroEstado();
    const fv = this.filtroVendedor();
    const fc = this.filtroCiudad();

    if (fe !== 'todos') list = list.filter(c => c.estado === fe);
    if (fv !== 'todos') list = list.filter(c => c.vendedor === fv);
    if (fc !== 'todos') list = list.filter(c => c.ciudad   === fc);

    return q
      ? list.filter(c =>
          c.nombre.toLowerCase().includes(q) ||
          (c.ruc ?? '').toLowerCase().includes(q) ||
          (c.ciudad ?? '').toLowerCase().includes(q))
      : list;
  });

  get totalClientes()   { return this.clientes().length; }
  get clientesActivos() { return this.clientes().filter(c => c.estado === 'ACTIVO').length; }
  get conSaldo()        { return this.clientes().filter(c => c.saldoPendiente > 0).length; }
  get totalSaldo()      { return this.clientes().reduce((s, c) => s + c.saldoPendiente, 0); }

  exportarExcel() {
    const rows = this.filtered().map(c => ({
      'N° Cliente':       `CL-${String(c.id).padStart(6, '0')}`,
      'RUC/Documento':    c.ruc ?? '',
      'Razón social':     c.nombre,
      'Teléfono':         c.telefono ?? '',
      'Ciudad':           c.ciudad ?? '',
      'Vendedor':         c.vendedor ?? '',
      'Total compras':    c.totalCompras,
      'Saldo pendiente':  c.saldoPendiente,
      'Estado':           c.estado,
    }));
    this.exp.toExcel(rows, `Clientes-${new Date().toISOString().slice(0,10)}`, 'Clientes');
    this.sound.play('success');
  }

  imprimir() { this.sound.play('click'); window.print(); }

  openNew() {
    this.editCliente.set(null);
    this.form = { nombre:'', ruc:'', telefono:'', ciudad:'', vendedor:'' };
    this.showForm.set(true);
    this.sound.play('click');
  }

  openEdit(c: Cliente) {
    this.editCliente.set(c);
    this.form = { nombre:c.nombre, ruc:c.ruc ?? '', telefono:c.telefono ?? '', ciudad:c.ciudad ?? '', vendedor:c.vendedor ?? '' };
    this.showForm.set(true);
    this.sound.play('click');
  }

  save() {
    this.saving.set(true);
    const body = { identificacion: this.form.ruc, nombre: this.form.nombre, telefono: this.form.telefono, direccion: this.form.ciudad };
    const edit = this.editCliente();
    const req  = edit ? this.api.updateCliente(edit.id, body) : this.api.createCliente(body);
    req.subscribe({
      next: () => {
        this.ds.getClientesHttp().subscribe(data => {
          this.clientes.set(data);
          this.saving.set(false);
          this.showForm.set(false);
          this.sound.play('success');
        });
      },
      error: () => {
        const current = this.clientes();
        if (edit) {
          this.clientes.set(current.map(c =>
            c.id === edit.id
              ? { ...c, nombre: this.form.nombre, ruc: this.form.ruc, telefono: this.form.telefono, ciudad: this.form.ciudad }
              : c
          ));
        } else {
          this.clientes.set([...current, { id: Date.now(), ...this.form, totalCompras:0, saldoPendiente:0, estado:'ACTIVO' }]);
        }
        this.saving.set(false);
        this.showForm.set(false);
        this.sound.play('success');
      }
    });
  }

  close() { this.showForm.set(false); }
}

