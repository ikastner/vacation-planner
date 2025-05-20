"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { CardContainer, CardBody, CardItem } from "@/components/ui/card-3d";
import { useToast } from "@/hooks/use-toast";
import { BlurReveal } from "@/components/ui/BlurReveal";

export function DisponibiliteCalendrier({ onSave, disabledDates = [], groupAvailabilities = {} }: { onSave: (dates: Date[]) => void, disabledDates?: Date[], groupAvailabilities?: Record<string, string[]> }) {
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
  const { toast } = useToast();
  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);

  // LOG pour vérifier le rendu du composant
  console.log('DisponibiliteCalendrier rendu');

  const handleSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  const handleSave = () => {
    console.log('handleSave appelé, selectedDates =', selectedDates);
    onSave(selectedDates);
    toast({ title: "Disponibilités enregistrées !" });
  };

  // Préparer les modifiers pour colorer les jours groupés
  const groupedDays = Object.keys(groupAvailabilities).map(dateStr => new Date(dateStr));
  const modifiers = { grouped: groupedDays };
  const modifiersClassNames = { grouped: "bg-blue-100 text-blue-700 font-bold" };

  // Gérer le survol d'un jour
  function handleDayMouseEnter(day: Date) {
    const dateStr = day.toISOString().slice(0, 10);
    if (groupAvailabilities[dateStr]) setHoveredDate(dateStr);
    else setHoveredDate(null);
  }
  function handleDayMouseLeave() {
    setHoveredDate(null);
  }

  return (
    <>
      <style jsx global>{`
        .rdp {
          --rdp-cell-size: auto !important;
          --rdp-accent-color: hsl(var(--primary)) !important;
          --rdp-background-color: hsl(var(--card)) !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .rdp-months {
          width: 100% !important;
          justify-content: center !important;
        }
        .rdp-month {
          width: 100% !important;
          max-width: 100% !important;
        }
        .rdp-table {
          width: 100% !important;
          max-width: 100% !important;
        }
        .rdp-cell {
          width: calc(100% / 7) !important;
          height: 3rem !important;
          padding: 0 !important;
        }
        .rdp-head_cell {
          width: calc(100% / 7) !important;
          font-size: 1rem !important;
          font-weight: 500 !important;
          color: hsl(var(--primary)) !important;
          padding: 0.75rem 0 !important;
        }
        .rdp-button {
          width: 100% !important;
          height: 100% !important;
          font-size: 1rem !important;
          border-radius: 0.5rem !important;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #f3f4f6 !important;
        }
        .rdp-day_selected {
          background-color: hsl(var(--primary)) !important;
          color: #fff !important;
        }
        .rdp-day_selected:hover {
          background-color: hsl(var(--primary) / 0.85) !important;
          color: #fff !important;
        }
        .rdp-day_today {
          background-color: hsl(var(--primary) / 0.08) !important;
          color: hsl(var(--primary)) !important;
        }
        .rdp-day_outside {
          color: hsl(var(--primary) / 0.3) !important;
        }
        .rdp-day {
          color: hsl(var(--primary)) !important;
        }
        .rdp-nav {
          padding: 0.5rem 0 !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 1rem !important;
          position: relative !important;
        }
        .rdp-nav_button {
          width: 2rem !important;
          height: 2rem !important;
          min-width: 2rem !important;
          min-height: 2rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 50% !important;
          background-color: hsl(var(--primary) / 0.08) !important;
          color: hsl(var(--primary)) !important;
          transition: all 0.2s !important;
          border: 1px solid hsl(var(--primary) / 0.2) !important;
          cursor: pointer !important;
          z-index: 10 !important;
          margin: 0 !important;
          box-shadow: none !important;
        }
        .rdp-nav_button:hover {
          background-color: hsl(var(--primary) / 0.15) !important;
          transform: scale(1.08) !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
        }
        .rdp-nav_button:active {
          transform: scale(0.95) !important;
        }
        .rdp-caption {
          flex: 1 1 auto !important;
          text-align: center !important;
          font-weight: 600 !important;
          color: hsl(var(--foreground)) !important;
          font-size: 1.2rem !important;
          background: none !important;
          height: auto !important;
          display: block !important;
          line-height: 2rem !important;
          pointer-events: none !important;
        }
        .rdp-nav_button svg {
          width: 1.1rem !important;
          height: 1.1rem !important;
        }
      `}</style>

      <div className="flex flex-col items-center w-full max-w-xl mx-auto mb-6">
          <div className="text-center py-6">
            <BlurReveal duration={1.2} delay={0.2} blur="12px" yOffset={24}>
              <h1 className="text-3xl font-bold text-primary mb-2">Planifiez vos vacances en équipe</h1>
              <p className="text-muted-foreground text-base">Choisissez vos jours de disponibilité et trouvez la meilleure période pour tous.</p>

            </BlurReveal>
          </div>
      </div>

      <CardContainer containerClassName="w-full max-w-xl mx-auto">
        <CardBody>
          <Card className="w-full rounded-2xl shadow-lg border bg-card text-card-foreground overflow-hidden">
            <CardContent className="p-6">
              <CardItem translateZ={30}>
                <div className="w-full">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleSelect}
                    disabled={disabledDates}
                    className="w-full"
                    classNames={{
                      months: "w-full flex justify-center",
                      month: "w-full",
                      table: "w-full",
                      cell: "w-full p-0",
                      head_cell: "w-full",
                      button: "w-full h-full",
                      nav_button: "h-8 w-8 hover:bg-muted rounded-full transition-all duration-200 flex items-center justify-center",
                      nav_button_previous: "",
                      nav_button_next: "",
                      caption: "flex-1 text-center text-lg font-semibold",
                    }}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    onDayMouseEnter={handleDayMouseEnter}
                    onDayMouseLeave={handleDayMouseLeave}
                  />
                </div>
              </CardItem>

              {hoveredDate && groupAvailabilities[hoveredDate] && (
                <CardItem translateZ={40} className="mt-2">
                  <div className="p-2 bg-blue-50 rounded text-xs text-blue-700 shadow">
                    <div className="font-semibold mb-1">Disponible ce jour :</div>
                    <ul>
                      {groupAvailabilities[hoveredDate].map((name, i) => <li key={i}>• {name}</li>)}
                    </ul>
                  </div>
                </CardItem>
              )}

              <CardItem translateZ={60} className="mt-6">
                <InteractiveButton 
                  className="w-full" 
                  onClick={() => { console.log('BTN CLICK'); handleSave(); }}
                  disabled={selectedDates.length === 0}
                >
                  Enregistrer mes disponibilités
                </InteractiveButton>
              </CardItem>
            </CardContent>
          </Card>
        </CardBody>
      </CardContainer>
    </>
  );
} 