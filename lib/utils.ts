import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get full image URL from backend
 * @param imagePath - Relative path like "/uploads/image.jpg" or full URL
 * @returns Full URL to the image
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "/placeholder.svg"
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath
  }
  
  // If it starts with /uploads, prepend the backend URL
  if (imagePath.startsWith("/uploads")) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001"
    return `${backendUrl}${imagePath}`
  }
  
  // Otherwise, return as is (might be a public asset)
  return imagePath
}

/**
 * Format timestamp to 12-hour format with month names
 * @param timestamp - ISO timestamp string or Date object
 * @returns Formatted string like "January 15, 2024 at 3:45 PM" or relative time like "2h ago"
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Relative time for recent items
  if (diff < 60 * 1000) return "Just now"
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  
  // Format date with month names and 12-hour time
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  
  // Format time in 12-hour format
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes
  
  return `${month} ${day}, ${year} at ${hours}:${minutesStr} ${ampm}`
}
