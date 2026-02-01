import { Routes, Route } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import CRMPage from "../features/crm/pages/CRMPage";
import BillingPage from "../features/billing/pages/BillingPage";
import FinancePage from "../features/finance/pages/FinancePage";

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="crm" element={<CRMPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="settings" element={<div className="p-4">Settings Placeholder</div>} />
                {/* Fallback for 404 */}
                <Route path="*" element={<div className="p-4">404 Not Found</div>} />
            </Route>
        </Routes>
    );
}
