import { CheckCircle2, TrendingUp, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";

// Recibimos 'invoices' por props. Si no viene nada, usamos array vacío []
export function ActivityFeed({ loading, invoices = [] }) {

    if (loading) {
        return (
            // ... (Mantené tu Skeleton Loader igual que antes) ...
            <Card className="h-full border-slate-200/60 shadow-sm flex flex-col">
                <CardHeader className="pb-2">
                    <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
                </CardHeader>
                <CardContent className="flex-1 pt-6">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-slate-200/60 h-full flex flex-col hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 bg-white">
            <CardHeader className="pb-4 border-b border-slate-100/80">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-heading font-bold text-lg text-slate-900">Actividad Reciente</CardTitle>
                        <p className="text-sm text-slate-500 font-medium mt-1">Últimos movimientos de caja.</p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                        {invoices.length} nuevos
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col pt-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 py-4 space-y-3">
                    {/* Renderizado Dinámico */}
                    {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all duration-200">
                            <div className="flex items-center space-x-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border shadow-sm
                                    ${inv.status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : ''}
                                    ${inv.status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-600' : ''}
                                    ${inv.status === 'overdue' ? 'bg-rose-50 border-rose-100 text-rose-600' : ''}
                                `}>
                                    {inv.status === 'paid' && <CheckCircle2 className="h-5 w-5" />}
                                    {inv.status === 'pending' && <Clock className="h-5 w-5" />}
                                    {inv.status === 'overdue' && <AlertCircle className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold font-heading text-slate-900">{inv.client}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{inv.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold font-mono text-sm text-slate-900">{inv.amount}</span>
                            </div>
                        </div>
                    ))}

                    {/* Empty State por si no hay datos */}
                    {invoices.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            No hay movimientos recientes.
                        </div>
                    )}
                </div>

                <div className="pt-4 mt-auto border-t border-slate-100">
                    <Button variant="ghost" className="w-full text-xs font-bold text-slate-500 hover:text-primary group">
                        Ver historial completo
                        <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}