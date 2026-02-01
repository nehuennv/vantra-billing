import { cn } from "./Button";

export function Badge({ className, variant = "default", ...props }) {
    const variants = {
        default: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        destructive: "border-transparent bg-rose-50 text-rose-700 hover:bg-rose-100",
        outline: "text-foreground border-slate-200",
        success: "border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        warning: "border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100",
        info: "border-transparent bg-sky-50 text-sky-700 hover:bg-sky-100",
    };
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
