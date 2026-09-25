import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { DataService } from '../../../core/services/data.service';
import { SoundService } from '../../../core/services/sound.service';
import { Producto, MovimientoInventario } from '../../../core/models';

@Component({
  selector: 'app-entradas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="entradas animate-fade">
  <div class="page-header">
    <div><h1>Entradas de Inventario</h1><p class="breadcrumb">Inventario / Entradas</p></div>
    <div class="header-actions">
      <a routerLink="/inventario" class="btn btn--outline">
        <span class="material-icons-round">arrow_back</span> Volver al stock
      </a>
      <button class="btn btn--primary" (click)="openModal()">
        <span class="material-icons-round">add</span> Registrar entrada
      </button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon stat-icon--success"><span class="material-icons-round">add_circle</span></div>
      <div class="stat-body"><span class="stat-label">Entradas este mes</span><span class="stat-value">{{ entradas().length }}</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--info"><span class="material-icons-round">water_drop</span></div>
      <div class="stat-body"><span class="stat-label">Unidades ingresadas</span><span class="stat-value">{{ totalUnidades | number:'1.0-0' }}</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--orange"><span class="material-icons-round">inventory_2</span></div>
      <div class="stat-body"><span class="stat-label">Productos afectados</span><span class="stat-value">{{ productosAfectados }}</span></div>
    </div>
  </div>

  <div class="loading-row" *ngIf="loading()">
    <span class="material-icons-round spin">autorenew</span> Cargando...
  </div>

  <div class="card table-card" *ngIf="!loading()">
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Producto</th><th>Tipo</th><th>Cantidad</th>
            <th>Fecha</th><th>Usuario</th><th>Documento Origen</th>
            <th>Observación</th><th>Stock Resultante</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of entradas()">
            <td class="mono">#{{ m.id }}</td>
            <td>{{ m.productoNombre }}</td>
            <td><span class="badge badge--success">{{ m.tipoMovimiento }}</span></td>
            <td class="fw-600">{{ m.cantidad | number:'1.0-0' }}</td>
            <td>{{ m.fecha }}</td>
            <td>{{ m.usuario }}</td>
            <td class="mono">{{ m.documentoOrigen ?? '—' }}</td>
            <td>{{ m.observacion ?? '—' }}</td>
            <td class="fw-600">{{ m.stockResultante | number:'1.0-0' }}</td>
          </tr>
          <tr *ngIf="entradas().length === 0">
            <td colspan="9" class="empty-row">No hay entradas registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── Modal Registrar Entrada ── -->
  <div class="modal-backdrop" *ngIf="showModal()" (click)="closeModal()">
    <div class="modal-card animate-fade" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3>Registrar Entrada de Stock</h3>
        <button class="icon-btn" (click)="closeModal()"><span class="material-icons-round">close</span></button>
      </div>
      <div class="modal-body">
        <div class="alert-error" *ngIf="errorMsg">
          <span class="material-icons-round">error_outline</span> {{ errorMsg }}
        </div>
        <div class="mock-form-grid">
          <div class="fg" style="grid-column:span 2">
            <label>Producto</label>
            <select [(ngModel)]="form.productoId">
              <option value="">-- Seleccionar producto --</option>
              <option *ngFor="let p of productos()" [value]="p.id">{{ p.nombre }} (Stock: {{ p.stock }})</option>
            </select>
          </div>
          <div class="fg">
            <label>Cantidad</label>
            <input type="number" min="1" [(ngModel)]="form.cantidad" placeholder="Ej: 100" />
          </div>
          <div class="fg">
            <label>N° Documento origen</label>
            <input [(ngModel)]="form.documentoOrigen" placeholder="OC-2026-001" />
          </div>
          <div class="fg" style="grid-column:span 2">
            <label>Observación</label>
            <input [(ngModel)]="form.observacion" placeholder="Opcional" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn--outline" (click)="closeModal()">Cancelar</button>
        <button class="btn btn--primary" (click)="guardar()" [disabled]="saving()">
          <span class="material-icons-round">{{ saving() ? 'hourglass_empty' : 'save' }}</span>
          {{ saving() ? 'Registrando…' : 'Registrar entrada' }}
        </button>
      </div>
    </div>
  </div>
</div>`,
  styles: [`.entradas{max-width:1400px}.header-actions{display:flex;gap:8px}.table-wrap{overflow-x:auto}.fw-600{font-weight:600}.mono{font-family:monospace;font-size:.82rem}.loading-row{display:flex;align-items:center;gap:8px;padding:24px;color:#666}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.alert-error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px;margin-bottom:12px}.mock-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fg{display:flex;flex-direction:column;gap:4px}.fg label{font-size:.8rem;font-weight:600;color:#555}.fg input,.fg select{padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:.9rem}.empty-row{text-align:center;padding:24px;color:#aaa}`]
})
export class EntradasComponent implements OnInit {
  api   = inject(ApiService);
  ds    = inject(DataService);
  sound = inject(SoundService);

  loading   = signal(true);
  saving    = signal(false);
  showModal = signal(false);
  errorMsg  = '';

  movimientos = signal<MovimientoInventario[]>([]);
  productos   = signal<Producto[]>([]);

  form = { productoId: '', cantidad: 1, documentoOrigen: '', observacion: '' };

  ngOnInit() {
    this.ds.getInventarioHttp().subscribe({
      next: prods => { this.productos.set(prods); this.loading.set(false); },
      error: ()   => { this.loading.set(false); },
    });
  }

  entradas = computed(() =>
    this.movimientos().filter(m => m.tipoMovimiento === 'ENTRADA')
  );

  get totalUnidades() { return this.entradas().reduce((s, m) => s + m.cantidad, 0); }
  get productosAfectados() { return new Set(this.entradas().map(m => m.productoId)).size; }

  openModal() {
    this.form = { productoId: '', cantidad: 1, documentoOrigen: '', observacion: '' };
    this.errorMsg = '';
    this.showModal.set(true);
    this.sound.play('click');
  }

  closeModal() {
    this.showModal.set(false);
    this.errorMsg = '';
  }

  guardar() {
    if (!this.form.productoId || !this.form.cantidad || this.form.cantidad < 1) {
      this.errorMsg = 'Producto y cantidad (mínimo 1) son obligatorios.';
      return;
    }
    this.saving.set(true);
    this.errorMsg = '';
    this.api.registrarEntrada({
      productoId:      +this.form.productoId,
      cantidad:        +this.form.cantidad,
      documentoOrigen: this.form.documentoOrigen || undefined,
      observacion:     this.form.observacion     || undefined,
    }).subscribe({
      next: (mov) => {
        // Agregar el movimiento a la lista local y refrescar stock
        const prod = this.productos().find(p => p.id === +this.form.productoId);
        const nuevo: MovimientoInventario = {
          id:              mov.idMovimiento,
          productoId:      +this.form.productoId,
          productoNombre:  prod?.nombre ?? `Producto #${this.form.productoId}`,
          tipoMovimiento:  'ENTRADA',
          cantidad:        +this.form.cantidad,
          fecha:           mov.fecha?.split('T')[0] ?? new Date().toISOString().split('T')[0],
          usuario:         mov.usuario?.nombre ?? 'Usuario',
          documentoOrigen: this.form.documentoOrigen || undefined,
          observacion:     this.form.observacion     || undefined,
          stockResultante: mov.saldoAcumulado ?? 0,
        };
        this.movimientos.set([nuevo, ...this.movimientos()]);
        // Actualizar stock del producto localmente
        this.productos.set(this.productos().map(p =>
          p.id === +this.form.productoId
            ? { ...p, stock: p.stock + +this.form.cantidad }
            : p
        ));
        this.sound.play('success');
        this.saving.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Error al registrar la entrada.';
        this.saving.set(false);
      },
    });
  }
}
