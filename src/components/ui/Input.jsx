import { cn } from "./Button";

export function Input({ className, type, ...props }) {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300",
                className
            )}
            {...props}
        />
    );
}
