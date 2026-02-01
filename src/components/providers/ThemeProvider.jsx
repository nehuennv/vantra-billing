import { useEffect } from 'react';
import { clientConfig } from '../../config/client';

function hexToHsl(hex) {
    // Remove hash if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Format as space-separated values for Tailwind v4 compatibility
    // e.g., "222.2 47.4% 11.2%"
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

export function ThemeProvider({ children }) {
    useEffect(() => {
        const root = document.documentElement;

        // Iterate over all colors in the config
        Object.entries(clientConfig.colors).forEach(([key, value]) => {
            // Check if value is a hex string
            if (value.startsWith('#')) {
                const hslValue = hexToHsl(value);
                root.style.setProperty(`--${key}`, hslValue);
            } else {
                // Fallback if user still uses HSL string or other format
                root.style.setProperty(`--${key}`, value);
            }
        });

    }, []);

    return children;
}
