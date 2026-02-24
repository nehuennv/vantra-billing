import {
    Hexagon, Shield, Zap, Activity, Command, Ghost, Crown, Anchor, Mountain,
    Globe, Wifi, Phone, Smartphone, Cloud, Server, Radio, Satellite, Router,
    Cable, Tv, Tablet, Laptop, Watch, Headphones, Speaker, MessageCircle,
    Mail, Calendar, Clock, MapPin, Navigation, Compass, Layers, Box, Package,
    Truck, DollarSign, CreditCard, PieChart, BarChart, TrendingUp, Users,
    Briefcase, FileText, Settings, Sliders, Lock, Key, Eye, Search, Menu, Star,
    Heart, Sun, Moon, Droplet, Flame, Leaf
} from 'lucide-react';

export const clientConfig = {
    name: "Global Tech",
    // logo: "/path/to/logo.png", // Optional: if present, overrides name/icon

    // --- LOGOTIPOS DISPONIBLES (Descomenta el que quieras usar) ---

    // > TELECOM & CONECTIVIDAD
    // icon: Globe,       // Planeta / Internet Global
    // icon: Wifi,        // Conexión Inalámbrica
    // icon: Radio,       // Antena / Señal
    // icon: Satellite,   // Satélite / Cobertura
    // icon: Router,      // Router / Hardware
    // icon: Cable,       // Cableado / Fibra Óptica
    // icon: Cloud,       // Nube / Hosting
    // icon: Server,      // Servidor / Data Center

    // > DISPOSITIVOS
    // icon: Phone,       // Teléfono Fijo
    // icon: Smartphone,  // Móvil / App
    // icon: Tv,          // Televisión / Streaming
    // icon: Tablet,      // Tablet
    // icon: Laptop,      // Laptop / Computación

    // > ABSTRACTO & TECH
    // icon: Hexagon,     // Geométrico / Sólido
    // icon: Zap,         // Energía / Velocidad / Potencia
    // icon: Activity,    // Pulso / Monitoreo / Salud
    // icon: Command,     // Sistema / Control
    // icon: Layers,      // Capas / Integración
    // icon: Box,         // Producto / Paquete

    // > SEGURIDAD & CONFIANZA
    // icon: Shield,      // Seguridad / Protección
    // icon: Lock,        // Privacidad / Candado
    // icon: Key,         // Acceso / Llave
    // icon: Eye,         // Vigilancia / Visión

    // > NEGOCIO & FINANZAS
    // icon: Briefcase,   // Negocios / Corporativo
    // icon: TrendingUp,  // Crecimiento / Estadísticas
    // icon: PieChart,    // Analytics / Reportes
    // icon: DollarSign,  // Finanzas / Pagos
    // icon: CreditCard,  // Billing / Tarjeta

    // > OTROS ESTILOS
    // icon: Mountain,    // Aventura / Cima (Default)
    // icon: Anchor,      // Estabilidad / Marítimo
    // icon: Crown,       // Premium / Liderazgo
    // icon: Ghost,       // Lúdico / Joven
    // icon: Star,        // Destacado / Favorito
    // icon: Heart,       // Cuidado / Salud
    icon: Globe,       // Global / Tech World

    colors: {
        primary: "#0ea4e9", // Indigo-600 (Vibrant & Deep)

        // Slavic/Blue-ish dark (HSL)
        // You can add more brand colors here if needed
    }
};

/**
 * Returns the effective primary color hex value.
 * Checks localStorage for user override, falls back to clientConfig default.
 */
export function getPrimaryColor() {
    try {
        const stored = JSON.parse(localStorage.getItem('vantra_settings') || 'null');
        if (stored?.appearance?.primaryColor) {
            return stored.appearance.primaryColor;
        }
    } catch (e) { /* ignore */ }
    return clientConfig.colors.primary;
}
