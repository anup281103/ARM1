//import { environment } from "src/environments/environment";

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  roles?: string[]; // Array of role names that can access this item
  badge?: {
    title?: string;
    type?: string;
  };
  children?: NavigationItem[];
}

/* Theme MenuList Array */
export const NavigationItems: NavigationItem[] = 
[
  {
    id: 'navigation',
    title: 'Navigation',
    type: 'group',
    icon: 'icon-group',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/analytics',
        icon: 'feather icon-home'
      }
    ]
  },
  // {
  //   id: 'employeeOnboard',
  //   title: 'Employee Onboard',
  //   type: 'group',
  //   icon: 'icon-group',
  //   children: [
  //     {
  //       id: 'register',
  //       title: 'Register',
  //       type: 'item',
  //       url: '/resgister-employee',
  //       icon: 'feather icon-menu'
  //     },
  //     {
  //       id: 'profile',
  //       title: 'Employee Profile',
  //       type: 'item',
  //       url: '/emp-profile',
  //       icon: 'feather icon-file-text'
  //     }
  //   ]
  // },
  // {
  //   id: 'ui-component',
  //   title: 'Ui Component',
  //   type: 'group',
  //   icon: 'icon-group',
  //   children: [
  //     {
  //       id: 'basic',
  //       title: 'Component',
  //       type: 'collapse',
  //       icon: 'feather icon-box',
  //       children: [
  //         {
  //           id: 'button',
  //           title: 'Button',
  //           type: 'item',
  //           url: '/component/button'
  //         },
  //         {
  //           id: 'badges',
  //           title: 'Badges',
  //           type: 'item',
  //           url: '/component/badges'
  //         },
  //         {
  //           id: 'breadcrumb-pagination',
  //           title: 'Breadcrumb & Pagination',
  //           type: 'item',
  //           url: '/component/breadcrumb-paging'
  //         },
  //         {
  //           id: 'collapse',
  //           title: 'Collapse',
  //           type: 'item',
  //           url: '/component/collapse'
  //         },
  //         {
  //           id: 'tabs-pills',
  //           title: 'Tabs & Pills',
  //           type: 'item',
  //           url: '/component/tabs-pills'
  //         },
  //         {
  //           id: 'typography',
  //           title: 'Typography',
  //           type: 'item',
  //           url: '/component/typography'
  //         }
  //       ]
  //     }
  //   ]
  // },
  {
    id: 'Authentication',
    title: 'Authentication',
    type: 'group',
    icon: 'icon-group',
    children: [
      // {
      //   id: 'signup',
      //   title: 'Sign up',
      //   type: 'item',
      //   url: '/register',
      //   icon: 'feather icon-at-sign',
      //   target: true,
      //   breadcrumbs: false
      // },
      {
        id: 'signin',
        title: 'Sign in',
        type: 'item',
        url: '/login',
        icon: 'feather icon-log-in',
        target: true,
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'dealer-operations',
    title: 'Dealer Operations',
    type: 'group',
    icon: 'icon-group',
    children: [
      {
        id: 'request',
        title: 'Material Request',
        type: 'item',
        url: '/materialRequest',
        icon: 'feather icon-file-text',
        roles: ['Dealer', 'Purchase User'],
        breadcrumbs: false
      },
      {
        id: 'my-requests',
        title: 'My Requests',
        type: 'item',
        url: '/my-material-requests',
        icon: 'feather icon-list',
        roles: ['Dealer', 'Purchase User'],
        breadcrumbs: false
      },
      {
        id: 'purchase-order',
        title: 'Purchase Orders',
        type: 'item',
        url: '/purchase-order',
        icon: 'feather icon-shopping-cart',
        roles: ['Dealer', 'Purchase User'],
        breadcrumbs: false
      },
      {
        id: 'purchase-order-details',
        title: 'Purchase Order Details',
        type: 'item',
        url: '/purchase-order-details',
        icon: 'feather icon-file',
        roles: ['Dealer', 'Purchase User'],
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'collector-operations',
    title: 'Collector Operations',
    type: 'group',
    icon: 'icon-group',
    children: [
      {
        id: 'material-requests',
        title: 'Material Requests',
        type: 'item',
        url: '/materialApproval',
        icon: 'feather icon-check-circle',
        roles: ['Collector Office'],
        breadcrumbs: false
      }
    ]
  },
  // {
  //   id: 'chart',
  //   title: 'Chart',
  //   type: 'group',
  //   icon: 'icon-group',
  //   children: [
  //     {
  //       id: 'apexchart',
  //       title: 'ApexChart',
  //       type: 'item',
  //       url: '/chart',
  //       classes: 'nav-item',
  //       icon: 'feather icon-pie-chart'
  //     }
  //   ]
  // },
  // {
  //   id: 'forms & tables',
  //   title: 'Forms & Tables',
  //   type: 'group',
  //   icon: 'icon-group',
  //   children: [
  //     {
  //       id: 'forms',
  //       title: 'Basic Forms',
  //       type: 'item',
  //       url: '/forms',
  //       classes: 'nav-item',
  //       icon: 'feather icon-file-text'
  //     },
  //     {
  //       id: 'tables',
  //       title: 'Tables',
  //       type: 'item',
  //       url: '/tables',
  //       classes: 'nav-item',
  //       icon: 'feather icon-server'
  //     }
  //   ]
  // },
  // {
  //   id: 'other',
  //   title: 'Other',
  //   type: 'group',
  //   icon: 'icon-group',
  //   children: [
  //     {
  //       id: 'sample-page',
  //       title: 'Sample Page',
  //       type: 'item',
  //       url: '/sample-page',
  //       classes: 'nav-item',
  //       icon: 'feather icon-sidebar'
  //     },
  //     {
  //       id: 'menu-level',
  //       title: 'Menu Levels',
  //       type: 'collapse',
  //       icon: 'feather icon-menu',
  //       children: [
  //         {
  //           id: 'menu-level-2.1',
  //           title: 'Menu Level 2.1',
  //           type: 'item',
  //           url: 'javascript:',
  //           external: true
  //         },
  //         {
  //           id: 'menu-level-2.2',
  //           title: 'Menu Level 2.2',
  //           type: 'collapse',
  //           children: [
  //             {
  //               id: 'menu-level-2.2.1',
  //               title: 'Menu Level 2.2.1',
  //               type: 'item',
  //               url: 'javascript:',
  //               external: true
  //             },
  //             {
  //               id: 'menu-level-2.2.2',
  //               title: 'Menu Level 2.2.2',
  //               type: 'item',
  //               url: 'javascript:',
  //               external: true
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ]
  // }
];

// interface Link {
//   LinkName: string;
//   Path: string;
//   Child?: Link[] | null;
//   SChild?: Link[] | null;
// }

// /** Recursively builds NavigationItems */
// function buildNavigationItems(
//   links: Link[],
//   parentId: string = '',
//   isTopLevel: boolean = false
// ): NavigationItem[] {
//   return links.map((link, index) => {
//     const id = parentId
//       ? `${parentId}-${index + 1}`
//       : link.LinkName.toLowerCase().replace(/\s+/g, '-');

//     // Merge all children
//     const allChildren = [...(link.Child || []), ...(link.SChild || [])];
//     const hasChildren = allChildren.length > 0;

//     let item: NavigationItem;

//     if (isTopLevel) {
//       // Top-level group
//       item = {
//         id,
//         title: link.LinkName,
//         type: 'group',
//         icon: 'icon-group',
//         children: hasChildren
//           ? buildNavigationItems(allChildren, id, false)
//           : [],
//       };
//     } else {
//       // Submenus (collapse or item)
//       item = {
//         id,
//         title: link.LinkName,
//         type: hasChildren ? 'collapse' : 'item',
//         icon: hasChildren ? 'feather icon-menu' : undefined,
//         url: hasChildren ? undefined : JSON.parse(JSON.stringify(environment))?.legacy_app_baseUrl + link.Path,
//         external: !hasChildren,
//       };

//       if (hasChildren) {
//         item.children = buildNavigationItems(allChildren, id, false);
//       }
//     }

//     return item;
//   });
// }

// const menuData = localStorage.getItem('lstUserDetail');
// let MenuList = null;
// if (menuData) {
//   try {
//     const jsonData = JSON.parse(menuData);
//     MenuList = jsonData.MenusList;
//   } catch (error) {
//     console.error('Invalid JSON data in localStorage:', error);
//   }
// } else {
//   console.warn('No menu data found in localStorage');
// }

// export const NavigationItems: NavigationItem[] = buildNavigationItems(MenuList, '', true);

//console.log(NavigationItems);
//console.log(NavigationItemst);