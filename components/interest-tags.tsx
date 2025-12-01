"use client"

import { Badge } from "@/components/ui/badge"

// Tag definitions matching the onboarding tags
const TAG_MAP: Record<string, string> = {
  education: "Education",
  environment: "Environment",
  health: "Health & Medicine",
  poverty: "Poverty & Hunger",
  animals: "Animal Welfare",
  "human-rights": "Human Rights",
  "disaster-relief": "Disaster Relief",
  "arts-culture": "Arts & Culture",
  technology: "Technology Access",
  elderly: "Elderly Care",
  youth: "Youth Development",
  "mental-health": "Mental Health",
  community: "Community",
}

interface InterestTagsProps {
  tags: string[]
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "sm" | "md" | "lg"
}

export function InterestTags({ tags, className = "", variant = "secondary", size = "md" }: InterestTagsProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tagId) => {
        const label = TAG_MAP[tagId] || tagId
        return (
          <Badge key={tagId} variant={variant} className={sizeClasses[size]}>
            {label}
          </Badge>
        )
      })}
    </div>
  )
}












