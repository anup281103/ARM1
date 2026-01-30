import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialService } from 'src/app/services/material.service';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-material-request',
  imports: [CommonModule, FormsModule],
  standalone: true, 
  templateUrl: './material-request.html',
  styleUrl: './material-request.scss'
})
export class MaterialRequest implements OnInit {

  // Form Model
  requestDate = new Date().toISOString().split('T')[0];
  requiredByDate = new Date().toISOString().split('T')[0];
  purpose = 'Purchase';
  
  // Item Line Model (handling 1 item for simplicity as per existing UI, can be array)
  itemCode = '';
  quantity = 1;
  warehouse = '';
  description = '';
  
  // Lists for dropdowns
  itemsList: any[] = [];
  warehouseList: any[] = [];
  companyList: any[] = [];
  districtList: any[] = [];
  company = '';
  district = '';

  // User Session
  user: any = null;
  serverTime: Date = new Date();

  constructor(private materialService: MaterialService, private authService: AuthService) {}

  ngOnInit() {
    this.loadMasterData();
    this.loadUserSession();
  }

  loadUserSession() {
    // Step 1: Get the logged-in user's email/ID
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        console.log('MaterialRequest: Step 1 - get_logged_user response:', res);
        const userEmail = res.message; // valid for Frappe auth

        if (userEmail) {
          // Step 2: Fetch full details using the email
          this.authService.getUserDetails(userEmail).subscribe({
            next: (userRes) => {
              console.log('MaterialRequest: Step 2 - User details fetched:', userRes);
              // Frappe API returns object in 'data'
              this.user = userRes.data; 
              this.serverTime = new Date();
            },
            error: (detailErr) => {
              console.error('MaterialRequest: Failed to fetch user details', detailErr);
              // Fallback to displaying just the email if details fail
              this.user = { 
                full_name: 'Guest Utils', 
                email: userEmail,
                name: userEmail
              };
            }
          });
        } else {
             console.warn('MaterialRequest: No user email found in get_logged_user response');
        }
      },
      error: (err) => {
        console.error('MaterialRequest: Failed to identify logged in user', err);
        // Optional: Redirect to login or show warning?
      }
    });
  }

  loadMasterData() {
    // Fetch Items
    this.materialService.getItems().subscribe({
      next: (res: any) => {
        this.itemsList = res.data || [];
      },
      error: (err) => console.error('Failed to load items', err)
    });

    // Fetch Warehouses
    this.materialService.getWarehouses().subscribe({
      next: (res: any) => {
        this.warehouseList = res.data || [];
        if (this.warehouseList.length > 0) {
           this.warehouse = this.warehouseList[0].name;
        }
      },
      error: (err) => console.error('Failed to load warehouses', err)
    });

    // Fetch Companies
    this.materialService.getCompanies().subscribe({
      next: (res: any) => {
        this.companyList = res.data || [];
        if (this.companyList.length > 0) {
          this.company = this.companyList[0].name;
        }
      },
      error: (err) => console.error('Failed to load companies', err)
    });

    // Fetch Districts
    this.materialService.getDistricts().subscribe({
      next: (res: any) => {
        this.districtList = res.data || [];
        if (this.districtList.length > 0) {
          this.district = this.districtList[0].name;
        }
      },
      error: (err) => console.error('Failed to load districts', err)
    });
  }
  
  submit() {
    if (!this.itemCode || !this.quantity || !this.requestDate) {
        Swal.fire({
            icon: 'warning',
            title: 'Missing Information',
            text: 'Please fill in all required fields (Item, Quantity, Date)'
        });
        return;
    }

    const payload = {
      transaction_date: this.requestDate,
      material_request_type: this.purpose,
      schedule_date: this.requiredByDate,
      company: this.company,
      custom_district: this.district,
      items: [
        {
          item_code: this.itemCode,
          qty: this.quantity,
          warehouse: this.warehouse,
          schedule_date: this.requiredByDate,
          description: this.description,
          uom: 'Nos' // Default or fetched from item
        }
      ]
    };

    console.log('Submitting Material Request:', payload);

    this.materialService.createMaterialRequest(payload).subscribe({
      next: (response) => {
        console.log('Material Request Created:', response);
        Swal.fire({
          html: `
            <div class="d-flex flex-column align-items-center">
              <div class="mb-2">
                <span class="text-success fs-1 animate-check">✔</span>
              </div>
              <h5 class="mb-1">Request Submitted</h5>
              <p class="text-muted fs-6 mb-0">
                Material Request submitted successfully! Ref: ${response.data.name}
              </p>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          confirmButtonColor: '#0d6efd',
          backdrop: true
        });
      },
      error: (err) => {
        console.error('Submission Failed:', err);
        let errorMsg = 'Could not submit request.';
        if (err.error && err.error._server_messages) {
             try {
                 const messages = JSON.parse(err.error._server_messages);
                 errorMsg = JSON.parse(messages[0]).message;
             } catch(e) {}
        }

        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: errorMsg
        });
      }
    });

  }

}