import { useState, useEffect } from "react";

const STORAGE_KEY = "vantra_settings";

const defaultSettings = {
    profile: {
        name: "Gaston Puleio",
        email: "[EMAIL_ADDRESS]",
        avatar: null // Future use
    },
    billing: {
        currency: "ARS",
        taxRate: 21
    },
    notifications: {
        emailAlerts: true,
        paymentReminders: true,
        marketing: false,
    }
};

export function useSettings() {
    const [settings, setSettings] = useState(() => {
        try {
            const storedSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            const storedUser = JSON.parse(localStorage.getItem("vantra_user") || "null");

            // Base settings merged with stored settings
            const mergedSettings = storedSettings
                ? { ...defaultSettings, ...storedSettings }
                : defaultSettings;

            // Override profile with vantra_user if available (Source of Truth for Auth)
            if (storedUser) {
                mergedSettings.profile = {
                    ...mergedSettings.profile,
                    name: storedUser.name || mergedSettings.profile.name,
                    email: storedUser.email || mergedSettings.profile.email
                };
            }

            return mergedSettings;
        } catch (error) {
            console.error("Failed to load settings:", error);
            return defaultSettings;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        // Dispatch a custom event so other components (Sidebar) can update immediately
        window.dispatchEvent(new Event("storage"));
    }, [settings]);

    const updateSection = (section, data) => {
        setSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
    };

    const exportData = () => {
        const data = {
            clients: JSON.parse(localStorage.getItem("clients") || "[]"),
            invoices: JSON.parse(localStorage.getItem("vantra_invoices") || "[]"),
            catalog: JSON.parse(localStorage.getItem("catalog") || "[]"),
            settings: settings,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vantra_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        settings,
        updateSection,
        exportData
    };
}
