import React from "react";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { Card } from "@/components/ui/card";
import { FolderSearch, Plus, RefreshCw, FileText, CheckCircle2 } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  titleHi?: string;
  description: string;
  descriptionHi?: string;
  actionText?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateCard({
  icon = <FolderSearch className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />,
  title,
  titleHi,
  description,
  descriptionHi,
  actionText,
  actionIcon = <Plus className="h-4 w-4" />,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <Card
      className={`p-8 text-center rounded-3xl border-2 border-dashed border-input bg-card/50 flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-inner">
        {icon}
      </div>

      <div className="space-y-1">
        {titleHi && <h3 className="text-base font-extrabold text-foreground">{titleHi}</h3>}
        <h4 className="text-sm font-bold text-muted-foreground">{title}</h4>
        {descriptionHi && (
          <p className="text-xs font-semibold text-muted-foreground pt-1">{descriptionHi}</p>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {actionText && onAction && (
        <ExtraLargeButton
          variant="primary"
          size="default"
          icon={actionIcon}
          onClick={onAction}
          className="mt-2 text-xs"
        >
          {actionText}
        </ExtraLargeButton>
      )}
    </Card>
  );
}
