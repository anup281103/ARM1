// Angular Import
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Footer } from 'src/app/theme/layout/admin/footer/footer';
import { NavBarComponent } from 'src/app/theme/layout/admin/nav-bar/nav-bar.component';
import { BreadcrumbComponent } from 'src/app/theme/shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-guest',
  imports: [RouterModule, CommonModule, NavBarComponent, BreadcrumbComponent, Footer],
  templateUrl: './guest.component.html',
  styleUrls: ['./guest.component.scss']
})
export class GuestComponent {

  // public props
  navCollapsed!: boolean;
  navCollapsedMob: boolean;
  windowWidth: number;

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  // public method
  navMobClick() {
    if (this.windowWidth < 992) {
      if (this.navCollapsedMob && !document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
        this.navCollapsedMob = !this.navCollapsedMob;
        setTimeout(() => {
          this.navCollapsedMob = !this.navCollapsedMob;
        }, 100);
      } else {
        this.navCollapsedMob = !this.navCollapsedMob;
      }
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    if (document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
      document.querySelector('app-navigation.pcoded-navbar')?.classList.remove('mob-open');
    }
  }

}
