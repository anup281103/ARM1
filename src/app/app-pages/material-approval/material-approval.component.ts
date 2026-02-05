import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialService } from 'src/app/services/material.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user-service';
import { Router } from '@angular/router';
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
  selector: 'app-material-approval',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './material-approval.component.html',
  styleUrl: './material-approval.component.scss'
})
export class MaterialApprovalComponent implements OnInit {
  // Signals
  user = signal<any>(null);
  userDistrict = signal<string>('');
  
  // Pagination
  pageSize = signal(10);
  currentPage = signal(1);
  
  // Sorting
  sortColumn = signal('name');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Computed Filters
  private filters = computed(() => {
    const dist = this.userDistrict();
    // If no district, returning [] means "load all requests" which matches previous logic
    // But previous logic warned if no district. 
    if (dist) {
      return [['custom_district', '=', dist]];
    }
    return []; 
  });

  // Queries
  countQuery = injectQuery(() => ({
    queryKey: ['material-approval-count', this.filters()],
    queryFn: async () => {
      const f = this.filters();
      return lastValueFrom(this.materialService.getMaterialRequestsCount(f));
    }
  }));

  dataQuery = injectQuery(() => ({
    queryKey: ['material-approval', this.filters(), this.currentPage(), this.pageSize(), this.sortColumn(), this.sortDirection()],
    queryFn: async () => {
      const f = this.filters();
      return lastValueFrom(
        this.materialService.getMaterialRequests(
          f, 
          (this.currentPage() - 1) * this.pageSize(), 
          this.pageSize(), 
          `${this.sortColumn()} ${this.sortDirection()}`
        )
      );
    },
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
    // Check if user has Collector role
    if (!this.userService.isCollector()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to access this page. Only users with Collector Office role can approve material requests.',
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
              this.user.set(userRes.data);
              // Extract collector's district for filtering
              const dist = this.user()?.custom_district || this.user()?.district || '';
              this.userDistrict.set(dist);
              console.log('Collector District:', dist);
            },
            error: (err) => console.error('Failed to fetch user details', err)
          });
        }
      },
      error: (err) => console.error('Failed to get logged in user', err)
    });
  }

  approveMaterialRequest(request: MaterialRequestData) {
    Swal.fire({
      title: 'Approve Request?',
      html: `Are you sure you want to approve Material Request <b>${request.name}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.materialService.approveMaterialRequest(request.name, {}).subscribe({
          next: (response) => {
            console.log('Material request approved:', response);
            
            Swal.fire({
              icon: 'success',
              title: 'Approved!',
              text: `Material Request ${request.name} has been approved successfully.`,
              confirmButtonColor: '#0d6efd'
            }).then(() => {
                this.dataQuery.refetch();
            });
          },
          error: (err) => {
            console.error('Approval failed:', err);
            Swal.fire({
              icon: 'error',
              title: 'Approval Failed',
              text: err?.error?.message || 'Could not approve the request.'
            });
          }
        });
      }
    });
  }

  rejectMaterialRequest(request: MaterialRequestData) {
    Swal.fire({
      title: 'Reject Request?',
      html: `Please provide a reason for rejecting Material Request <b>${request.name}</b>:`,
      input: 'textarea',
      inputPlaceholder: 'Enter rejection reason...',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Please provide a reason for rejection!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const reason = result.value;
        this.materialService.rejectMaterialRequest(request.name, reason).subscribe({
          next: (response) => {
            console.log('Material request rejected:', response);
            
            Swal.fire({
              icon: 'success',
              title: 'Rejected!',
              text: `Material Request ${request.name} has been rejected.`,
              confirmButtonColor: '#0d6efd'
            });
            
            // Refresh the list
            this.dataQuery.refetch();
          },
          error: (err) => {
            console.error('Rejection failed:', err);
            Swal.fire({
              icon: 'error',
              title: 'Rejection Failed',
              text: err?.error?.message || 'Could not reject the request.'
            });
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
      'Pending': 'bg-warning text-black',
      'Pending Approval': 'bg-warning text-black',
      'Approved': 'bg-success',
      'Rejected': 'bg-danger',
      'Cancelled': 'bg-danger',
      // Document Status
      'Submitted': 'bg-info text-dark',
      'Stopped': 'bg-dark',
      'Ordered': 'bg-info', 
      'Partially Ordered': 'bg-warning'
    };
    return statusMap[status] || 'bg-gray';
  }
  
  /**
   * Get the display status - prefer workflow_state over status
   */
  getDisplayStatus(request: MaterialRequestData): string {
    const status = request.status;
    if (['Draft', 'Pending'].includes(status)) {
      return request.workflow_state || status;
    }
    return status;
  }
  
  /**
   * Navigate to view mode for a material request
   */
  viewRequestInForm(request: MaterialRequestData) {
    this.router.navigate(['/materialRequest', request.name]);
  }

  refreshList() {
    this.currentPage.set(1);
    this.dataQuery.refetch();
    this.countQuery.refetch();
  }
  
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


}
