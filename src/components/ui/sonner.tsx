import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { PhosphorIcon } from "@/components/ui/phosphor-icon"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <PhosphorIcon name="check-circle" className="size-4" />
        ),
        info: (
          <PhosphorIcon name="info" className="size-4" />
        ),
        warning: (
          <PhosphorIcon name="warning" className="size-4" />
        ),
        error: (
          <PhosphorIcon name="warning-octagon" className="size-4" />
        ),
        loading: (
          <PhosphorIcon name="circle-notch" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
