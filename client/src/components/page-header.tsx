import React from "react";

interface PageHeaderProps {
  heading: string;
  text?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  heading,
  text,
  icon,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {icon && <div className="text-primary">{icon}</div>}
          {heading}
        </h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}