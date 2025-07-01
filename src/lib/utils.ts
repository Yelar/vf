import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createLimitErrorResponse(remaining: number, resetDate: Date) {
  return {
    error: 'Generation limit reached',
    details: {
      remaining,
      total: 70,
      resetDate: resetDate.toISOString(),
      message: "You've reached your monthly generation limit"
    }
  }
}
