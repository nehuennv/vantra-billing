import { Button } from "../../../../components/ui/Button";

export function DashboardHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200/60">
            <div>
                <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1 font-medium">Resumen financiero y operativo en tiempo real.</p>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" className="shadow-sm border-slate-200/60 text-slate-600">
                    Descargar Reporte
                </Button>
                <Button className="shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                    Nueva Factura
                </Button>
            </div>
        </div>
    );
}