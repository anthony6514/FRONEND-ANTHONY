import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { SoundService } from '../../core/services/sound.service';
import { Proforma } from '../../core/models';

@Component({
  selector: 'app-proformas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proformas.component.html',
  styleUrl: './proformas.component.scss',
})
export class ProformasComponent implements OnInit {
  ds    = inject(DataService);
  sound = inject(SoundService);

  proformas: Proforma[] = [];
  loading   = signal(true);
  search    = signal('');
  showNew   = signal(false);

  ngOnInit() {
    this.ds.getProformasHttp().subscribe(data => {
      this.proformas = data;
      this.loading.set(false);
    });
  }

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q ? this.proformas.filter(p =>
      p.numero.toLowerCase().includes(q) ||
      p.clienteNombre.toLowerCase().includes(q) ||
      p.vendedor.toLowerCase().includes(q)
    ) : this.proformas;
  });

  get totalProformas() { return this.proformas.length; }
  get delMes()         { return this.proformas.filter(p => p.fecha.startsWith('2026-09')).length; }
  get aprobadas()      { return this.proformas.filter(p => p.estado === 'EMITIDA').length; }
  get montoMes()       { return this.proformas.filter(p => p.fecha.startsWith('2026-09')).reduce((s,p) => s + p.total, 0); }

  estadoBadge(e: string) {
    return e === 'EMITIDA' ? 'badge--success' : 'badge--danger';
  }

  openNew() { this.showNew.set(true); this.sound.play('click'); }
  close()   { this.showNew.set(false); }
}
