'use client';

import { useEffect, useState } from 'react';
import { Availability } from '@/lib/supabase';
import { calculateCommonAvailableDates, formatDate } from '@/lib/date-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarDays, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

type CommonAvailabilityProps = {
  availabilities: Availability[];
};

export function CommonAvailability({ availabilities }: CommonAvailabilityProps) {
  const [commonDates, setCommonDates] = useState<{ startDate: string; endDate: string }[]>([]);
  const [uniquePeople, setUniquePeople] = useState<string[]>([]);

  useEffect(() => {
    const common = calculateCommonAvailableDates(availabilities);
    setCommonDates(common);
    
    // Calculate unique people
    const peopleSet = new Set<string>();
    availabilities.forEach(a => peopleSet.add(a.name));
    setUniquePeople(Array.from(peopleSet));
  }, [availabilities]);

  if (availabilities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Common Available Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>No data yet</AlertTitle>
            <AlertDescription>
              Add availability information above to see when everyone is available.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Common Available Dates</CardTitle>
        <Badge variant="outline" className="ml-2">
          <Users className="mr-1 h-3 w-3" />
          {uniquePeople.length} {uniquePeople.length === 1 ? 'Person' : 'People'}
        </Badge>
      </CardHeader>
      <CardContent>
        {commonDates.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Everyone is available during these periods:
            </p>
            <div className="grid gap-2">
              {commonDates.map((range, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center p-3 bg-primary/5 rounded-lg"
                >
                  <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                  <span>
                    <span className="font-medium">
                      {formatDate(new Date(range.startDate))}
                    </span>
                    {' '} to {' '}
                    <span className="font-medium">
                      {formatDate(new Date(range.endDate))}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <CalendarDays className="h-4 w-4" />
            <AlertTitle>No common dates found</AlertTitle>
            <AlertDescription>
              Unfortunately, there are no dates when everyone is available. Try adjusting your availability periods.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="font-medium">Participants:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {uniquePeople.map((person) => (
              <Badge key={person} variant="secondary">
                {person}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}