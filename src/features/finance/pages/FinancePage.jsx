import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tesorería</h1>
                <p className="text-slate-500 mt-2">Control de caja y flujos financieros.</p>
            </div>
            <Card>
                <CardHeader><CardTitle>Cashflow</CardTitle></CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">Positivo</div>
                </CardContent>
            </Card>
        </div>
    );
}
