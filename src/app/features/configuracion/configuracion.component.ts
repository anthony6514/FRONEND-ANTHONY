import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Tab = 'general' | 'usuarios' | 'vendedores' | 'monedas' | 'metodos' | 'proformas';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent {
  activeTab = signal<Tab>('general');

  empresa = {
    razonSocial: 'BUTCOINT',
    ruc: '20587463219',
    nombreComercial: 'BUTCOINT',
    direccion: 'Lima, Perú',
    telefono: '+51 987 654 321',
    correo: 'ventas@butcoint.pe',
  };

  parametros = {
    monedaPrincipal: 'PEN - Soles',
    monedaSecundaria: 'USD - Dólares',
    tipoCambio: 3.78,
    igv: 18,
    validezProforma: '7 dias',
    stockMinAlerta: true,
  };

  numeracion = [
    { documento: 'Proforma', serie: 'PF-2026',   proximoNumero: '001250' },
    { documento: 'Entrada',  serie: 'ENT-2026',  proximoNumero: '000185' },
    { documento: 'Salida',   serie: 'SAL-2026',  proximoNumero: '000328' },
    { documento: 'Recibo',   serie: 'REC',        proximoNumero: '000430' },
  ];

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  guardar() {
    // guardar cambios — pendiente conexión con backend
    console.log('Configuración guardada', this.empresa, this.parametros);
  }
}
