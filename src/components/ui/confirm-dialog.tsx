import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
  onCancel?: () => void
  icon?: React.ReactNode
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  subtitle,
  description,
  confirmLabel = 'אישור מחיקה',
  cancelLabel = 'ביטול',
  variant = 'destructive',
  onConfirm,
  onCancel,
  icon = <AlertTriangle className="size-5 text-destructive" />
}) => {
  const handleCancel = () => {
    if (onCancel) onCancel()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 shrink-0">
              {icon}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <DialogTitle>{title}</DialogTitle>
              {subtitle && (
                <DialogDescription>{subtitle}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 text-xs text-foreground leading-relaxed select-text">
          {description}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
