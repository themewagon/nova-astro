import * as React from "react"

import { cn } from "@/lib/utils"

export type PhosphorIconProps = React.HTMLAttributes<HTMLElement> & {
  name: string
  weight?: "regular" | "bold" | "fill" | "thin" | "light" | "duotone"
  size?: string | number
}

/**
 * Reactowy odpowiednik atoms/Icon.astro.
 * Dlaczego: komponenty UI React i bloki Astro korzystają z tej samej rodziny
 * Phosphor, bez dokładania drugiej biblioteki ikon do startera.
 */
function PhosphorIcon({
  name,
  weight = "regular",
  size,
  className,
  style,
  ...props
}: PhosphorIconProps) {
  const iconName = name.replace(/^ph-/, "")
  const weightClass = weight === "regular" ? "ph" : `ph-${weight}`
  const fontSize = typeof size === "number" ? `${size}px` : size

  return (
    <i
      {...props}
      className={cn(weightClass, `ph-${iconName}`, className)}
      style={fontSize ? { ...style, fontSize } : style}
    />
  )
}

export { PhosphorIcon }
