import { supabase } from './cloud'

/**
 * 🛠️ The Admin page's calls. Each one is a database function (supabase/003_admin.sql)
 * that refuses anyone who isn't in the "admins" table — the app can't get around that.
 */

export interface AdminSummary {
  users: number
  clubs: number
  titles: number
  ratings: number
  reviews: number
}

export interface AdminClub {
  id: string
  name: string
  invite_code: string
  created_at: string
  host_name: string | null
  members: number
  titles: number
  last_added: string | null
}

export interface AdminMember {
  user_id: string
  name: string
  emoji: string | null
  color: string
  role: 'host' | 'member'
  joined_at: string
}

export interface AdminUser {
  id: string
  email: string | null
  name: string | null
  emoji: string | null
  color: string | null
  created_at: string
  last_sign_in_at: string | null
  clubs: number
  entries: number
  is_admin: boolean
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('The app is missing its Supabase settings.')
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

/** false if you're not an admin — or if 003_admin.sql hasn't been run yet. */
export async function isAdmin(): Promise<boolean> {
  return call<boolean>('is_admin').catch(() => false)
}

export const adminSummary = () => call<AdminSummary>('admin_summary')
export const adminClubs = () => call<AdminClub[]>('admin_clubs')
export const adminClubMembers = (clubId: string) => call<AdminMember[]>('admin_club_members', { target: clubId })
export const adminUsers = () => call<AdminUser[]>('admin_users')
export const adminRenameClub = (clubId: string, name: string) => call<void>('admin_rename_club', { target: clubId, new_name: name })
export const adminDeleteClub = (clubId: string) => call<void>('admin_delete_club', { target: clubId })
export const adminRemoveMember = (clubId: string, userId: string) =>
  call<void>('admin_remove_member', { target_club: clubId, target_user: userId })
export const adminDeleteUser = (userId: string) => call<void>('admin_delete_user', { target: userId })
export const adminReset = (deleteAccounts: boolean) => call<void>('admin_reset', { delete_accounts: deleteAccounts })
