import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 backdrop-blur-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium hover:bg-white/15 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/25 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
