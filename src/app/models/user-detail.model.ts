export interface UserModel {
  $id: string;
  User_Id: string;
  FullName: string;
  EName: string;
  UserName: string;
  State_Id: number | null;
  District_Id: number | null;
  Block_Id: number | null;
  ProfilePhotoUrl: string | null;
  UserToken: string;
  Location: string | null;
  Entity: string | null;
  Section: string | null;
  RoleIds: number[];
  MenusList: MenuItem[];
  RoleModuleList: unknown;
  UserPermissions: UserPermission[];
  Designation: string;
  Employee_Id: number;
  Password: string | null;
  EmployeeCode: string | null;
  Mobile: string;
  Email: string;
  DOB: string | null;
  Gender: string | null;
  Gender_Id: number | null;
  LastLoggedin: string;
  SanctionAuthority: string | null;
  EmployeeuniqueId: string;
  LoginLog_Id: number;
  Vendor_Id: number | null;
  DepartmentName: string;
  SubDepartmentName: string;
  OfficeName: string | null;
  OfficeLevelName: string | null;
  DemographyName: string | null;
  DepartmentAcronym: string | null;
  DeptSubdeptTypeId: number | null;
  Department_Id: number;
  SubDepartmentUnit_Id: number | null;
  SubDept_Id: number | null;
  SubDeptAcronym: string | null;
  Office_Id: number;
  OfficeAcronym: string | null;
  OfficeLevelId: number;
  OfficeTypeId: number | null;
  Entity_Id: number | null;
  Designation_Id: number;
  AppointmentType: string | null;
  AppointmentType_Id: number;
  ShowSideMenu: boolean;
  UserType_Id: number;
  Posted_At_Department: string | null;
  Agency_Name: string | null;
  EmployeeTreasuryID: string;
  DemographyID: number;
  DynamicDemographyID: string | null;
  EmployeeProfileStatusId: number | null;
  EmployeeActiveStatusId: number | null;
  EmployeeProfileStatus: string | null;
  userHierarchy: string | null;
  Office_Name: string;
  ExternalUserId: number;
  NodalOfficerOfficeName: string | null;
  SectionId: number | null;
  MaxChoiceLimit: number | null;
  TransferDateID: number;
  ExtDepartment_Id: number;
  Answer: string | null;
  TransferPermission: TransferPermission[];
  Device: string | null;
}

// ----------------------------------------
// Submodels
// ----------------------------------------

export interface UserPermission {
  $id: string;
  Role_Id: number;
  RoleName: string;
  Module_Id: number;
  ModuleName: string;
  Permission_Id: number | null;
  PermissionName: string;
  Value: boolean;
}

export interface TransferPermission {
  $id: string;
  isMutilpleReason: boolean | null;
  MaxChoiceLimit: number;
  TransferDateID: number | null;
  TransferYearId: string;
  IsSanctionedPostConfiguration: boolean;
  IsTransferRequestWindowOpen: boolean;
}

// ----------------------------------------
// ✅ MenusList structure
// ----------------------------------------

export interface MenuItem {
  $id?: string;
  isActive?: boolean | null;
  LinkName: string;
  Path: string;
  Child?: MenuItem[] | null;   // Recursive child items
  SChild?: SubMenuItem[] | null;
  SSChildId?: number | null;
  Link_Id: number;
  SLink_Id: number;
  GroupId: number;
  SequenceNumber: number;
  Permissions?: string[] | null;
}

export interface SubMenuItem {
  $id?: string;
  isActive?: boolean | null;
  LinkName: string;
  Path: string;
  Child?: MenuItem[] | null;
  SChild?: SubMenuItem[] | null;
  SSChildId?: number | null;
  Link_Id: number;
  SLink_Id: number;
  GroupId: number;
  SequenceNumber: number;
  Permissions?: string[] | null;
}
