// angular import
import { Component, OnInit, inject, output } from '@angular/core';
import { Location, LocationStrategy } from '@angular/common';
import { Router } from '@angular/router';

// project import
import { environment } from     'src/environments/environment.prod';
import { NavigationItem, NavigationItems } from '../navigation';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { UserService } from 'src/app/services/user-service';

@Component({
  selector: 'app-nav-content',
  imports: [SharedModule, NavGroupComponent],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private userService = inject(UserService);
  private router = inject(Router);

  // version
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;

  // public pops
  navigation: NavigationItem[];
  contentWidth: number;
  wrapperWidth!: number;
  scrollWidth: number;
  windowWidth: number;

  NavMobCollapse = output();

  // constructor
  constructor() {
    this.navigation = NavigationItems;
    this.windowWidth = window.innerWidth;
    this.scrollWidth = 0;
    this.contentWidth = 0;
  }

  // life cycle event
  ngOnInit() {
    if (this.windowWidth < 992) {
      setTimeout(() => {
        document.querySelector('.pcoded-navbar')?.classList.add('menupos-static');
        const navElement = document.querySelector('#nav-ps-gradient-able') as HTMLElement;
        if (navElement) {
          navElement.style.height = '100%';
        }
      }, 500);
    }

    // Subscribe to user authentication and roles
    this.userService.user$.subscribe(() => {
      this.updateNavigation();
    });

    this.userService.roles$.subscribe(() => {
      this.updateNavigation();
    });
  }

  updateNavigation() {
    const isAuthenticated = this.userService.getUser() !== null || localStorage.getItem('lstUserDetail') !== null;
    const userRoles = this.userService.getRoles();
    
    console.log('🔍 Navigation Update - User Roles:', userRoles);
    console.log('🔍 Navigation Update - Is Authenticated:', isAuthenticated);

    // Deep clone navigation items to avoid modifying the original
    this.navigation = JSON.parse(JSON.stringify(NavigationItems));

    // Filter navigation items based on roles
    this.navigation = this.navigation.map(group => {
      if (group.children) {
        const originalLength = group.children.length;
        group.children = group.children.filter(item => {
          // If item has roles defined, check if user has at least one of them
          if (item.roles && item.roles.length > 0) {
            const hasAccess = item.roles.some(role => userRoles.includes(role));
            console.log(`🔍 Nav Item: ${item.title} | Required Roles:`, item.roles, '| Has Access:', hasAccess);
            return hasAccess;
          }
          return true; // Show items without role restrictions
        });
        console.log(`🔍 Group: ${group.title} | Items: ${originalLength} -> ${group.children.length}`);
      }
      return group;
    });

    // Update Sign In/Log Out button
    const authGroup = this.navigation.find(g => g.id === 'Authentication');
    if (authGroup && authGroup.children) {
      const signInIndex = authGroup.children.findIndex(item => item.id === 'signin');
      
      if (signInIndex !== -1) {
        if (isAuthenticated) {
          // Change to Log Out
          authGroup.children[signInIndex] = {
            id: 'signout',
            title: 'Log Out',
            type: 'item',
            url: 'javascript:void(0)', // Prevent navigation
            icon: 'feather icon-log-out',
            breadcrumbs: false
          };
        } else {
          // Keep as Sign In (restore original)
          authGroup.children[signInIndex] = {
            id: 'signin',
            title: 'Sign in',
            type: 'item',
            url: '/login',
            icon: 'feather icon-log-in',
            target: true,
            breadcrumbs: false
          };
        }
      }
    }
  }

  // Handle logout when logout menu item is clicked
  handleNavItemClick(item: NavigationItem) {
    if (item.id === 'signout') {
      this.logout();
    }
  }

  logout() {
    this.userService.logout().subscribe({
      next: () => {
        this.userService.clearUser();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Force logout even if API fails
        this.userService.clearUser();
        this.router.navigate(['/login']);
      }
    });
  }

  fireLeave() {
    const sections = document.querySelectorAll('.pcoded-hasmenu');
    for (let i = 0; i < sections.length; i++) {
      sections[i].classList.remove('active');
      sections[i].classList.remove('pcoded-trigger');
    }

    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('pcoded-hasmenu')) {
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('pcoded-hasmenu')) {
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('pcoded-hasmenu')) {
        last_parent.classList.add('active');
      }
    }
  }

  navMob() {
    if (this.windowWidth < 992 && document.querySelector('app-navigation.pcoded-navbar')?.classList.contains('mob-open')) {
      this.NavMobCollapse.emit();
    }
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('pcoded-hasmenu')) {
        parent.classList.add('pcoded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('pcoded-hasmenu')) {
        up_parent.classList.add('pcoded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('pcoded-hasmenu')) {
        last_parent.classList.add('pcoded-trigger');
        last_parent.classList.add('active');
      }
    }
  }
}
