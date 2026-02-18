import { useState } from "react";
import { PageTransition } from "../../../components/common/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Save, User, CreditCard, Bell, Shield, Mail, Download, Lock } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useSettings } from "../../../hooks/useSettings";
import { useToast } from "../../../hooks/useToast";
import { authAPI } from "../../../services/apiClient";
import { fetchAllData, downloadFile, generateClientsCSV, generateInvoicesCSV, convertArrayToCSV } from "../utils/exportUtils";

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
    const [exportLoading, setExportLoading] = useState(false);

    const handleExport = async (entity, format) => {
        setExportLoading(true);
        try {
            // We always fetch fresh data to ensure backup is up-to-date
            const data = await fetchAllData();
            const dateStr = new Date().toISOString().split('T')[0];

            let content = null;
            let filename = `vantra_${entity}_${dateStr}`;
            let mimeType = 'text/plain';

            if (format === 'json') {
                mimeType = 'application/json';
                filename += '.json';

                if (entity === 'full') {
                    content = JSON.stringify(data, null, 2);
                } else if (entity === 'clients') {
                    content = JSON.stringify(data.clients, null, 2);
                } else if (entity === 'invoices') {
                    content = JSON.stringify(data.invoices, null, 2);
                } else if (entity === 'catalog') {
                    content = JSON.stringify({ catalog: data.catalog, combos: data.combos }, null, 2);
                }
            } else if (format === 'csv') {
                mimeType = 'text/csv';
                filename += '.csv';

                if (entity === 'clients') {
                    content = generateClientsCSV(data.clients);
                } else if (entity === 'invoices') {
                    content = generateInvoicesCSV(data.invoices);
                }
            }

            if (content) {
                downloadFile(content, filename, mimeType);
                toast.success(`Exportación de ${entity} (${format}) completada`);
            } else {
                throw new Error("Formato o entidad no soportada");
            }

        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Error al exportar datos", {
                description: error.message
            });
        } finally {
            setExportLoading(false);
        }
    };

    const handleSave = async (section) => {
        setLoading(true);

        try {
            if (section === 'profile') {
                // 1. Send ONLY email to backend (API handles filtering)
                try {
                    await authAPI.updateProfile(formData.profile);
                } catch (apiError) {
                    console.warn("API update failed, proceeding with local update:", apiError);
                    // We suppress the error toast to allow "local simulation" as requested
                }

                // 2. Update Local Storage 'vantra_user' (Session Data)
                // This updates the email locally even if backend failed (temporary logic)
                const currentUser = JSON.parse(localStorage.getItem('vantra_user') || '{}');
                const updatedUser = {
                    ...currentUser,
                    email: formData.profile.email,
                    name: formData.profile.name // Local override
                };
                localStorage.setItem('vantra_user', JSON.stringify(updatedUser));

                // 3. Update 'vantra_settings' (App Settings Context)
                updateSection(section, formData[section]);

                toast.success("Perfil actualizado", {
                    description: "Los cambios se han guardado."
                });
            } else {
                // Other sections simulate API delay for now
                await new Promise(r => setTimeout(r, 800));
                updateSection(section, formData[section]);
                toast.success("Configuración actualizada correctamente");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Error al guardar", {
                description: error.message || "No se pudo actualizar el perfil."
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        // Validation
        if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
            toast.error("Todos los campos son obligatorios");
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        if (passwordData.new.length < 8) {
            toast.error("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        try {
            setLoading(true);

            await authAPI.changePassword({
                currentPassword: passwordData.current,
                newPassword: passwordData.new
            });

            toast.success("Contraseña actualizada correctamente");
            setPasswordData({ current: "", new: "", confirm: "" });
        } catch (error) {
            console.error("Error updating password:", error);
            const msg = error.status === 401
                ? "La contraseña actual es incorrecta"
                : (error.message || "Error al actualizar la contraseña");
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition className="space-y-6 pb-20">
            {/* --- TOP LEVEL TABS --- */}
            <div className="flex items-center space-x-8 border-b border-slate-200 mb-8 overflow-x-auto">
                {Tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 ${isActive
                                ? 'text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeSettingsTab"
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* --- ACTION HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">
                        {Tabs.find(t => t.id === activeTab)?.label || 'Configuración'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        Administra tus preferencias y cuenta.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 max-w-4xl">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
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

                                    <div className="pt-4 border-t border-slate-100 mt-8">
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
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <Download className="w-5 h-5 text-slate-400" />
                                                Gestión de Datos
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Exporta tu información en diferentes formatos para respaldo o análisis.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                                        {/* 1. Full Backup */}
                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Shield className="w-4 h-4 text-green-600" />
                                                    <h4 className="font-semibold text-slate-900">Backup Completo de Sistema</h4>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Todos los registros (Clientes, Facturas, Catálogo, Servicios). Ideal para restauración.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleExport('full', 'json')}
                                                    size="sm"
                                                    variant="default"
                                                    className="gap-2"
                                                    disabled={exportLoading}
                                                >
                                                    {exportLoading ? "..." : <><Download className="w-3 h-3" /> JSON Completo</>}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* 2. Clients */}
                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="w-4 h-4 text-blue-600" />
                                                    <h4 className="font-semibold text-slate-900">Clientes</h4>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Base de datos de clientes y sus detalles de contacto.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleExport('clients', 'json')}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={exportLoading}
                                                >
                                                    JSON
                                                </Button>
                                                <Button
                                                    onClick={() => handleExport('clients', 'csv')}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={exportLoading}
                                                >
                                                    CSV (Excel)
                                                </Button>
                                            </div>
                                        </div>

                                        {/* 3. Invoices */}
                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CreditCard className="w-4 h-4 text-purple-600" />
                                                    <h4 className="font-semibold text-slate-900">Facturas</h4>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Historial de facturación, montos y estados.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleExport('invoices', 'json')}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={exportLoading}
                                                >
                                                    JSON
                                                </Button>
                                                <Button
                                                    onClick={() => handleExport('invoices', 'csv')}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={exportLoading}
                                                >
                                                    CSV (Excel)
                                                </Button>
                                            </div>
                                        </div>

                                        {/* 4. Catalog */}
                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-4 h-4 rounded bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">C</div>
                                                    <h4 className="font-semibold text-slate-900">Catálogo y Combos</h4>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Lista de precios, productos y paquetes configurados.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleExport('catalog', 'json')}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={exportLoading}
                                                >
                                                    JSON
                                                </Button>
                                            </div>
                                        </div>
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
        </PageTransition>
    );
}
