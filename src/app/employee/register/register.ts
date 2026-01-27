import { Component, inject, OnInit } from '@angular/core';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

// bootstrap import
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { RegisterService, DemoTest } from 'src/app/services/register.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, SharedModule, NgbDropdownModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  demos: DemoTest[] = [];
  newDemo: DemoTest = { id: 0, name: '', lastName: '', mobile: '', gender: true };
  isEdit = false;
  isCancel = false;

  private registerService = inject(RegisterService);
  private route = inject(ActivatedRoute); 
  private router = inject(Router);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.registerService.getAll().subscribe({
      next: (data) => (this.demos = data),
      error: (err) => console.error(err),
    });
  }

  saveDemoRecord() {
    if (!this.newDemo.name?.trim()) return;

    if (this.isEdit) {
      this.updateDemo(this.newDemo);
    } else {
      this.registerService.insertDemo(this.newDemo).subscribe({
        next: (res) => {
          const data = res as { message: string };
          Swal.fire({
            title: 'Success!',
            text: data.message,
            icon: 'success',
            confirmButtonText: 'OK'
          });

          this.loadData();
          this.newDemo = { name: '', lastName: '', mobile: '', gender: true };
        },
        error: (err) => Swal.fire('Waring!', err, 'error'),
      });
    }
  }

  updateDemo(demo: DemoTest) {
    if (!demo.id) return;
    this.registerService.updateDemo(demo.id, demo).subscribe({
      next: (res) => {
        Swal.fire('Success!', res?.toString(), 'success')
        this.loadData();
        this.newDemo = { name: '', lastName: '', mobile: '', gender: true };
        this.isEdit = false;
        this.isCancel = false;
      },
      error: (err) => Swal.fire('Waring!', err, 'error'),
    });
  }

  editDemo(demo: DemoTest) {
    this.newDemo = { ...demo };  
    this.isEdit = true;
    this.isCancel = true;
  }

  cancelEdit() {
    this.newDemo = { id: 0, name: '', lastName: '', mobile: '', gender: true };
    this.isCancel = false;
    this.isEdit = false;
  }

  deleteDemo(id?: number) {

    Swal.fire({
      title: 'Are you sure you want to delete this record?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.registerService.deleteDemo(id).subscribe({
          next: (res) => {
            //alert(res);
            Swal.fire('Deleted!', res?.toString(), 'success');
            this.loadData();
            this.isEdit = false;
            this.isCancel = false;
          },
          error: (err) => Swal.fire('Waring!', err, 'error'),
        });
      }
    });
  }

  allowNumbers(event: KeyboardEvent) {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  getRowClass(index: number): string {
    const classes = [
      'table-active',
      'table-success',
      'table-warning',
      'table-danger',
      'table-info'
    ];
    
    if (index % 2 === 0) {
      // pick a class based on even index
      return classes[(index / 2) % classes.length];
    }

    // For odd rows — no class
    return '';
  }
}
