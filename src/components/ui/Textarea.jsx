import { cn } from "./Button";

export function Textarea({ className, ...props }) {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all duration-200 ease-out placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-300 resize-y",
                className
            )}
            {...props}
        />
    );
}
