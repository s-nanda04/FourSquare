"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

type DialogContextType = { open: boolean; setOpen: (v: boolean) => void }
const DialogContext = React.createContext<DialogContextType>({ open: false, setOpen: () => {} })

function Dialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = (v: boolean) => {
    setInternalOpen(v)
    onOpenChange?.(v)
  }
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(DialogContext)
  return (
    <button
      data-slot="dialog-trigger"
      className={className}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
}

function DialogClose({ children, className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(DialogContext)
  return (
    <button
      data-slot="dialog-close"
      className={className}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children}
    </button>
  )
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DialogOverlay({ className }: { className?: string }) {
  const { setOpen } = React.useContext(DialogContext)
  return (
    <div
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/40", className)}
      onClick={() => setOpen(false)}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
}: {
  className?: string
  children?: React.ReactNode
  showCloseButton?: boolean
}) {
  const { open, setOpen } = React.useContext(DialogContext)
  if (!open) return null
  return (
    <>
      <DialogOverlay />
      <div
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-white p-4 text-sm shadow-xl sm:max-w-sm",
          className
        )}
      >
        {children}
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={() => setOpen(false)}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { setOpen } = React.useContext(DialogContext)
  return (
    <div
      data-slot="dialog-footer"
      className={cn("-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="dialog-title" className={cn("text-base font-medium leading-none", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
