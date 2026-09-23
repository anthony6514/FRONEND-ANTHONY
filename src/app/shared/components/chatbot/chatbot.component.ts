import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Msg { role: 'user' | 'bot'; text: string; }

const FAQ: { q: RegExp; a: string }[] = [
  { q: /proforma|cotiz/i,         a: 'Ve a Proformas → Nueva proforma. Completa los datos del cliente, agrega los productos, y usa PDF o Imprimir para generar el documento.' },
  { q: /entrada|compra|ingresar stock/i, a: 'Ve a Movimientos → Nueva entrada. Selecciona el producto y la cantidad. El costo se toma automáticamente del precio registrado en stock.' },
  { q: /salida|venta.*movim/i,    a: 'Ve a Movimientos → Nueva salida. Selecciona el producto, cantidad, e ingresa el precio de venta manualmente.' },
  { q: /ajuste|devolu/i,          a: 'Ve a Movimientos → Ajuste. Elige si es AJUSTE_ENTRADA (sumar) o AJUSTE_SALIDA (restar). Útil para devoluciones o correcciones de conteo.' },
  { q: /cliente|ruc/i,            a: 'Ve a Clientes → Nuevo cliente. Ingresa RUC, razón social, teléfono, ciudad y vendedor asignado.' },
  { q: /recibo|abono|cobro/i,     a: 'Ve a Recibos → Nuevo recibo. Vincula a una proforma, ingresa el monto abonado y el método de pago (transferencia, efectivo, cheque, depósito).' },
  { q: /stock.bajo|mínimo|alerta/i, a: 'En el Dashboard verás "Productos con stock bajo". En Configuración puedes activar la alerta de stock mínimo. El mínimo se define por producto.' },
  { q: /excel/i,                  a: 'En Inventario, Clientes y Recibos hay un botón "Exportar Excel" que descarga los datos visibles en ese momento.' },
  { q: /pdf|imprimir/i,           a: 'En Nueva Proforma los botones PDF e Imprimir generan el documento con la vista previa. En Dashboard también puedes exportar los KPIs en PDF.' },
  { q: /usuario|rol|admin|vendedor/i, a: 'Hay dos roles: ADMIN (acceso total) y VENDEDOR (sin Configuración ni Usuarios). Se asignan en el módulo Usuarios.' },
  { q: /login|contrase|acceso/i,  a: 'Credenciales de prueba: admin@inventio.pe / 123456 (ADMIN) o vendedor1@inventio.pe / 123456 (VENDEDOR).' },
  { q: /dashboard|inicio|kpi/i,   a: 'El Dashboard muestra litros vendidos, meta REPSOL, ventas del mes, saldo pendiente, stock bajo y comparativo de vendedores. Puedes exportarlo en PDF.' },
  { q: /configuraci/i,            a: 'En Configuración (solo ADMIN) puedes editar los datos de la empresa, tipo de cambio, IGV, validez de proformas y numeración de documentos.' },
  { q: /inventario|stock/i,       a: 'En Stock ves todos los productos con su precio, stock actual y valorización. Los productos en amarillo tienen stock bajo, en rojo sin stock.' },
  { q: /tema|oscuro|claro|color/i,a: 'Usa el ícono de sol/luna en el topbar para cambiar entre tema claro y oscuro.' },
  { q: /sonido|audio/i,           a: 'El ícono de altavoz en el topbar activa o silencia los sonidos de la interfaz.' },
];

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="cb-wrap">
  <div class="cb-bubble" *ngIf="open()" (click)="$event.stopPropagation()">
    <div class="cb-header">
      <span class="cb-title">
        <span class="material-icons-round">support_agent</span> Asistente INVENTIO
      </span>
      <button class="cb-close" (click)="open.set(false)">
        <span class="material-icons-round">close</span>
      </button>
    </div>
    <div class="cb-messages">
      <div *ngFor="let m of messages()" class="cb-msg" [class.cb-msg--user]="m.role==='user'" [class.cb-msg--bot]="m.role==='bot'">
        {{ m.text }}
      </div>
    </div>
    <div class="cb-input-row">
      <input [(ngModel)]="input" placeholder="¿Cómo registro una entrada?" (keydown.enter)="send()" class="cb-input" />
      <button class="cb-send" (click)="send()">
        <span class="material-icons-round">send</span>
      </button>
    </div>
  </div>
  <button class="cb-fab" (click)="open.set(!open())" title="Asistente INVENTIO">
    <span class="material-icons-round">{{ open() ? 'close' : 'support_agent' }}</span>
    <span class="cb-badge" *ngIf="!open() && unread() > 0">{{ unread() }}</span>
  </button>
