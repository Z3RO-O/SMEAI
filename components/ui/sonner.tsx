"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-black group-[.toaster]:text-black group-[.toaster]:dark:text-white group-[.toaster]:border-gray-200 group-[.toaster]:dark:border-gray-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-600 group-[.toast]:dark:text-gray-400 group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-black group-[.toast]:dark:bg-white group-[.toast]:text-white group-[.toast]:dark:text-black",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:dark:bg-gray-900 group-[.toast]:text-gray-900 group-[.toast]:dark:text-gray-100",
          success: "group-[.toast]:!bg-green-50 group-[.toast]:dark:!bg-green-950 group-[.toast]:!text-green-900 group-[.toast]:dark:!text-green-100 group-[.toast]:!border-green-200 group-[.toast]:dark:!border-green-800",
          error: "group-[.toast]:!bg-red-50 group-[.toast]:dark:!bg-red-950 group-[.toast]:!text-red-900 group-[.toast]:dark:!text-red-100 group-[.toast]:!border-red-200 group-[.toast]:dark:!border-red-800",
          warning: "group-[.toast]:!bg-yellow-50 group-[.toast]:dark:!bg-yellow-950 group-[.toast]:!text-yellow-900 group-[.toast]:dark:!text-yellow-100 group-[.toast]:!border-yellow-200 group-[.toast]:dark:!border-yellow-800",
          info: "group-[.toast]:!bg-gray-50 group-[.toast]:dark:!bg-gray-950 group-[.toast]:!text-gray-900 group-[.toast]:dark:!text-gray-100 group-[.toast]:!border-gray-200 group-[.toast]:dark:!border-gray-800",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-green-600 dark:text-green-400" />,
        info: <InfoIcon className="size-5 text-gray-600 dark:text-gray-400" />,
        warning: <TriangleAlertIcon className="size-5 text-yellow-600 dark:text-yellow-400" />,
        error: <OctagonXIcon className="size-5 text-red-600 dark:text-red-400" />,
        loading: <Loader2Icon className="size-5 animate-spin text-gray-600 dark:text-gray-400" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
