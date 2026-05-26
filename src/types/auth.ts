export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'operator'
  | 'marketing'
  | 'finance'
  | 'support'

export type Permission =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'view_reports'
  | 'manage_drivers'
  | 'manage_orders'
  | 'manage_settings'

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ['create', 'read', 'update', 'delete', 'view_reports', 'manage_drivers', 'manage_orders', 'manage_settings'],
  admin:       ['create', 'read', 'update', 'delete', 'view_reports', 'manage_drivers', 'manage_orders', 'manage_settings'],
  operator:    ['read', 'update', 'manage_orders', 'manage_drivers'],
  marketing:   ['read', 'view_reports'],
  finance:     ['read', 'view_reports', 'update'],
  support:     ['read', 'manage_orders'],
}

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export interface AdminUser {
  id:          string
  email:       string
  name:        string
  role:        AdminRole
  avatar_url?: string
  last_login?: string
}
