"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
}: {
  className?: string
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
}) {
  const currentValue = value?.[0] ?? defaultValue?.[0] ?? min

  return (
    <input
      type="range"
      className={cn("w-full cursor-pointer accent-[#fa4779]", className)}
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
    />
  )
}

export { Slider }
