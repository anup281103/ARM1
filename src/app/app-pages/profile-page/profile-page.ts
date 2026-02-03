import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { UserService } from 'src/app/services/user-service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss'
})
export class ProfilePage implements OnInit {
  
  // User Session
  user: any = null;
  userRoles: string[] = [];
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUserSession();
    
    // Subscribe to UserService for user and roles
    this.userService.user$.subscribe(user => {
      if (user) {
        this.user = user;
        console.log('ProfilePage: User from UserService:', user);
      }
    });

    this.userService.roles$.subscribe(roles => {
      this.userRoles = roles;
      console.log('ProfilePage: Roles from UserService:', roles);
    });
  }

  loadUserSession() {
    this.loading = true;
    
    // Try to get user from UserService first
    const existingUser = this.userService.getUser();
    if (existingUser) {
      this.user = existingUser;
      this.userRoles = this.userService.getRoles();
      this.loading = false;
      console.log('ProfilePage: Using cached user and roles');
      return;
    }

    // If not in UserService, fetch from API
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        console.log('ProfilePage: get_logged_user response:', res);
        const userId = res.message;
        if (userId) {
          this.authService.getUserDetails(userId).subscribe({
            next: (userRes) => {
              this.user = userRes.data;
              this.userService.setUser(this.user);
              this.loading = false;
              console.log('ProfilePage: Loaded user from API:', this.user);
              
              // Also fetch roles if not already loaded
              if (this.userRoles.length === 0) {
                this.authService.getUserRoles().subscribe({
                  next: (rolesRes) => {
                    const roles = rolesRes.message || [];
                    this.userService.setRoles(roles);
                    this.userRoles = roles;
                  },
                  error: (err) => console.error('Failed to load roles', err)
                });
              }
            },
            error: (err) => {
              console.error('ProfilePage: Failed to load user details', err);
              this.loading = false;
              // Fallback
              if (!this.user) {
                this.user = { name: userId, full_name: userId };
              }
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('ProfilePage: Failed to get logged in user', err);
        this.loading = false;
      }
    });
  }
}
