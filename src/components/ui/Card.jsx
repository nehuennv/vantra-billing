import { cn } from "./Button";

export function Card({ className, ...props }) {
    return (
        <div
            className={cn(
                "rounded-3xl border border-slate-200/60 bg-white text-slate-900 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-slate-200/40",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }) {
    return (
        <div
            className={cn("flex flex-col space-y-1.5 p-6 md:p-8 pb-4", className)}
            {...props}
        />
    );
}

export function CardTitle({ className, ...props }) {
    return (
        <h3
            className={cn(
                "font-heading text-lg font-semibold text-slate-900",
                className
            )}
            {...props}
        />
    );
}

export function CardContent({ className, ...props }) {
    return <div className={cn("p-6 pt-0", className)} {...props} />;
}
