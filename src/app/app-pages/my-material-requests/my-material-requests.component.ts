import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MaterialService } from 'src/app/services/material.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user-service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface MaterialRequestItem {
  item_code: string;
  qty: number;
  warehouse: string;
  description?: string;
}

interface MaterialRequestData {
  name: string;
  transaction_date: string;
  material_request_type: string;
  schedule_date: string;
  company: string;
  owner: string;
  status: string;
  items: MaterialRequestItem[];
  custom_district?: string;
}

@Component({
  selector: 'app-my-material-requests',
  imports: [CommonModule, FormsModule, RouterLink],
  standalone: true,
  templateUrl: './my-material-requests.component.html',
  styleUrl: './my-material-requests.component.scss'
})
export class MyMaterialRequestsComponent implements OnInit {
  materialRequests: MaterialRequestData[] = [];
  loading = false;
  user: any = null;

  constructor(
    private materialService: MaterialService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user has Dealer role
    if (!this.userService.isDealer()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to access this page. Only Dealers can view their material requests.',
        confirmButtonText: 'Go to Dashboard'
      }).then(() => {
        this.router.navigate(['/analytics']);
      });
      return;
    }

    this.loadUserSession();
    this.loadMyMaterialRequests();
  }

  loadUserSession() {
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        const userEmail = res.message;
        if (userEmail) {
          this.authService.getUserDetails(userEmail).subscribe({
            next: (userRes) => {
              this.user = userRes.data;
            },
            error: (err) => console.error('Failed to fetch user details', err)
          });
        }
      },
      error: (err) => console.error('Failed to get logged in user', err)
    });
  }

  loadMyMaterialRequests() {
    this.loading = true;
    const currentUser = this.user?.email || this.userService.getUser()?.email;
    
    // Fetch material requests created by the current user
    this.materialService.getMaterialRequests().subscribe({
      next: (res: any) => {
        // Filter requests by current user (owner)
        if (currentUser) {
          this.materialRequests = (res.data || []).filter(
            (req: MaterialRequestData) => req.owner === currentUser
          );
        } else {
          this.materialRequests = res.data || [];
        }
        this.loading = false;
        console.log('My material requests loaded:', this.materialRequests);
      },
      error: (err) => {
        console.error('Failed to load material requests', err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Could not load your material requests. Please try again.'
        });
      }
    });
  }

  getItemsSummary(items: MaterialRequestItem[]): string {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return `${items[0].item_code} (${items[0].qty})`;
    return `${items.length} items`;
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Draft': 'bg-secondary',
      'Submitted': 'bg-primary',
      'Pending': 'bg-warning',
      'Approved': 'bg-success',
      'Rejected': 'bg-danger',
      'Stopped': 'bg-dark'
    };
    return statusMap[status] || 'bg-secondary';
  }

  viewRequestDetails(request: MaterialRequestData) {
    Swal.fire({
      title: `Request: ${request.name}`,
      html: `
        <div class="text-start">
          <p><strong>Date:</strong> ${new Date(request.transaction_date).toLocaleDateString()}</p>
          <p><strong>Type:</strong> ${request.material_request_type}</p>
          <p><strong>Company:</strong> ${request.company}</p>
          <p><strong>District:</strong> ${request.custom_district || 'N/A'}</p>
          <p><strong>Status:</strong> ${request.status}</p>
          <hr>
          <h6>Items:</h6>
          <ul class="list-unstyled">
            ${request.items.map(item => `
              <li>• ${item.item_code} - Qty: ${item.qty} - Warehouse: ${item.warehouse}</li>
            `).join('')}
          </ul>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Close'
    });
  }

  refreshList() {
    this.loadMyMaterialRequests();
  }
}
