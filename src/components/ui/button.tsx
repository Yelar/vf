import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500/25 shadow-purple-500/25",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:from-red-700 hover:to-red-800 focus:ring-red-500/25",
        outline:
          "border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15 focus:ring-purple-500/25",
        secondary:
          "bg-white/10 text-white hover:bg-white/15 focus:ring-purple-500/25",
        ghost:
          "text-white hover:bg-white/10 focus:ring-purple-500/25",
        link: "text-purple-400 underline-offset-4 hover:underline hover:text-purple-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
