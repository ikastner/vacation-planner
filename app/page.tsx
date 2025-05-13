'use client';

import { useState } from 'react';
import { AvailabilityForm } from '@/components/AvailabilityForm';
import { AvailabilityList } from '@/components/AvailabilityList';
import { CommonAvailability } from '@/components/CommonAvailability';
import { Availability } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Sunset } from 'lucide-react';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDataChange = (data: Availability[]) => {
    setAvailabilities(data);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Sunset className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Vacation Planner</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Coordinate vacation dates with friends by sharing when you're available.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-8">
            <AvailabilityForm onSuccess={handleRefresh} />
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>

            <CommonAvailability availabilities={availabilities} />
          </div>

          <div>
            <AvailabilityList 
              refreshTrigger={refreshTrigger} 
              onDataChange={handleDataChange} 
            />
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            <Calendar className="inline h-4 w-4 mr-1" />
            Find the perfect dates for your next group vacation
          </p>
        </footer>
      </div>
    </main>
  );
}