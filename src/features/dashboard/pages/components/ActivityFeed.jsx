import { CheckCircle2, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";

const invoices = [
    { id: "INV001", client: "Tech Solutions SA", amount: "$150.000", status: "pending", date: "Hace 2 días" },
    { id: "INV002", client: "Juan Pérez", amount: "$12.500", status: "paid", date: "Hoy" },
    { id: "INV003", client: "Consultorio Norte", amount: "$45.000", status: "overdue", date: "Hace 1 semana" },
    { id: "INV004", client: "Estudio Jurídico M&A", amount: "$78.000", status: "paid", date: "Hace 1 semana" },
    { id: "INV005", client: "Global Ventures", amount: "$230.000", status: "pending", date: "Hace 2 semanas" },
];

export function ActivityFeed({ loading }) {

    if (loading) {
        return (
            <Card className="h-full border-slate-200/60 shadow-sm flex flex-col">
                <CardHeader className="pb-2">
                    <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-4 w-48 bg-slate-50 rounded-md animate-pulse mt-2" />
                </CardHeader>
                <CardContent className="flex-1 pt-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                                        <div className="h-3 w-20 bg-slate-50 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
                            </div>
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
                        <p className="text-sm text-slate-500 font-medium mt-1">Últimos movimientos registrados.</p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                        5 nuevos
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-0">
                <div className="flex-1 overflow-y-auto pr-1 -mr-1 py-2 space-y-2">
                    {invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100/80 cursor-pointer transition-all duration-200">
                            <div className="flex items-center space-x-4">
                                <div className={`h-11 w-11 rounded-full flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-105
                                    ${inv.status === 'paid' ? 'bg-emerald-50 border-emerald-100/50 text-emerald-600' : ''}
                                    ${inv.status === 'pending' ? 'bg-blue-50 border-blue-100/50 text-blue-500' : ''}
                                    ${inv.status === 'overdue' ? 'bg-rose-50 border-rose-100/50 text-rose-600' : ''}
                                `}>
                                    {inv.status === 'paid' && <CheckCircle2 className="h-5 w-5" />}
                                    {inv.status === 'pending' && <TrendingUp className="h-5 w-5" />}
                                    {inv.status === 'overdue' && <AlertCircle className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold font-heading text-slate-900 group-hover:text-indigo-600 transition-colors">{inv.client}</p>
                                    <p className="text-xs text-slate-500 font-bold mt-0.5 opacity-80">{inv.date}</p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                                <span className="block font-bold font-sans text-sm text-slate-900 tracking-tight">{inv.amount}</span>
                                <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'destructive' : 'warning'} className="text-[10px] h-5 px-2 font-bold uppercase tracking-wider">
                                    {inv.status === 'paid' ? 'Pagado' : inv.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-4 mt-auto border-t border-slate-100">
                    <Button variant="ghost" className="w-full text-xs font-bold text-slate-500 hover:text-indigo-600 group">
                        Ver todas las facturas
                        <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}