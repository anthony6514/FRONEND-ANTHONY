import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataService } from '../../core/services/data.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';
import { ExportService } from '../../core/services/export.service';
import { Recibo } from '../../core/models';

interface VentaPendiente {
  ventaId:       number;
  proformaId?:   number;
  ventaNumero:   string;
  clienteId:     number;
  clienteNombre: string;
  proformaNro:   string;
  saldo:         number;
  moneda:        string;
}

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

  recibos      = signal<Recibo[]>([]);
  loading      = signal(true);
  search       = signal('');
  showNew      = signal(false);
  saving       = signal(false);
  filtroMoneda = signal<'TODOS' | 'PEN' | 'USD'>('TODOS');

  // Modal state
  clientes          = signal<{ id: number; nombre: string; ruc: string }[]>([]);
  todasVentas       = signal<VentaPendiente[]>([]);
  clienteSelecId    = signal('');
  proformaSelecId   = signal(''); // en realidad es el ventaId
  montoAbono        = signal('');
  observacion       = signal('');
  errorModal        = signal('');

  /** Ventas del cliente seleccionado */
  get ventasDeCliente(): VentaPendiente[] {
    const cid = Number(this.clienteSelecId());
    if (!cid) return [];
    return this.todasVentas().filter(v => v.clienteId === cid);
  }

  /** Venta/proforma seleccionada */
  get ventaActual(): VentaPendiente | null {
    const vid = Number(this.proformaSelecId());
    return this.todasVentas().find(v => v.ventaId === vid) ?? null;
  }

  ngOnInit() {
    this.ds.getRecibosHttp().subscribe({
      next: data => { this.recibos.set(data); this.loading.set(false); },
      error: ()   => {
        // Fallback a recibos mock
        this.recibos.set(this.ds.getRecibos());
        this.loading.set(false);
      }
    });
  }

  filtered = computed(() => {
    const q   = this.search().toLowerCase();
    const mon = this.filtroMoneda();
    let list  = this.recibos();
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
      'N° Recibo':         r.numero,
      'Fecha':             r.fecha,
      'N° Venta/Proforma': r.proformaNro ?? '',
      'Cliente':           r.clienteNombre ?? '',
      'Vendedor':          r.vendedor ?? '',
      'Moneda':            r.moneda,
      'Abono':             r.monto,
      'Método de pago':    r.metodoPago,
      'Saldo pendiente':   r.saldoPendiente,
    }));
    this.exp.toExcel(rows, `Recibos-${new Date().toISOString().slice(0,10)}`, 'Recibos');
    this.sound.play('success');
  }

  imprimir() { this.sound.play('click'); window.print(); }

  openNew() {
    if (this.showNew()) return;

    // reset
    this.clienteSelecId.set('');
    this.proformaSelecId.set('');
    this.montoAbono.set('');
    this.observacion.set('');
    this.errorModal.set('');
    this.clientes.set([]);
    this.todasVentas.set([]);
    this.showNew.set(true);
    this.sound.play('click');

    // Cargar clientes y ventas en paralelo con forkJoin — sin race condition
    forkJoin({
      clientes: this.ds.getClientesHttp().pipe(catchError(() => of(this.ds.getClientes()))),
      proformas: this.ds.getProformasHttp().pipe(catchError(() => of(this.ds.getProformas()))),
      ventas:   this.ds.getVentasHttp().pipe(  catchError(() => of(this.ds.getVentas()))),
    }).subscribe(({ clientes, proformas, ventas }) => {
      const proformasEmitidas = proformas.filter(p => p.estado === 'EMITIDA');
      const ventasPorProforma = new Map<number, { ventaId: number; saldo: number }>();

      ventas
        .filter(v => v.estado !== 'ANULADA' && v.proformaId && v.saldoPendiente > 0)
        .forEach(v => {
          ventasPorProforma.set(v.proformaId!, { ventaId: v.id, saldo: v.saldoPendiente });
        });

      const proformasPendientes: VentaPendiente[] = proformasEmitidas
        .map(p => {
          const ventaExistente = ventasPorProforma.get(p.id);
          const saldo = ventaExistente ? ventaExistente.saldo : p.total;

          return {
            ventaId:       ventaExistente ? ventaExistente.ventaId : p.id,
            proformaId:    p.id,
            ventaNumero:   p.numero,
            clienteId:     p.clienteId,
            clienteNombre: clientes.find(c => c.id === p.clienteId)?.nombre ?? `Cliente #${p.clienteId}`,
            proformaNro:   p.numero,
            saldo,
            moneda:        p.moneda,
          };
        })
        .filter(v => v.saldo > 0);

      this.todasVentas.set(proformasPendientes);

      const idsConProforma = new Set(proformasPendientes.map(v => v.clienteId));
      const clientesFiltrados = clientes.filter(c => idsConProforma.has(c.id));
      this.clientes.set(
        clientesFiltrados.length > 0
          ? clientesFiltrados.map(c => ({ id: c.id, nombre: c.nombre, ruc: c.ruc ?? '' }))
          : clientes.map(c => ({ id: c.id, nombre: c.nombre, ruc: c.ruc ?? '' }))
      );
    });
  }

  onClienteChange() {
    this.proformaSelecId.set('');
    this.montoAbono.set('');
    this.errorModal.set('');
  }

  onProformaChange() {
    // autocompletar monto con el saldo total
    const v = this.ventaActual;
    if (v) this.montoAbono.set(String(v.saldo));
    this.errorModal.set('');
  }

  saveRecibo() {
    const ventaActual = this.ventaActual;
    const proformaId = ventaActual?.proformaId ?? Number(this.proformaSelecId());
    const ventaId = ventaActual && ventaActual.ventaId !== ventaActual.proformaId ? ventaActual.ventaId : null;
    const monto   = Number(this.montoAbono());

    if (!proformaId)          { this.errorModal.set('Selecciona una proforma emitida.'); return; }
    if (!monto || monto <= 0) { this.errorModal.set('Ingresa un monto válido.'); return; }

    const saldoMax = ventaActual?.saldo ?? 0;
    // Solo validar límite de saldo si el saldo es mayor que 0
    if (saldoMax > 0 && monto > saldoMax) {
      this.errorModal.set(`El monto no puede superar el saldo pendiente (${saldoMax.toFixed(2)}).`);
      return;
    }

    this.saving.set(true);
    this.errorModal.set('');

    const crearRecibo = (ventaDestinoId: number) => {
      this.api.createRecibo({
        ventaId: ventaDestinoId,
        monto,
        observacion: this.observacion() || undefined,
      }).subscribe({
        next: () => {
          this.ds.getRecibosHttp().pipe(
            catchError(() => of(this.ds.getRecibos()))
          ).subscribe(data => {
            this.recibos.set(data);
            this.saving.set(false);
            this.showNew.set(false);
            this.sound.play('success');
          });
        },
        error: (err) => {
          this.errorModal.set(err?.error?.message ?? err?.message ?? 'Error al guardar. Intenta de nuevo.');
          this.saving.set(false);
          this.sound.play('error');
        }
      });
    };

    if (ventaId) {
      crearRecibo(ventaId);
      return;
    }

    this.api.createVentaDesdeProforma(proformaId).subscribe({
      next: (ventaCreada) => crearRecibo(ventaCreada.id),
      error: (err) => {
        this.errorModal.set(err?.error?.message ?? err?.message ?? 'No se pudo convertir la proforma en venta.');
        this.saving.set(false);
        this.sound.play('error');
      }
    });
  }

  close() { this.showNew.set(false); }
}
