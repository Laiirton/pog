"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const Calendar = React.forwardRef<
  React.ElementRef<typeof DayPicker>,
  React.ComponentPropsWithoutRef<typeof DayPicker>
>(({ className, classNames, showOutsideDays = true, ...props }, ref) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-black text-green-500", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-green-500",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-black border border-green-500 text-green-500 hover:bg-green-900 hover:text-green-300 rounded-full p-0"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-green-500 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-green-900 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-green-500 hover:bg-green-900 hover:text-green-300 aria-selected:opacity-100"
        ),
        day_selected: "bg-green-500 text-black hover:bg-green-600 hover:text-black focus:bg-green-500 focus:text-black",
        day_today: "bg-green-900 text-green-50",
        day_outside: "text-green-500 opacity-50",
        day_disabled: "text-green-500 opacity-30",
        day_range_middle: "aria-selected:bg-green-900 aria-selected:text-green-500",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <div className="flex items-center justify-center w-full h-full">
            <ChevronLeft className="h-4 w-4 text-green-500" />
          </div>
        ),
        IconRight: ({ ...props }) => (
          <div className="flex items-center justify-center w-full h-full">
            <ChevronRight className="h-4 w-4 text-green-500" />
          </div>
        ),
      }}
      {...props}
    />
  )
})
Calendar.displayName = "Calendar"

export { Calendar }
