'use client';

import { useEffect, useState } from 'react';
import { Availability, deleteAvailability, fetchAvailabilities } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';

type AvailabilityListProps = {
  refreshTrigger: number;
  onDataChange: (availabilities: Availability[]) => void;
};

export function AvailabilityList({ refreshTrigger, onDataChange }: AvailabilityListProps) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadAvailabilities = async () => {
      try {
        setLoading(true);
        const data = await fetchAvailabilities();
        setAvailabilities(data);
        onDataChange(data);
      } catch (error) {
        console.error('Failed to fetch availabilities:', error);
        toast({
          title: 'Erreur',
          description: 'Échec du chargement des données de disponibilité.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadAvailabilities();
  }, [refreshTrigger, toast, onDataChange]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAvailability(id);
      const updatedAvailabilities = availabilities.filter((a) => a.id !== id);
      setAvailabilities(updatedAvailabilities);
      onDataChange(updatedAvailabilities);
      toast({
        title: 'Supprimé',
        description: 'L\'entrée de disponibilité a été supprimée',
      });
    } catch (error) {
      console.error('Failed to delete availability:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression de l\'entrée',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Disponibilités Actuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (availabilities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Disponibilités Actuelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Aucune disponibilité n'a encore été ajoutée. Ajoutez votre première disponibilité ci-dessus !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Disponibilités Actuelles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Date de Début</TableHead>
                <TableHead>Date de Fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availabilities.map((availability) => (
                <TableRow key={availability.id}>
                  <TableCell className="font-medium">{availability.name}</TableCell>
                  <TableCell>{formatDate(new Date(availability.start_date))}</TableCell>
                  <TableCell>{formatDate(new Date(availability.end_date))}</TableCell>
                  <TableCell>
                    <Badge
                      variant={availability.is_available ? 'default' : 'destructive'}
                      className="animate-fade-in"
                    >
                      {availability.is_available ? 'Disponible' : 'Indisponible'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(availability.id)}
                      aria-label="Supprimer l'entrée"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}