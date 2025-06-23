import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'none';
}

const gradientClasses = {
  purple: 'bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-blue-600/10 border-purple-500/20 hover:border-purple-400/40',
  blue: 'bg-gradient-to-br from-blue-600/10 via-blue-500/5 to-cyan-600/10 border-blue-500/20 hover:border-blue-400/40',
  green: 'bg-gradient-to-br from-green-600/10 via-green-500/5 to-emerald-600/10 border-green-500/20 hover:border-green-400/40',
  orange: 'bg-gradient-to-br from-orange-600/10 via-orange-500/5 to-red-600/10 border-orange-500/20 hover:border-orange-400/40',
  red: 'bg-gradient-to-br from-red-600/10 via-red-500/5 to-pink-600/10 border-red-500/20 hover:border-red-400/40',
  none: 'bg-white/5 border-white/10 hover:border-white/20'
};

export function ModernCard({ 
  children, 
  className, 
  hover = true, 
  glow = false,
  gradient = 'none' 
}: ModernCardProps) {
  return (
    <Card className={cn(
      "relative backdrop-blur-sm transition-all duration-300",
      gradientClasses[gradient],
      hover && "hover:scale-[1.02] hover:shadow-xl",
      glow && "shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20",
      className
    )}>
      {children}
    </Card>
  );
}

interface ModernCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernCardHeader({ children, className }: ModernCardHeaderProps) {
  return (
    <CardHeader className={cn("pb-3", className)}>
      {children}
    </CardHeader>
  );
}

interface ModernCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernCardContent({ children, className }: ModernCardContentProps) {
  return (
    <CardContent className={cn(className)}>
      {children}
    </CardContent>
  );
}

interface ModernCardTitleProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export function ModernCardTitle({ children, className, gradient = false }: ModernCardTitleProps) {
  return (
    <CardTitle className={cn(
      "text-xl font-bold",
      gradient && "bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent",
      !gradient && "text-white",
      className
    )}>
      {children}
    </CardTitle>
  );
}

interface ModernCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernCardDescription({ children, className }: ModernCardDescriptionProps) {
  return (
    <CardDescription className={cn("text-gray-400", className)}>
      {children}
    </CardDescription>
  );
} 