import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialService } from 'src/app/services/material.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user-service';
import { PurchaseOrderService } from 'src/app/services/purchase-order.service';
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
  supplierList: any[] = [];
  company = '';
  district = '';

  // User Session
  user: any = null;
  serverTime: Date = new Date();
  
  // Submission state
  submitting = false;
  
  // View mode properties
  viewMode = false;
  isReadOnly = false;
  requestId: string = '';
  requestData: any = null;
  
  // Workflow submission properties
  canSubmitToCollector = false;
  submittingWorkflow = false;
  
  // Purchase Order creation properties
  canCreatePurchaseOrder = false;
  creatingPurchaseOrder = false;

  // Edit properties
  canEdit = false;
  updating = false;

  // Collector properties
  canApproveOrReject = false;

  constructor(
    private materialService: MaterialService, 
    private authService: AuthService,
    private userService: UserService,
    private purchaseOrderService: PurchaseOrderService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check for route parameter to determine mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        // View mode
        this.requestId = params['id'];
        this.viewMode = true;
        // Default to read only, will be updated in loadMaterialRequest based on status/owner
        this.isReadOnly = true; 
        this.loadMaterialRequest(this.requestId);
      } else {
        // Create mode
        this.loadMasterData();
        this.loadUserSession();
      }
    });
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

    // Fetch Suppliers (for PO creation)
    this.materialService.getSuppliers().subscribe({
      next: (res: any) => {
        this.supplierList = res.data || [];
      },
      error: (err) => console.error('Failed to load suppliers', err)
    });
  }
  
  /**
   * Validate if all mandatory fields are filled
   */
  isFormValid(): boolean {
    return !!(this.itemCode && 
              this.quantity > 0 && 
              this.warehouse && 
              this.company && 
              this.district && 
              this.requestDate);
  }
  
  /**
   * Submit material request directly without preview
   */
  submit() {
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields (Item, Quantity, Warehouse, Company, District)'
      });
      return;
    }
    
    // Submit directly without preview
    this.confirmSubmission();
  }
  
  /**
   * Create the material request in Draft state (no auto-submit)
   */
  confirmSubmission() {
    this.submitting = true;
    
    const payload = {
      transaction_date: this.requestDate,
      material_request_type: this.purpose,
      schedule_date: this.requiredByDate,
      company: this.company,
      custom_district: this.district,
      docstatus: 0, // Create as Draft
      items: [
        {
          item_code: this.itemCode,
          qty: this.quantity,
          warehouse: this.warehouse,
          schedule_date: this.requiredByDate,
          description: this.description,
          uom: 'Nos'
        }
      ]
    };

    console.log('Creating Material Request:', payload);

    this.materialService.createMaterialRequest(payload).subscribe({
      next: (response) => {
        const requestId = response.data.name;
        console.log('Material Request Created:', requestId);
        
        // Fetch to get workflow state
        this.materialService.getMaterialRequestById(requestId).subscribe({
          next: (createdReq) => {
            this.submitting = false;
            const workflowState = createdReq.data?.workflow_state || 'Draft';
            const statusBadgeClass = this.getStatusBadgeClass(workflowState);
            
            Swal.fire({
              icon: 'success',
              title: 'Request Created!',
              html: `
                <div class="d-flex flex-column align-items-center">
                  <p class="text-muted fs-6 mb-0">
                    Material Request <strong>${requestId}</strong> created successfully.<br>
                    Status: <span class="badge ${statusBadgeClass}">${workflowState}</span><br><br>
                    <small class="text-muted">You can submit it to the collector for approval from your requests list.</small>
                  </p>
                </div>
              `,
              confirmButtonText: 'OK',
              confirmButtonColor: '#0d6efd'
            }).then(() => {
              this.router.navigate(['/my-material-requests']);
            });
          },
          error: (err) => {
            this.submitting = false;
            // Fallback success if fetch fails
            Swal.fire({
              icon: 'success',
              title: 'Request Created!',
              text: `Material Request ${requestId} created in Draft state.`,
              confirmButtonColor: '#0d6efd'
            }).then(() => {
              this.router.navigate(['/my-material-requests']);
            });
          }
        });
      },
      error: (err) => {
        console.error('Creation Failed:', err);
        this.submitting = false;
        
        let errorMsg = 'Could not create request.';
        if (err.error && err.error._server_messages) {
          try {
            const messages = JSON.parse(err.error._server_messages);
            errorMsg = JSON.parse(messages[0]).message;
          } catch (e) {}
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Creation Failed',
          text: errorMsg
        });
      }
    });
  }
  
  /**
   * Get status badge class based on workflow state
   */
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
   * Reset form to initial state
   */
  resetForm() {
    this.itemCode = '';
    this.quantity = 1;
    this.description = '';
    this.requestDate = new Date().toISOString().split('T')[0];
    this.requiredByDate = new Date().toISOString().split('T')[0];
  }
  
  /**
   * Load existing material request for viewing
   */
  loadMaterialRequest(requestId: string) {
    this.materialService.getMaterialRequestById(requestId).subscribe({
      next: (response) => {
        this.requestData = response.data;
        
        // Load master data first, then populate fields
        // This prevents "No items" issue
        this.loadMasterData();
        this.loadUserSession();
        
        // Populate form fields after a short delay to ensure master data is loaded
        setTimeout(() => {
          this.populateFormFields(this.requestData);
          // Check if user can submit this request to collector
          this.checkSubmissionEligibility();
          // Check if user can edit this request
          this.checkEditEligibility();
        }, 300);
      },
      error: (err) => {
        console.error('Failed to load material request:', err);
        Swal.fire({
          icon: 'error',
          title: 'Load Failed',
          text: 'Could not load the material request details.'
        }).then(() => {
          this.router.navigate(['/my-material-requests']);
        });
      }
    });
  }
  
  /**
   * Populate form fields with request data
   */
  populateFormFields(data: any) {
    this.requestDate = data.transaction_date;
    this.requiredByDate = data.schedule_date;
    this.purpose = data.material_request_type;
    this.company = data.company;
    this.district = data.custom_district;
    
    // Populate item details (first item)
    if (data.items && data.items.length > 0) {
      const firstItem = data.items[0];
      this.itemCode = firstItem.item_code;
      this.quantity = firstItem.qty;
      this.warehouse = firstItem.warehouse;
      this.description = firstItem.description || '';
    }
  }
  
  /**
   * Navigate back to list page
   */
  goBack() {
    if (this.userService.isCollector()) {
      this.router.navigate(['/materialApproval']);
    } else {
      this.router.navigate(['/my-material-requests']);
    }
  }
  
  /**
   * Check if current user can submit this request to collector
   */
  checkSubmissionEligibility() {
    if (!this.requestData || !this.user) {
      this.canSubmitToCollector = false;
      return;
    }
    
    const workflowState = this.requestData?.workflow_state || this.requestData?.status;
    const isDraft = workflowState === 'Draft';
    const isOwner = this.requestData?.owner === this.user?.email || this.requestData?.owner === this.user?.name;
    
    // Show button only if Draft AND user is owner
    this.canSubmitToCollector = isDraft && isOwner;
    console.log('Submission eligibility:', { isDraft, isOwner, canSubmit: this.canSubmitToCollector });
    
    // Check if user can create Purchase Order (status is Approved)
    this.checkPurchaseOrderEligibility();

    // Check if user can approve or reject (status is Pending and user is Collector)
    this.checkApprovalEligibility();
  }

  /**
   * Check if current user can approve/reject this request
   * Conditions: Status is "Pending" and user is a Collector
   */
  checkApprovalEligibility() {
    if (!this.requestData) {
      this.canApproveOrReject = false;
      return;
    }

    const workflowState = this.requestData?.workflow_state || this.requestData?.status;
    const isPending = workflowState === 'Pending' || workflowState === 'Pending Approval';
    const isCollector = this.userService.isCollector();

    this.canApproveOrReject = isPending && isCollector;
    console.log('Approval eligibility:', { isPending, isCollector, canApprove: this.canApproveOrReject });
  }
  
  /**
   * Check if current user can create a Purchase Order from this Material Request
   * Conditions: Status is "Approved" and user is the owner/dealer
   */
  checkPurchaseOrderEligibility() {
    if (!this.requestData || !this.user) {
      this.canCreatePurchaseOrder = false;
      return;
    }
    
    const workflowState = this.requestData?.workflow_state || this.requestData?.status;
    const isApproved = workflowState === 'Approved';
    const isOwner = this.requestData?.owner === this.user?.email || this.requestData?.owner === this.user?.name;
    
    // Show button if Approved AND user is owner
    this.canCreatePurchaseOrder = isApproved && isOwner;
    console.log('PO creation eligibility:', { isApproved, isOwner, canCreate: this.canCreatePurchaseOrder });
  }

  /**
   * Check if current user can edit this request
   * Conditions: Status is "Draft" and user is the owner
   */
  checkEditEligibility() {
    if (!this.requestData || !this.user) {
      this.canEdit = false;
      this.isReadOnly = true;
      return;
    }
    
    const workflowState = this.requestData?.workflow_state || this.requestData?.status;
    const isDraft = workflowState === 'Draft';
    const isOwner = this.requestData?.owner === this.user?.email || this.requestData?.owner === this.user?.name;
    
    // Enable editing if Draft AND user is owner
    this.canEdit = isDraft && isOwner;
    this.isReadOnly = !this.canEdit;
    
    console.log('Edit eligibility:', { isDraft, isOwner, canEdit: this.canEdit });
  }

  /**
   * Update existing Material Request
   */
  update() {
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields (Item, Quantity, Warehouse, Company, District)'
      });
      return;
    }
    
    this.updating = true;
    
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
          uom: 'Nos',
          // name is required to update existing item row, if we had it. 
          // Since we are reconstructing, we might need to handle this carefully if multiple items existed.
          // For single item model (current UI), this effectively replaces the item list.
          // Ideally we should preserve item IDs if we are updating rows, but for this simple UI:
        }
      ]
    };

    // If we have the item ID from loaded data, include it to update the specific row
    if (this.requestData && this.requestData.items && this.requestData.items.length > 0) {
      // Assuming we are still only editing the first item as per UI limitation
      (payload.items[0] as any)['name'] = this.requestData.items[0].name; 
    }

    console.log('Updating Material Request:', payload);

    this.materialService.updateMaterialRequest(this.requestId, payload).subscribe({
      next: (response) => {
        console.log('Material Request Updated:', response);
        this.updating = false;
        
        // Reload to refresh state
        this.loadMaterialRequest(this.requestId);
        
        Swal.fire({
          icon: 'success',
          title: 'Request Updated!',
          text: 'Your changes have been saved.',
          confirmButtonColor: '#0d6efd',
          timer: 2000
        });
      },
      error: (err) => {
        console.error('Update Failed:', err);
        this.updating = false;
        
        let errorMsg = 'Could not update request.';
        if (err.error && err.error._server_messages) {
          try {
            const messages = JSON.parse(err.error._server_messages);
            errorMsg = JSON.parse(messages[0]).message;
          } catch (e) {}
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: errorMsg
        });
      }
    });
  }
  
  /**
   * Submit material request to collector via workflow
   */
  submitToCollector() {
    Swal.fire({
      title: 'Submit to Collector?',
      html: `Submit Material Request <b>${this.requestData.name}</b> for approval?<br><small class="text-muted">This will save any unsaved changes.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Submit',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.submittingWorkflow = true;

        // Step 1: Update the request first to save current form values
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
              uom: 'Nos',
            }
          ]
        };

        // Preserve item ID if exists
        if (this.requestData && this.requestData.items && this.requestData.items.length > 0) {
          (payload.items[0] as any)['name'] = this.requestData.items[0].name; 
        }

        console.log('Auto-saving before submit:', payload);

        this.materialService.updateMaterialRequest(this.requestId, payload).subscribe({
          next: (updateRes) => {
             console.log('Auto-save successful, proceeding to submit...');
             
             // Step 2: Apply Workflow
             this.materialService.applyWorkflow(this.requestData.name, 'Submit').subscribe({
              next: (response) => {
                console.log('Workflow applied:', response);
                
                // Reload request to get updated workflow state
                this.materialService.getMaterialRequestById(this.requestData.name).subscribe({
                  next: (updated) => {
                    this.requestData = updated.data;
                    this.submittingWorkflow = false;
                    this.canSubmitToCollector = false; // Hide button after submit
                    this.canEdit = false; // Disable editing after submit
                    this.isReadOnly = true;
                    
                    const newState = updated.data.workflow_state || updated.data.status;
                    
                    Swal.fire({
                      icon: 'success',
                      title: 'Submitted!',
                      html: `Material Request has been submitted for approval.<br>Status: <span class="badge ${this.getStatusBadgeClass(newState)}">${newState}</span>`,
                      confirmButtonColor: '#0d6efd'
                    });
                  },
                  error: (err) => {
                    this.submittingWorkflow = false;
                    console.error('Failed to reload request:', err);
                    // Still show success since workflow was applied
                    Swal.fire({
                      icon: 'success',
                      title: 'Submitted!',
                      text: 'Material Request has been submitted for approval.',
                      confirmButtonColor: '#0d6efd'
                    });
                  }
                });
              },
              error: (err) => {
                this.submittingWorkflow = false;
                console.error('Workflow submission failed:', err);
                
                Swal.fire({
                  icon: 'error',
                  title: 'Submission Failed',
                  text: err?.error?.message || err?.error?.exception || 'Could not submit the request. Please try again.'
                });
              }
            });
          },
          error: (err) => {
            this.submittingWorkflow = false;
            console.error('Auto-save failed:', err);
            Swal.fire({
              icon: 'error',
              title: 'Submission Failed',
              text: 'Could not save changes before submitting. Please try again.'
            });
          }
        });
      }
    });
  }

  /**
   * Create Purchase Order from this approved Material Request
   * Shows supplier selection dialog
   */
  createPurchaseOrder() {
    if (!this.requestData || !this.user) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Missing request data or user information.'
      });
      return;
    }

    // Check if suppliers are loaded
    if (this.supplierList.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Suppliers Available',
        text: 'Please wait for suppliers to load or check if suppliers exist in the system.'
      });
      return;
    }

    // Build supplier options for dropdown
    const supplierOptions: { [key: string]: string } = {};
    this.supplierList.forEach(s => {
      supplierOptions[s.name] = s.supplier_name || s.name;
    });

    Swal.fire({
      title: 'Create Purchase Order',
      html: `
        <p>Create a Purchase Order from Material Request <b>${this.requestData.name}</b></p>
        <div class="mb-3 text-start">
          <label class="form-label fw-semibold">Select Supplier <span class="text-danger">*</span></label>
        </div>
      `,
      input: 'select',
      inputOptions: supplierOptions,
      inputPlaceholder: 'Select a supplier',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Create PO',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a supplier!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const selectedSupplier = result.value;
        this.creatingPurchaseOrder = true;
        
        // Build Purchase Order payload from Material Request data
        const poPayload = {
          material_request: this.requestData.name,
          supplier: selectedSupplier,
          company: this.requestData.company,
          transaction_date: new Date().toISOString().split('T')[0],
          schedule_date: this.requestData.schedule_date,
          docstatus: 0, // Create as Draft
          items: this.requestData.items.map((item: any) => ({
            item_code: item.item_code,
            qty: item.qty,
            schedule_date: item.schedule_date,
            warehouse: item.warehouse,
            description: item.description,
            uom: item.uom || 'Nos',
            material_request: this.requestData.name,
            material_request_item: item.name
          }))
        };

        console.log('Creating Purchase Order:', poPayload);

        this.purchaseOrderService.createPurchaseOrder(poPayload).subscribe({
          next: (response) => {
            console.log('Purchase Order API Response:', response);
            // Handle both /api/method (response.message) and /api/resource (response.data) formats
            const poId = response.message?.name || response.data?.name || response.message || 'Unknown';
            console.log('Purchase Order Created:', poId);
            this.creatingPurchaseOrder = false;
            
            Swal.fire({
              icon: 'success',
              title: 'Purchase Order Created!',
              html: `Purchase Order <b>${poId}</b> has been created successfully.`,
              confirmButtonColor: '#0d6efd',
              confirmButtonText: 'View Purchase Order'
            }).then(() => {
              // Navigate to Purchase Order details if we have a valid ID
              if (poId && poId !== 'Unknown') {
                this.router.navigate(['/purchaseOrderDetails', poId]);
              } else {
                this.router.navigate(['/purchaseOrder']);
              }
            });
          },
          error: (err) => {
            this.creatingPurchaseOrder = false;
            console.error('Failed to create Purchase Order:', err);
            
            let errorMsg = 'Could not create Purchase Order.';
            if (err.error && err.error._server_messages) {
              try {
                const messages = JSON.parse(err.error._server_messages);
                errorMsg = JSON.parse(messages[0]).message;
              } catch (e) {}
            } else if (err.error?.message) {
              errorMsg = err.error.message;
            }
            
            Swal.fire({
              icon: 'error',
              title: 'Creation Failed',
              text: errorMsg
            });
          }
        });
      }
    });
  }

  /**
   * Approve current material request
   */
  approveMaterialRequest() {
    if (!this.requestData) return;

    Swal.fire({
      title: 'Approve Request?',
      html: `Are you sure you want to approve Material Request <b>${this.requestData.name}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.materialService.approveMaterialRequest(this.requestData.name, {}).subscribe({
          next: (response) => {
            console.log('Material request approved:', response);
            
            // Reload request to get updated state
            this.materialService.getMaterialRequestById(this.requestData.name).subscribe({
              next: (updated) => {
                this.requestData = updated.data;
                this.checkApprovalEligibility();
                this.checkPurchaseOrderEligibility();
                
                Swal.fire({
                  icon: 'success',
                  title: 'Approved!',
                  text: `Material Request ${this.requestData.name} has been approved successfully.`,
                  confirmButtonColor: '#0d6efd'
                });
              },
              error: (err) => {
                console.error('Failed to reload request:', err);
                Swal.fire({
                  icon: 'success',
                  title: 'Approved!',
                  text: `Material Request ${this.requestData.name} has been approved successfully.`,
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

  /**
   * Reject current material request
   */
  rejectMaterialRequest() {
    if (!this.requestData) return;

    Swal.fire({
      title: 'Reject Request?',
      html: `Please provide a reason for rejecting Material Request <b>${this.requestData.name}</b>:`,
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
        this.materialService.rejectMaterialRequest(this.requestData.name, reason).subscribe({
          next: (response) => {
            console.log('Material request rejected:', response);
            
            // Reload request to get updated state
            this.materialService.getMaterialRequestById(this.requestData.name).subscribe({
              next: (updated) => {
                this.requestData = updated.data;
                this.checkApprovalEligibility();
                this.checkPurchaseOrderEligibility();
                
                Swal.fire({
                  icon: 'success',
                  title: 'Rejected!',
                  text: `Material Request ${this.requestData.name} has been rejected.`,
                  confirmButtonColor: '#0d6efd'
                });
              },
              error: (err) => {
                console.error('Failed to reload request:', err);
                Swal.fire({
                  icon: 'success',
                  title: 'Rejected!',
                  text: `Material Request ${this.requestData.name} has been rejected.`,
                  confirmButtonColor: '#0d6efd'
                });
              }
            });
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

}