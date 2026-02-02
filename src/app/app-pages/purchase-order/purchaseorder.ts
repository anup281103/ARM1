import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

interface PurchaseOrder {
  poNo: string;
  status: string;
  supplier: string;
  date: string;
  total: number;
  company: string;
}


@Component({
  selector: 'app-purchaseorder',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, FormsModule, RouterModule   ],
  templateUrl: './purchaseorder.html',
  styleUrl: './purchaseorder.scss'
})
export class Purchaseorder {


// Charts

     monthlyChart!: Partial<ApexOptions>;
    chartOptions_1!: Partial<ApexOptions>;


  constructor() {
    this.monthlyChart = {
      chart: {
        type: 'bar',
        height: 260,
        toolbar: { show: false }
      },

      series: [
        {
          name: 'Purchase Orders',
          data: [4, 7, 10, 9, 14, 19]
        }
      ],

      xaxis: {
        categories: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
      },

      dataLabels: {
        enabled: false
      },

      colors: ['#4680ff'],

      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '40%'
        }
      }
    };
     this.chartOptions_1 = {
      chart: {
        height: 150,
        type: 'donut'
      },
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        pie: {
          donut: {
            size: '75%'
          }
        }
      },
      labels: ['New', 'Return'],
      series: [20, 15],
      legend: {
        show: false
      },
      tooltip: {
        theme: 'dark'
      },
      grid: {
        padding: {
          top: 20,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
     colors: ['#d6d6d6', '#2955d2'],
      fill: {
        opacity: [1, 1]
      },
      stroke: {
        width: 0
      }
    };
  }


  // Table
  orders: PurchaseOrder[] = [
    {
      poNo: 'PUR-ORD-2024-09004',
      status: 'Completed',
      supplier: 'RG Arms Ltd',
      date: '2024-01-27',
      total: 0,
      company: 'RG Arms Ltd'
    },
    {
      poNo: 'PUR-ORD-2024-09003',
      status: 'Completed',
      supplier: 'RG Arms Ltd',
      date: '2024-01-25',
      total: 7450000,
      company: 'RG Arms Ltd'
    },
    {
      poNo: 'PUR-ORD-2024-09002',
      status: 'To Bill',
      supplier: 'RG Arms Ltd',
      date: '2024-01-22',
      total: 0,
      company: 'RG Arms Ltd'
    }
  ];

  // pagination
  pageSize = 5;
  currentPage = 1;

  // sorting
  sortColumn: keyof PurchaseOrder | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  get totalPages(): number {
    return Math.ceil(this.orders.length / this.pageSize);
  }

  get paginatedOrders(): PurchaseOrder[] {
    let data = [...this.orders];

    // sorting
    if (this.sortColumn) {
      data.sort((a: any, b: any) => {
        const valueA = a[this.sortColumn];
        const valueB = b[this.sortColumn];

        if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // pagination
    const start = (this.currentPage - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }

  changeSort(column: keyof PurchaseOrder) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  changePage(page: number) {
    this.currentPage = page;
  }
}
