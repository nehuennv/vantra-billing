import React from "react";

function Skeleton({ className, ...props }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-primary/10 mix-blend-multiply ${className}`}
            {...props}
        />
    );
}

export { Skeleton };
