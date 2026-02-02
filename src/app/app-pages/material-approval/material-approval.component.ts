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
  materialRequests: MaterialRequestData[] = [];
  loading = false;
  user: any = null;
  userDistrict: string = '';

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
    this.loadMaterialRequests();
  }

  loadUserSession() {
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        const userEmail = res.message;
        if (userEmail) {
          this.authService.getUserDetails(userEmail).subscribe({
            next: (userRes) => {
              this.user = userRes.data;
              // Extract collector's district for filtering
              this.userDistrict = this.user?.custom_district || this.user?.district || '';
              console.log('Collector District:', this.userDistrict);
              // Reload requests after getting user district
              if (this.userDistrict) {
                this.loadMaterialRequests();
              }
            },
            error: (err) => console.error('Failed to fetch user details', err)
          });
        }
      },
      error: (err) => console.error('Failed to get logged in user', err)
    });
  }

  loadMaterialRequests() {
    this.loading = true;
    
    this.materialService.getMaterialRequests().subscribe({
      next: (res: any) => {
        let allRequests = res.data || [];
        
        // Filter by collector's district
        if (this.userDistrict) {
          this.materialRequests = allRequests.filter(
            (req: MaterialRequestData) => req.custom_district === this.userDistrict
          );
          console.log(`Filtered requests for district "${this.userDistrict}":`, this.materialRequests.length);
        } else {
          // If no district assigned, show all (or you can show none)
          this.materialRequests = allRequests;
          console.warn('No district assigned to collector, showing all requests');
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load material requests', err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Could not load material requests. Please try again.'
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
        // TODO: Replace with actual approve endpoint
        this.materialService.approveMaterialRequest(request.name, {}).subscribe({
          next: (response) => {
            console.log('Material request approved:', response);
            
            // Immediately update the local status for instant feedback
            const reqIndex = this.materialRequests.findIndex(r => r.name === request.name);
            if (reqIndex !== -1) {
              this.materialRequests[reqIndex].status = 'Submitted';
            }
            
            Swal.fire({
              icon: 'success',
              title: 'Approved!',
              text: `Material Request ${request.name} has been approved successfully.`,
              confirmButtonColor: '#0d6efd'
            });
            
            // Refresh the list after a short delay to ensure backend is updated
            setTimeout(() => {
              this.loadMaterialRequests();
            }, 1000);
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
        // TODO: Replace with actual reject endpoint
        this.materialService.rejectMaterialRequest(request.name, reason).subscribe({
          next: (response) => {
            console.log('Material request rejected:', response);
            
            // Immediately update the local status for instant feedback
            const reqIndex = this.materialRequests.findIndex(r => r.name === request.name);
            if (reqIndex !== -1) {
              this.materialRequests[reqIndex].status = 'Cancelled';
            }
            
            Swal.fire({
              icon: 'success',
              title: 'Rejected!',
              text: `Material Request ${request.name} has been rejected.`,
              confirmButtonColor: '#0d6efd'
            });
            
            // Refresh the list after a short delay to ensure backend is updated
            setTimeout(() => {
              this.loadMaterialRequests();
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
      'Draft': 'bg-secondary',
      'Submitted': 'bg-primary',
      'Pending': 'bg-warning',
      'Approved': 'bg-success',
      'Rejected': 'bg-danger',
      'Stopped': 'bg-dark'
    };
    return statusMap[status] || 'bg-secondary';
  }
}
