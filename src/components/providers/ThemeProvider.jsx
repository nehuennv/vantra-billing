import { useEffect, useCallback } from 'react';
import { clientConfig } from '../../config/client';

function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');

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
        h = s = 0;
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

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

function getEffectiveColors() {
    // Start with config defaults
    const colors = { ...clientConfig.colors };

    // Override primary if user has set a custom color in localStorage
    try {
        const stored = JSON.parse(localStorage.getItem('vantra_settings') || 'null');
        if (stored?.appearance?.primaryColor) {
            colors.primary = stored.appearance.primaryColor;
        }
    } catch (e) {
        // Ignore parse errors
    }

    return colors;
}

function applyColors() {
    const root = document.documentElement;
    const colors = getEffectiveColors();

    Object.entries(colors).forEach(([key, value]) => {
        if (value.startsWith('#')) {
            root.style.setProperty(`--${key}`, hexToHsl(value));
        } else {
            root.style.setProperty(`--${key}`, value);
        }
    });
}

export function ThemeProvider({ children }) {
    // Apply colors on mount
    useEffect(() => {
        applyColors();
    }, []);

    // Listen for storage events (fired by useSettings when saving)
    useEffect(() => {
        const handleStorageChange = () => {
            applyColors();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return children;
}
