import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { SoundService } from '../../../core/services/sound.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  sound = inject(SoundService);

  showUserMenu = false;

  toggleTheme() {
    this.theme.toggle();
    this.sound.play('click');
  }

  toggleSound() {
    this.sound.toggle();
  }

  logout() {
    this.sound.play('click');
    this.auth.logout();
  }
}
