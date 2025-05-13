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
          title: 'Error',
          description: 'Failed to load availability data.',
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
        title: 'Deleted',
        description: 'Availability entry has been removed',
      });
    } catch (error) {
      console.error('Failed to delete availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the entry',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Current Availabilities</CardTitle>
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
          <CardTitle>Current Availabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            No availabilities have been added yet. Add your first one above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Current Availabilities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
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
                      {availability.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(availability.id)}
                      aria-label="Delete entry"
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