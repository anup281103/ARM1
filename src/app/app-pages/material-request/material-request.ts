import { Component } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-material-request',
  imports: [],
   standalone: true, 
  templateUrl: './material-request.html',
  styleUrl: './material-request.scss'
})
export class MaterialRequest {


  
  submit() {
    Swal.fire({
    html: `
      <div class="d-flex flex-column align-items-center">
        
        <!-- Animated Check Icon -->
        <div class="mb-2">
          <span class="text-success fs-1 animate-check">✔</span>
        </div>

        <!-- Title -->
        <h5 class="mb-1">Request Submitted</h5>

        <!-- Text -->
        <p class="text-muted fs-6 mb-0">
          Material Request submitted successfully!
        </p>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'OK',
    confirmButtonColor: '#0d6efd', // Bootstrap primary
    backdrop: true
  });

  }

}