import * as React from 'react'

interface AvatarProps {
  children: React.ReactNode
  className?: string
}

export function Avatar({ children, className = '' }: AvatarProps) {
  return (
    <div className={`flex items-center justify-center rounded-full ${className}`}>
      {children}
    </div>
  )
}
