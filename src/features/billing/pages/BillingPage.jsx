import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facturación</h1>
                <p className="text-slate-500 mt-2">Gestiona facturas recurrentes y ventas puntuales.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader><CardTitle>Ingresos del Mes</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
