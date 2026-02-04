import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MaterialService } from 'src/app/services/material.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user-service';
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
  workflow_state?: string;
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

  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalRecords = 0;

  // Sorting
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'desc';

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
  }

  loadUserSession() {
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        const userEmail = res.message;
        if (userEmail) {
          this.authService.getUserDetails(userEmail).subscribe({
            next: (userRes) => {
              this.user = userRes.data;
              // Load requests AFTER user is loaded
              this.loadMyMaterialRequests();
            },
            error: (err) => {
              console.error('Failed to fetch user details', err);
              // Still try to load requests using userService
              this.loadMyMaterialRequests();
            }
          });
        } else {
          // No user email, try loading with userService
          this.loadMyMaterialRequests();
        }
      },
      error: (err) => {
        console.error('Failed to get logged in user', err);
        // Still try to load requests
        this.loadMyMaterialRequests();
      }
    });
  }

  loadMyMaterialRequests() {
    this.loading = true;
    const currentUser = this.user?.email || this.userService.getUser()?.email;
    
    if (!currentUser) {
      this.materialRequests = [];
      this.loading = false;
      return;
    }

    // Calculate pagination offset
    const limitStart = (this.currentPage - 1) * this.pageSize;

    // Build order_by parameter
    const orderBy = `${this.sortColumn} ${this.sortDirection}`;

    // Build filters for current user
    const filters = [['owner', '=', currentUser]];
    
    // Step 1: Get total count for pagination
    this.materialService.getMaterialRequestsCount(filters).subscribe({
      next: (countRes: any) => {
        this.totalRecords = countRes.message || 0;
        
        // Step 2: Fetch paginated data
        this.materialService.getMaterialRequests(filters, limitStart, this.pageSize, orderBy).subscribe({
          next: (res: any) => {
            this.materialRequests = res.data || [];
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
      },
      error: (err) => {
        console.error('Failed to get count', err);
        // Fallback: try to load data anyway without count
        this.materialService.getMaterialRequests(filters, limitStart, this.pageSize, orderBy).subscribe({
          next: (res: any) => {
             this.materialRequests = res.data || [];
             this.loading = false;
          },
          error: (e) => {
             this.loading = false;
          }
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
      // Workflow States
      'Draft': 'bg-secondary',
      'Pending': 'bg-warning text-dark',
      'Pending Approval': 'bg-warning text-dark',
      'Approved': 'bg-success',
      'Rejected': 'bg-danger',
      'Cancelled': 'bg-danger',
      // Document Status
      'Submitted': 'bg-primary',
      'Stopped': 'bg-dark'
    };
    return statusMap[status] || 'bg-secondary';
  }
  
  /**
   * Get the display status - prefer workflow_state over status
   */
  getDisplayStatus(request: MaterialRequestData): string {
    return request.workflow_state || request.status || 'Draft';
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
          <p><strong>Status:</strong> ${this.getDisplayStatus(request)}</p>
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
    this.currentPage = 1;
    this.loadMyMaterialRequests();
  }
  
  /**
   * Navigate to view mode for a material request
   */
  viewRequestInForm(request: MaterialRequestData) {
    this.router.navigate(['/materialRequest', request.name]);
  }

  /**
   * Computed property for total pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  /**
   * Change sorting column and direction
   */
  changeSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Reload data with new sorting
    this.loadMyMaterialRequests();
  }

  /**
   * Change current page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.loadMyMaterialRequests();
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadMyMaterialRequests();
  }
}
