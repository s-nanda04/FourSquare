"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Select({
  value,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}) {
  return (
    <SelectContext.Provider value={{ value, defaultValue, onValueChange }}>
      {children}
    </SelectContext.Provider>
  )
}

type SelectContextType = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const SelectContext = React.createContext<SelectContextType>({})

function SelectTrigger({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative", className)} {...props}>{children}</div>
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext)
  return <span>{ctx.value ?? ctx.defaultValue ?? placeholder ?? ""}</span>
}

function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function SelectItem({ value, children }: { value: string; children?: React.ReactNode }) {
  return <option value={value}>{children}</option>
}

function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <label className="px-1.5 py-1 text-xs text-muted-foreground">{children}</label>
}

function SelectSeparator({ className }: { className?: string }) {
  return <hr className={cn("my-1 border-border", className)} />
}

// Unified native select for actual use
function NativeSelect({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children?: React.ReactNode
}) {
  return (
    <select
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
        className
      )}
    >
      {children}
    </select>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  NativeSelect,
}
