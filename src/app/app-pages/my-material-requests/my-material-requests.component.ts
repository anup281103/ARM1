import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MaterialService } from 'src/app/services/material.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user-service';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
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
  // Signals for state
  user = signal<any>(null);
  
  // Pagination Signals
  pageSize = signal(10);
  currentPage = signal(1);
  
  // Sorting Signals
  sortColumn = signal('name');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Computed Filters
  private filters = computed(() => {
    const u = this.user();
    if (!u) return null;
    return [['owner', '=', u.email || u.name]];
  });

  // Queries
  countQuery = injectQuery(() => ({
    queryKey: ['material-requests-count', this.filters()],
    queryFn: async () => {
      const f = this.filters();
      if (!f) return { message: 0 };
      return lastValueFrom(this.materialService.getMaterialRequestsCount(f));
    },
    enabled: !!this.filters()
  }));

  dataQuery = injectQuery(() => ({
    queryKey: ['material-requests', this.filters(), this.currentPage(), this.pageSize(), this.sortColumn(), this.sortDirection()],
    queryFn: async () => {
      const f = this.filters();
      if (!f) return { data: [] };
      return lastValueFrom(
        this.materialService.getMaterialRequests(
          f, 
          (this.currentPage() - 1) * this.pageSize(), // limitStart
          this.pageSize(),                            // limitPageLength
          `${this.sortColumn()} ${this.sortDirection()}` // orderBy
        )
      );
    },
    enabled: !!this.filters(),
    placeholderData: keepPreviousData
  }));

  // Derived State
  totalRecords = computed(() => this.countQuery.data()?.message || 0);
  materialRequests = computed(() => this.dataQuery.data()?.data || []);
  loading = computed(() => this.dataQuery.isPending());

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
              // Update Signal
              this.user.set(userRes.data);
            },
            error: (err) => {
              console.error('Failed to fetch user details', err);
              // Fallback
              const currentUser = this.userService.getUser();
              if (currentUser) this.user.set(currentUser);
            }
          });
        } else {
          const currentUser = this.userService.getUser();
           if (currentUser) this.user.set(currentUser);
        }
      },
      error: (err) => {
        console.error('Failed to get logged in user', err);
        const currentUser = this.userService.getUser();
        if (currentUser) this.user.set(currentUser);
      }
    });
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
    this.currentPage.set(1);
    this.dataQuery.refetch();
    this.countQuery.refetch();
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
  /**
   * Computed property for total pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalRecords() / this.pageSize());
  }

  /**
   * Change sorting column and direction
   */
  changeSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  /**
   * Change current page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage.set(page);
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage.set(1);
  }
  /**
   * Get items summary string
   */
  getItemsSummary(items: MaterialRequestItem[]): string {
    if (!items || items.length === 0) return 'No Items';
    if (items.length === 1) return `${items[0].item_code} (${items[0].qty})`;
    return `${items[0].item_code} + ${items.length - 1} more`;
  }

  /**
   * Get display status considering workflow state
   */
  getDisplayStatus(request: MaterialRequestData): string {
    return request.workflow_state || request.status || 'Draft';
  }

  /**
   * Get badge class based on status
   */
  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Draft': 'bg-secondary',
      'Pending': 'bg-warning text-black',
      'Pending Approval': 'bg-warning text-black',
      'Approved': 'bg-success',
      'Rejected': 'bg-danger',
      'Cancelled': 'bg-danger',
      'Submitted': 'bg-info text-dark',
      'Stopped': 'bg-dark'
    };
    return statusMap[status] || 'bg-secondary';
  }
}
