import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { btn, btnDanger } from '@/components/shell/styles';

const content = 'border-[#222733] bg-[#12151c] text-[#e7e9ee] shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)] sm:rounded-[10px]';

export function FormDialog({ title, description, onClose, children, footer, testId, wide }: {
  title: string; description?: ReactNode; onClose: () => void; children: ReactNode; footer: ReactNode; testId: string; wide?: boolean;
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className={`${content} ${wide ? 'max-w-[560px]' : 'max-w-[440px]'} gap-4 p-5`} data-testid={testId}>
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="text-[12px] text-[#8b93a7]">{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2 sm:gap-2">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onClose, testId }: {
  title: string; description: ReactNode; confirmLabel: string; onConfirm: () => void; onClose: () => void; testId: string;
}) {
  return (
    <AlertDialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent className={`${content} max-w-[420px] gap-4 p-5`} data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[15px] font-semibold tracking-tight">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[12.5px] leading-relaxed text-[#8b93a7]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className={`${btn} mt-0`} data-testid="button-cancel">Cancel</AlertDialogCancel>
          <AlertDialogAction className={btnDanger} onClick={onConfirm} data-testid="button-confirm">{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
