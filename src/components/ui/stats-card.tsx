import React from 'react';
import { ModernCard, ModernCardContent } from './modern-card';
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: 'purple' | 'blue' | 'green' | 'orange' | 'red';
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  gradient = 'purple',
  className 
}: StatsCardProps) {
  const gradientClasses = {
    purple: 'from-purple-600 to-blue-600',
    blue: 'from-blue-600 to-cyan-600',
    green: 'from-green-600 to-emerald-600',
    orange: 'from-orange-600 to-red-600',
    red: 'from-red-600 to-pink-600'
  };

  return (
    <ModernCard 
      gradient={gradient} 
      hover 
      glow 
      className={cn("overflow-hidden", className)}
    >
      <ModernCardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold text-white">{value}</h3>
              {trend && (
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-400" : "text-red-400"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          
          <div className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            `${gradientClasses[gradient]} shadow-${gradient}-500/25`
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Animated background element */}
        <div className={cn(
          "absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-gradient-to-br opacity-10",
          gradientClasses[gradient]
        )} />
      </ModernCardContent>
    </ModernCard>
  );
} 