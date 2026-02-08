import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import LoginPage from "../features/auth/pages/LoginPage";
import { MainLayout } from "../components/layout/MainLayout";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import ClientDetailPage from "../features/crm/pages/ClientDetailPage";
import ServicesPage from "../features/services/pages/ServicesPage";

import CRMPage from "../features/crm/pages/CRMPage";
import BillingPage from "../features/billing/pages/BillingPage";
import FinancePage from "../features/finance/pages/FinancePage";
import SettingsPage from "../features/settings/pages/SettingsPage";

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="crm" element={<CRMPage />} />
                    <Route path="crm/clients/:id" element={<ClientDetailPage />} />


                    <Route path="services" element={<ServicesPage />} />
                    <Route path="billing" element={<BillingPage />} />
                    <Route path="finance" element={<FinancePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<div className="p-4">404 Not Found</div>} />
                </Route>
            </Route>
        </Routes>
    );
}