</div>
  `,
  styles: [`
:host { position: fixed; bottom: 24px; right: 24px; z-index: 9999; }
.cb-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.cb-fab {
  width: 52px; height: 52px; border-radius: 50%;
  background: #FF5A00; border: none; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(255,90,0,.45); transition: transform .2s;
  position: relative;
  .material-icons-round { font-size: 1.4rem; }
  &:hover { transform: scale(1.08); }
}
.cb-badge {
  position: absolute; top: -2px; right: -2px;
  background: #dc2626; color: #fff; border-radius: 50%;
  width: 18px; height: 18px; font-size: .65rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.cb-bubble {
  width: 320px; max-height: 460px;
  background: var(--surface, #1f2428); border: 1px solid rgba(255,255,255,.1);
  border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.4);
  display: flex; flex-direction: column; overflow: hidden;
  animation: cbIn .18s ease;
}
@keyframes cbIn { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:none; } }
.cb-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; background: #FF5A00;
  .cb-title { color:#fff; font-size:.88rem; font-weight:700; display:flex; align-items:center; gap:6px; }
  .material-icons-round { font-size:1rem; }
}
.cb-close { background:none; border:none; color:rgba(255,255,255,.8); cursor:pointer; display:flex; align-items:center; padding:2px; &:hover{color:#fff;} .material-icons-round{font-size:1rem;} }
.cb-messages { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; max-height:320px; scrollbar-width:thin; }
.cb-msg { max-width:90%; padding:8px 12px; border-radius:12px; font-size:.8rem; line-height:1.4; word-break:break-word; }
.cb-msg--bot  { background:rgba(255,255,255,.07); color:rgba(255,255,255,.88); align-self:flex-start; border-bottom-left-radius:4px; }
.cb-msg--user { background:#FF5A00; color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
.cb-input-row { display:flex; gap:6px; padding:10px 12px; border-top:1px solid rgba(255,255,255,.08); }
.cb-input { flex:1; padding:7px 10px; border-radius:8px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06); color:#fff; font-size:.82rem; outline:none; &::placeholder{color:rgba(255,255,255,.3);} &:focus{border-color:#FF5A00;} }
.cb-send { background:#FF5A00; border:none; color:#fff; border-radius:8px; width:34px; cursor:pointer; display:flex; align-items:center; justify-content:center; .material-icons-round{font-size:.95rem;} &:hover{background:#e05000;} }
  `]
})
export class ChatbotComponent {
  open    = signal(false);
  unread  = signal(0);
  input   = '';
  messages = signal<Msg[]>([
    { role: 'bot', text: '¡Hola! Soy el asistente de INVENTIO. Puedo ayudarte con proformas, movimientos de stock, clientes, recibos, exportación y más. ¿En qué te ayudo?' }
  ]);

  send() {
    const q = this.input.trim();
    if (!q) return;
    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.input = '';
    const match = FAQ.find(f => f.q.test(q));
    const reply = match
      ? match.a
      : 'No encontré esa consulta. Puedes preguntarme sobre: proformas, entradas, salidas, ajustes, clientes, recibos, stock, reportes, usuarios, configuración o exportar datos.';
    setTimeout(() => {
      this.messages.update(m => [...m, { role: 'bot', text: reply }]);
      if (!this.open()) this.unread.update(n => n + 1);
    }, 280);
  }
}
