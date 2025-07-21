import { type User } from "@/types/auth"

const USER_STORAGE_KEY = "user"

export function getStoredUser(): User | null {
  try {
    const userData = localStorage.getItem(USER_STORAGE_KEY)
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem(USER_STORAGE_KEY)
}