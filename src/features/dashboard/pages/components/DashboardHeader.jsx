import { Button } from "../../../../components/ui/Button";

export function DashboardHeader() {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">Resumen financiero y operativo en tiempo real.</p>
            </div>
            <div className="flex items-center gap-3">
                <Button variant="outline" className="shadow-sm border-slate-200/60 text-slate-600">
                    Descargar Reporte
                </Button>
                <Button className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground border-0 w-[220px] justify-center">
                    Nueva Factura
                </Button>
            </div>
        </div>
    );
}