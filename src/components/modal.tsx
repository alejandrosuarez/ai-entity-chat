'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/40"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card border shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            {title}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-1 h-8 w-8"
            title="Back to Entity"
          >
            ✕
          </Button>
        </div>

        {/* Body */}
        <div className="p-4 text-card-foreground">{children}</div>

        {/* Footer */}
        {actions && (
          <div className="flex justify-end gap-2 p-4 border-t border-border">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
