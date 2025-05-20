'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { fetchAvailabilities, addAvailability, deleteAvailability, fetchUsers } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'fr': fr,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

export function AvailabilityForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [data, usersData] = await Promise.all([
        fetchAvailabilities(),
        fetchUsers()
      ]);
      setUsers(usersData);
      setEvents(data.map(a => {
        const userObj = usersData.find((u: any) => u.id === a.user_id);
        const username = userObj?.user_metadata?.username || 'Inconnu';
        return {
          id: a.id,
          title: username === user?.user_metadata.username ? 'Moi' : username,
          start: new Date(a.start_date),
          end: new Date(a.end_date),
          allDay: true,
          isMine: username === user?.user_metadata.username,
          nb: 1 // à améliorer pour compter le nombre de personnes par jour
        };
      }));
      setLoading(false);
    };
    load();
  }, [user?.user_metadata.username]);

  const handleSelectSlot = async ({ start, end }: { start: Date, end: Date }) => {
    try {
      await addAvailability(
        user?.id || '',
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0],
        true
      );
      toast({ title: 'Succès', description: 'Disponibilité ajoutée' });
      onSuccess();
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter la disponibilité', variant: 'destructive' });
    }
  };

  const handleSelectEvent = async (event: any) => {
    if (event.isMine) {
      try {
        await deleteAvailability(event.id);
        toast({ title: 'Supprimé', description: 'Disponibilité supprimée' });
        onSuccess();
      } catch (e) {
        toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Sélectionnez vos jours de disponibilité</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: 500 }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            views={['month']}
            messages={{
              next: 'Suivant',
              previous: 'Précédent',
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Heure',
              event: 'Disponibilité',
              noEventsInRange: 'Aucune disponibilité',
            }}
            popup
            allDayAccessor={() => true}
            style={{ background: '#fff' }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">Cliquez et glissez pour sélectionner vos jours. Cliquez sur vos propres disponibilités pour les supprimer.</p>
      </CardContent>
    </Card>
  );
}