import { cn } from "@/lib/utils"
import { PhosphorIcon, type PhosphorIconProps } from "@/components/ui/phosphor-icon"

function Spinner({ className, ...props }: Omit<PhosphorIconProps, "name">) {
  return (
    <PhosphorIcon name="circle-notch" data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
