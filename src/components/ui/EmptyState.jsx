import React from 'react';
import { Button } from './Button';

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = '' }) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 ${className}`}>
            {Icon && (
                <div className="bg-white p-3 shadow-sm rounded-full mb-4">
                    <Icon className="h-6 w-6 text-slate-400" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {title}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6 text-balance">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button variant="outline" onClick={onAction} className="bg-white hover:bg-slate-50">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
