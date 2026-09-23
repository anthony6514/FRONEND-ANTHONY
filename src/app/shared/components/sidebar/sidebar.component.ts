import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SoundService } from '../../../core/services/sound.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  adminOnly?: boolean;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input()  collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();

  auth  = inject(AuthService);
  sound = inject(SoundService);

  navItems: NavItem[] = [
    { icon: 'dashboard',        label: 'Inicio',     route: '/dashboard'   },
    { icon: 'inventory_2',      label: 'Stock',      route: '/inventario'  },
    { icon: 'description',      label: 'Proformas',      route: '/proformas'      },
    { icon: 'swap_vert',        label: 'Movimientos',    route: '/movimientos'    },
    { icon: 'people',           label: 'Clientes',       route: '/clientes'       },
    { icon: 'receipt_long',     label: 'Recibos',        route: '/recibos'        },
    { icon: 'settings',         label: 'Configuración',  route: '/configuracion', adminOnly: true },
  ];

  get visibleItems() {
    return this.auth.isAdmin()
      ? this.navItems
      : this.navItems.filter(i => !i.adminOnly);
  }

  toggle() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
    this.sound.play('click');
  }

  onNav() { this.sound.play('click'); }
}
