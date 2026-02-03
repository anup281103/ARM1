import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ChatUserListComponent } from './chat-user-list/chat-user-list.component';
import { ChatMsgComponent } from './chat-msg/chat-msg.component';
import { UserService } from 'src/app/services/user-service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule, ChatUserListComponent, ChatMsgComponent, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig],
  animations: [
    trigger('slideInOutLeft', [
      transition(':enter', [style({ transform: 'translateX(100%)' }), animate('300ms ease-in', style({ transform: 'translateX(0%)' }))]),
      transition(':leave', [animate('300ms ease-in', style({ transform: 'translateX(100%)' }))])
    ]),
    trigger('slideInOutRight', [
      transition(':enter', [style({ transform: 'translateX(-100%)' }), animate('300ms ease-in', style({ transform: 'translateX(0%)' }))]),
      transition(':leave', [animate('300ms ease-in', style({ transform: 'translateX(-100%)' }))])
    ])
  ]
})
export class NavRightComponent implements OnInit {
  visibleUserList = false;
  chatMessage = false;
  friendId!: number;
  user: any = null;

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadUserSession();
    
    // Subscribe to UserService for real-time updates
    this.userService.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        console.log('NavRight: User updated:', user);
      }
    });
  }

  loadUserSession() {
    // Step 1: Get the logged-in user's email/ID
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        console.log('NavRight: Step 1 - get_logged_user response:', res);
        const userEmail = res.message; // valid for Frappe auth

        if (userEmail) {
          // Step 2: Fetch full details using the email
          this.authService.getUserDetails(userEmail).subscribe({
            next: (userRes) => {
              console.log('NavRight: Step 2 - User details fetched:', userRes);
              // Frappe API returns object in 'data'
              this.user = userRes.data; 
              this.userService.setUser(this.user);
              console.log('NavRight: User set:', this.user);
              
              // Also fetch roles if not already loaded
              this.authService.getUserRoles().subscribe({
                next: (rolesRes) => {
                  const roles = rolesRes.message || [];
                  this.userService.setRoles(roles);
                  console.log('NavRight: Roles set:', roles);
                },
                error: (err) => console.error('NavRight: Failed to load roles', err)
              });
            },
            error: (detailErr) => {
              console.error('NavRight: Failed to fetch user details', detailErr);
              // Fallback to displaying just the email if details fail
              this.user = { 
                full_name: 'Guest User', 
                email: userEmail,
                name: userEmail
              };
            }
          });
        } else {
          console.warn('NavRight: No user email found in get_logged_user response');
        }
      },
      error: (err) => {
        console.error('NavRight: Failed to identify logged in user', err);
        // Optional: Redirect to login or show warning?
      }
    });
  }

  onChatToggle(friendID: any) {
    this.friendId = friendID;
    this.chatMessage = !this.chatMessage;
  }

  logout() {
    this.userService.logout().subscribe({
      next: () => {
        this.userService.clearUser();
        this.router.navigate(['/login']); // adjust route if needed
      },
      error: () => {
        // even if API fails, force logout on UI
        this.userService.clearUser();
        this.router.navigate(['/login']);
      }
    });
  }
}
