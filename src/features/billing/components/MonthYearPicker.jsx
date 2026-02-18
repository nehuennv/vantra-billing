import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/Button';

export function MonthYearPicker({ value, onChange, className }) {
    // value format: "YYYY-MM"
    const [year, month] = value.split('-').map(Number);

    // Ensure we are working with valid numbers
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || (new Date().getMonth() + 1);

    const updateDate = (newYear, newMonth) => {
        onChange(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
    };

    const handlePrevMonth = () => {
        let newMonth = currentMonth - 1;
        let newYear = currentYear;
        if (newMonth < 1) {
            newMonth = 12;
            newYear -= 1;
        }
        updateDate(newYear, newMonth);
    };

    const handleNextMonth = () => {
        let newMonth = currentMonth + 1;
        let newYear = currentYear;
        if (newMonth > 12) {
            newMonth = 1;
            newYear += 1;
        }
        updateDate(newYear, newMonth);
    };

    const handlePrevYear = () => {
        updateDate(currentYear - 1, currentMonth);
    };

    const handleNextYear = () => {
        updateDate(currentYear + 1, currentMonth);
    };

    // Format Month Name
    const monthName = new Intl.DateTimeFormat('es-AR', {
        month: 'long'
    }).format(new Date(currentYear, currentMonth - 1));

    const displayMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return (
        <div className={cn("flex flex-col sm:flex-row gap-2 w-full", className)}>
            {/* Control de Mes */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    type="button"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2 px-2 selection:bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary mb-0.5" />
                    <span className="font-semibold text-slate-700 min-w-[100px] text-center select-none capitalize">
                        {displayMonth}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    type="button"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Control de Año */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full sm:w-auto min-w-[140px]">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevYear}
                    className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    type="button"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <span className="font-bold text-slate-700 select-none">
                    {currentYear}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextYear}
                    className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    type="button"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
