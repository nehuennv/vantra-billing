import { useState } from "react";
import { PageTransition } from "../../../components/common/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Save, User, CreditCard, Bell, Shield, Mail, Download, Lock } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useSettings } from "../../../hooks/useSettings";
import { useToast } from "../../../hooks/useToast";

const Tabs = [
    { id: "profile", label: "Perfil", icon: User },
    // { id: "company", label: "Empresa", icon: Building }, // Keeping simple for now as per request
    { id: "billing", label: "Facturación", icon: CreditCard },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "security", label: "Seguridad", icon: Shield },
    { id: "data", label: "Datos", icon: Download },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");
    const { settings, updateSection, exportData } = useSettings();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Local state for forms to allow independent editing before saving
    const [formData, setFormData] = useState(settings);

    // Password State
    const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });

    const handleSave = async (section) => {
        setLoading(true);
        // Simulate API delay
        await new Promise(r => setTimeout(r, 800));

        updateSection(section, formData[section]);
        setLoading(false);
        toast.success("Configuración actualizada correctamente");
    };

    const handlePasswordChange = async () => {
        if (passwordData.new !== passwordData.confirm) {
            toast.error("Las contraseñas no coinciden");
            return;
        }
        if (passwordData.new.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setLoading(false);
        toast.success("Contraseña modificada con éxito");
        setPasswordData({ current: "", new: "", confirm: "" });
    };

    return (
        <PageTransition className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <header className="flex-none">
                <h1 className="text-3xl font-heading font-bold text-slate-900">Configuración</h1>
                <p className="text-slate-500 mt-1">Administra tus preferencias y cuenta.</p>
            </header>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 flex-shrink-0 overflow-y-auto p-1">
                    <nav className="space-y-1">
                        {Tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none
                                        ${isActive
                                            ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
                                        }`}
                                >
                                    <Icon className={isActive ? "text-primary" : "text-slate-400"} size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8 min-h-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-4xl" // Constrain content width for readability
                            >
                                {activeTab === "profile" && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-slate-400" />
                                            Perfil de Usuario
                                        </h3>
                                        <div className="flex items-center gap-6 mb-8">
                                            <div className="h-20 w-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-2xl font-bold">
                                                {formData.profile.name.charAt(0)}
                                            </div>
                                            <div>
                                                <Button variant="outline" size="sm">Cambiar Avatar</Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 max-w-lg">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={formData.profile.name}
                                                    onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, name: e.target.value } })}
                                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-700">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.profile.email}
                                                    onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, email: e.target.value } })}
                                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button onClick={() => handleSave('profile')} disabled={loading}>
                                                {loading ? "Guardando..." : "Guardar Perfil"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "billing" && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-slate-400" />
                                            Preferencias de Facturación
                                        </h3>
                                        <div className="grid gap-5 max-w-lg">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-700">Moneda Principal</label>
                                                <select
                                                    value={formData.billing.currency}
                                                    onChange={(e) => setFormData({ ...formData, billing: { ...formData.billing, currency: e.target.value } })}
                                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                                                >
                                                    <option value="ARS">ARS (Pesos Argentinos)</option>
                                                    <option value="USD">USD (Dólares Americanos)</option>
                                                    <option value="EUR">EUR (Euros)</option>
                                                </select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-700">Impuesto Default (%)</label>
                                                <input
                                                    type="number"
                                                    value={formData.billing.taxRate}
                                                    onChange={(e) => setFormData({ ...formData, billing: { ...formData.billing, taxRate: Number(e.target.value) } })}
                                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button onClick={() => handleSave('billing')} disabled={loading}>
                                                {loading ? "Guardando..." : "Guardar Preferencias"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "security" && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Lock className="w-5 h-5 text-slate-400" />
                                            Seguridad
                                        </h3>

                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
                                            <p className="text-sm text-orange-800">
                                                Te recomendamos usar una contraseña segura que incluya números y símbolos.
                                            </p>
                                        </div>

                                        <div className="grid gap-5 max-w-lg">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-700">Contraseña Actual</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.current}
                                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-700">Nueva Contraseña</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.new}
                                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium text-slate-700">Confirmar Contraseña</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.confirm}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 focus:bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button onClick={handlePasswordChange} disabled={loading || !passwordData.current || !passwordData.new}>
                                                {loading ? "Actualizando..." : "Actualizar Contraseña"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "data" && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Download className="w-5 h-5 text-slate-400" />
                                            Exportar Datos
                                        </h3>

                                        <p className="text-slate-500 mb-6">
                                            Descarga una copia completa de tu base de datos (clientes, facturas y configuraciones) en formato JSON.
                                            Este archivo puede servir como copia de seguridad.
                                        </p>

                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-900">Backup Completo</h4>
                                                <p className="text-sm text-slate-500 mt-1">Incluye todos los registros actuales.</p>
                                            </div>
                                            <Button onClick={exportData} variant="outline" className="gap-2">
                                                <Download className="w-4 h-4" />
                                                Descargar JSON
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "notifications" && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Bell className="w-5 h-5 text-slate-400" />
                                            Notificaciones
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                { id: "emailAlerts", label: "Alertas por Email", desc: "Recibir notificaciones de sistema y errores críticos.", icon: Mail },
                                                { id: "paymentReminders", label: "Recordatorios de Pago", desc: "Notificar cuando un cliente realice un pago.", icon: CreditCard },
                                                { id: "marketing", label: "Novedades de Producto", desc: "Recibir noticias sobre nuevas funcionalidades.", icon: Bell },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                            <item.icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-sm">{item.label}</div>
                                                            <div className="text-xs text-slate-500">{item.desc}</div>
                                                        </div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.notifications[item.id]}
                                                            onChange={(e) => {
                                                                const newNotifs = { ...formData.notifications, [item.id]: e.target.checked };
                                                                setFormData({ ...formData, notifications: newNotifs });
                                                                // Auto-save for toggles is nice
                                                                updateSection('notifications', newNotifs);
                                                            }}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
