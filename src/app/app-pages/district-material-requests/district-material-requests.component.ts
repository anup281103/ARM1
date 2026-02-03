import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  workflow_state?: string;
  items: MaterialRequestItem[];
  custom_district?: string;
}

@Component({
  selector: 'app-district-material-requests',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './district-material-requests.component.html',
  styleUrl: './district-material-requests.component.scss'
})
export class DistrictMaterialRequestsComponent implements OnInit {
  materialRequests: MaterialRequestData[] = [];
  loading = false;
  user: any = null;
  userDistrict: string = '';

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
    // Check if user has Collector role
    if (!this.userService.isCollector()) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You do not have permission to access this page. Only users with Collector Office role can view district material requests.',
        confirmButtonText: 'Go to Dashboard'
      }).then(() => {
        this.router.navigate(['/analytics']);
      });
      return;
    }

    this.loadUserSession();
    this.loadDistrictMaterialRequests();
  }

  loadUserSession() {
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        const userEmail = res.message;
        if (userEmail) {
          this.authService.getUserDetails(userEmail).subscribe({
            next: (userRes) => {
              this.user = userRes.data;
              // Extract user's district if available
              this.userDistrict = this.user?.custom_district || this.user?.district || '';
              console.log('User district:', this.userDistrict);
              // Reload requests after getting user district
              if (this.userDistrict) {
                this.loadDistrictMaterialRequests();
              }
            },
            error: (err) => console.error('Failed to fetch user details', err)
          });
        }
      },
      error: (err) => console.error('Failed to get logged in user', err)
    });
  }

  loadDistrictMaterialRequests() {
    this.loading = true;
    
    // Fetch all material requests
    this.materialService.getMaterialRequests().subscribe({
      next: (res: any) => {
        let allRequests = res.data || [];
        
        // Filter by district if user has a district assigned
        if (this.userDistrict) {
          this.materialRequests = allRequests.filter(
            (req: MaterialRequestData) => req.custom_district === this.userDistrict
          );
        } else {
          // If no district, show all requests (or you can show none)
          this.materialRequests = allRequests;
        }
        
        // Apply sorting
        const sortedRequests = this.sortData(allRequests);
        
        // Calculate total
        this.totalRecords = sortedRequests.length;
        
        // Apply pagination
        const limitStart = (this.currentPage - 1) * this.pageSize;
        const start = limitStart;
        const end = start + this.pageSize;
        this.materialRequests = sortedRequests.slice(start, end);
        
        this.loading = false;
        console.log('District material requests loaded:', this.materialRequests);
      },
      error: (err) => {
        console.error('Failed to load material requests', err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Could not load district material requests. Please try again.'
        });
      }
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
            
            // Fetch the updated request to get the actual workflow_state
            this.materialService.getMaterialRequestById(request.name).subscribe({
              next: (updatedReq) => {
                console.log('Updated request data:', updatedReq);
                
                // Update the local list with the latest data
                const reqIndex = this.materialRequests.findIndex(r => r.name === request.name);
                if (reqIndex !== -1 && updatedReq.data) {
                  this.materialRequests[reqIndex].status = updatedReq.data.status;
                  this.materialRequests[reqIndex].workflow_state = updatedReq.data.workflow_state;
                  console.log('Updated workflow_state to:', updatedReq.data.workflow_state);
                }
                
                Swal.fire({
                  icon: 'success',
                  title: 'Approved!',
                  text: `Material Request ${request.name} has been approved successfully.`,
                  confirmButtonColor: '#0d6efd'
                });
              },
              error: (fetchErr) => {
                console.error('Failed to fetch updated request:', fetchErr);
                // Still show success but use optimistic update
                const reqIndex = this.materialRequests.findIndex(r => r.name === request.name);
                if (reqIndex !== -1) {
                  this.materialRequests[reqIndex].status = 'Submitted';
                  this.materialRequests[reqIndex].workflow_state = 'Approved';
                }
                
                Swal.fire({
                  icon: 'success',
                  title: 'Approved!',
                  text: `Material Request ${request.name} has been approved successfully.`,
                  confirmButtonColor: '#0d6efd'
                });
              }
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
            
            // Immediately update the local status for instant feedback
            const reqIndex = this.materialRequests.findIndex(r => r.name === request.name);
            if (reqIndex !== -1) {
              this.materialRequests[reqIndex].status = 'Cancelled';
              this.materialRequests[reqIndex].workflow_state = 'Rejected';
            }
            
            Swal.fire({
              icon: 'success',
              title: 'Rejected!',
              text: `Material Request ${request.name} has been rejected.`,
              confirmButtonColor: '#0d6efd'
            });
            
            // Refresh the list after a short delay
            setTimeout(() => {
              this.loadDistrictMaterialRequests();
            }, 1000);
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

  refreshList() {
    this.currentPage = 1;
    this.loadDistrictMaterialRequests();
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
    this.loadDistrictMaterialRequests();
  }

  /**
   * Change current page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.loadDistrictMaterialRequests();
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadDistrictMaterialRequests();
  }

  /**
   * Sort data based on current sort column and direction
   */
  private sortData(data: MaterialRequestData[]): MaterialRequestData[] {
    return [...data].sort((a: any, b: any) => {
      const valueA = a[this.sortColumn];
      const valueB = b[this.sortColumn];

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  /**
   * Navigate to view mode for a material request
   */
  viewRequestInForm(request: MaterialRequestData) {
    this.router.navigate(['/materialRequest', request.name]);
  }

}
