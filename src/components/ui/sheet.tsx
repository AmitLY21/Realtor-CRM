import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

interface SheetContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextType | undefined>(undefined)

function useSheet() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet")
  }
  return context
}

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {open ? children : null}
    </SheetContext.Provider>
  )
}

const sheetVariants = cva(
  "fixed z-50 bg-background text-foreground shadow-2xl transition ease-in-out duration-200 flex flex-col",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-border animate-in slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t border-border animate-in slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-border animate-in slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border animate-in slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "left",
    },
  }
)

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {
  onClose?: () => void
  showCloseButton?: boolean
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "left", className, children, onClose, showCloseButton = true, ...props }, ref) => {
    const { onOpenChange } = useSheet()
    const handleClose = () => {
      if (onClose) onClose()
      onOpenChange(false)
    }

    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
      >
        <div
          ref={ref}
          className={cn(sheetVariants({ side }), className)}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="סגור"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>
      </div>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1 p-4 border-b border-border text-right select-none",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-sm sm:text-base font-bold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/40",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
}
