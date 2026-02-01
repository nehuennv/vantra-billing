import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Button({ className, variant = "default", size = "default", ...props }) {
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20",
        outline: "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-slate-100/50 hover:text-slate-900",
        link: "text-primary underline-offset-4 hover:underline",
        white: "bg-white text-slate-900 border border-slate-100 shadow-sm hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/50",
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 p-0",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-heading font-medium ring-offset-white transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 active:shadow-inner",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
}
