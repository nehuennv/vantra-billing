import { PageTransition } from "../../../components/common/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";

export default function FinancePage() {
    return (
        <PageTransition className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tesorería</h1>
                    <p className="text-slate-500 mt-1">Control de caja y flujos financieros.</p>
                </div>
                {/* Placeholder for future actions */}
                <div className="flex items-center gap-3"></div>
            </div>
            <Card>
                <CardHeader><CardTitle>Cashflow</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">Positivo</div>
                </CardContent>
            </Card>
        </PageTransition>
    );
}
