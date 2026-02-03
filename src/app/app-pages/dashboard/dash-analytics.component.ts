// angular import
import { Component, inject, OnInit, viewChild } from '@angular/core';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ProductSaleComponent } from './product-sale/product-sale.component';

// 3rd party import

import { ApexOptions, ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
// import { UserModel } from 'src/app/models/user-detail.model';
import { UserService } from 'src/app/services/user-service';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-dash-analytics',
  imports: [SharedModule, NgApexchartsModule, ProductSaleComponent],
  templateUrl: './dash-analytics.component.html',
  styleUrls: ['./dash-analytics.component.scss']
})
export class DashAnalyticsComponent implements OnInit { 

  // public props
  chart = viewChild<ChartComponent>('chart');
  customerChart = viewChild<ChartComponent>('customerChart');
  chartOptions!: Partial<ApexOptions>;
  chartOptions_1!: Partial<ApexOptions>;
  chartOptions_2!: Partial<ApexOptions>;
  chartOptions_3!: Partial<ApexOptions>;

  // User Session
  user: any = null;
  userRoles: string[] = [];
  serverTime: Date = new Date();

  // constructor
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {
    this.chartOptions = {
      chart: {
        height: 205,
        type: 'line',
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2,
        curve: 'smooth'
      },
      series: [
        {
          name: 'Arts',
          data: [20, 50, 30, 60, 30, 50]
        },
        {
          name: 'Commerce',
          data: [60, 30, 65, 45, 67, 35]
        }
      ],
      legend: {
        position: 'top'
      },
      xaxis: {
        type: 'datetime',
        categories: ['1/11/2000', '2/11/2000', '3/11/2000', '4/11/2000', '5/11/2000', '6/11/2000'],
        axisBorder: {
          show: false
        }
      },
      yaxis: {
        show: true,
        min: 10,
        max: 70
      },
      colors: ['#73b4ff', '#59e0c5'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          gradientToColors: ['#4099ff', '#2ed8b6'],
          shadeIntensity: 0.5,
          type: 'horizontal',
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      grid: {
        borderColor: '#cccccc3b'
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
      series: [39, 10],
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
      colors: ['#4680ff', '#2ed8b6'],
      fill: {
        opacity: [1, 1]
      },
      stroke: {
        width: 0
      }
    };
    this.chartOptions_2 = {
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
      colors: ['#fff', '#2ed8b6'],
      fill: {
        opacity: [1, 1]
      },
      stroke: {
        width: 0
      }
    };
    this.chartOptions_3 = {
      chart: {
        type: 'area',
        height: 145,
        sparkline: {
          enabled: true
        }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#ff5370'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#ff869a'],
          shadeIntensity: 1,
          type: 'horizontal',
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 100, 100, 100]
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      series: [
        {
          data: [45, 35, 60, 50, 85, 70]
        }
      ],
      yaxis: {
        min: 5,
        max: 90
      },
      tooltip: {
        fixed: {
          enabled: false
        },
        x: {
          show: false
        },
        marker: {
          show: false
        }
      }
    };
  }

  ngOnInit(): void {
    this.loadUserSession();
    
    // Subscribe to UserService for user and roles
    this.userService.user$.subscribe(user => {
      if (user) {
        this.user = user;
        console.log('DashAnalytics: User from UserService:', user);
      }
    });

    this.userService.roles$.subscribe(roles => {
      this.userRoles = roles;
      console.log('DashAnalytics: Roles from UserService:', roles);
    });
  }

  loadUserSession() {
    // Try to get user from UserService first
    const existingUser = this.userService.getUser();
    if (existingUser) {
      this.user = existingUser;
      this.userRoles = this.userService.getRoles();
      console.log('DashAnalytics: Using cached user and roles');
      return;
    }

    // If not in UserService, fetch from API
    this.authService.getLoggedInUser().subscribe({
      next: (res) => {
        console.log('DashAnalytics: get_logged_user response:', res);
        const userId = res.message;
        if (userId) {
          this.authService.getUserDetails(userId).subscribe({
            next: (userRes) => {
              this.user = userRes.data;
              this.userService.setUser(this.user);
              this.serverTime = new Date();
              console.log('DashAnalytics: Loaded user from API:', this.user);
              
              // Also fetch roles if not already loaded
              if (this.userRoles.length === 0) {
                this.authService.getUserRoles().subscribe({
                  next: (rolesRes) => {
                    const roles = rolesRes.message || [];
                    this.userService.setRoles(roles);
                    this.userRoles = roles;
                  },
                  error: (err) => console.error('Failed to load roles', err)
                });
              }
            },
            error: (err) => {
                console.error('DashAnalytics: Failed to load user details', err);
                // Fallback
                if (!this.user) {
                    this.user = { name: userId, full_name: userId };
                }
            }
          });
        }
      },
      error: (err) => {
        console.error('DashAnalytics: Failed to get logged in user', err);
      }
    });
  }

  cards = [
    {
      background: 'bg-c-blue',
      title: 'Total Inventory',
      icon: 'icon-shopping-cart',
      text: 'This Month',
      number: '486',
      no: '351'
    },
    {
      background: 'bg-c-green',
      title: 'Total Sales',
      icon: 'icon-tag',
      text: 'This Month',
      number: '1641',
      no: '213'
    },
    {
      background: 'bg-c-yellow',
      title: 'Pending Repairs',
      icon: 'icon-repeat',
      text: 'This Month',
      number: '₹42,56',
      no: '₹ 5,032'
    },
    {
      background: 'bg-c-red',
      title: 'Total Profit',
      icon: 'icon-thumbs-up',
      text: 'This Month',
      number: '₹9,562',
      no: '₹542'
    }
  ];

  images = [
    {
      src: 'assets/images/gallery-grid/img-grd-gal-1.jpg',
      title: 'Old Scooter',
      size: 'PNG-100KB'
    },
    {
      src: 'assets/images/gallery-grid/img-grd-gal-2.jpg',
      title: 'Wall Art',
      size: 'PNG-150KB'
    },
    {
      src: 'assets/images/gallery-grid/img-grd-gal-3.jpg',
      title: 'Microphone',
      size: 'PNG-150KB'
    }
  ];
}
