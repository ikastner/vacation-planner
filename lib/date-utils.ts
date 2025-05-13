import { Availability } from './supabase';
import { addDays, format, isBefore, isEqual, parseISO } from 'date-fns';

// Helper to parse ISO date strings to Date objects
export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

// Helper to format dates in a user-friendly way
export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

// Calculate dates that are common across all available periods
export function calculateCommonAvailableDates(
  availabilities: Availability[]
): { startDate: string; endDate: string }[] {
  // First, extract all available periods
  const availablePeriods = availabilities.filter((a) => a.is_available);
  
  // If no available periods, return empty array
  if (availablePeriods.length === 0) return [];
  
  // Group availabilities by person
  const personAvailabilities = new Map<string, Availability[]>();
  
  availabilities.forEach((avail) => {
    if (!personAvailabilities.has(avail.name)) {
      personAvailabilities.set(avail.name, []);
    }
    personAvailabilities.get(avail.name)!.push(avail);
  });
  
  // Get all unique people
  const allPeople = Array.from(personAvailabilities.keys());
  
  // Create a day-by-day availability map
  const dayAvailability = new Map<string, Set<string>>();
  
  // For each availability entry
  availabilities.forEach((avail) => {
    const startDate = parseISO(avail.start_date);
    const endDate = parseISO(avail.end_date);
    let currentDate = startDate;
    
    // For each day in the range
    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      
      if (!dayAvailability.has(dateKey)) {
        dayAvailability.set(dateKey, new Set());
      }
      
      // If the person is available on this day, add them to the set
      if (avail.is_available) {
        dayAvailability.get(dateKey)!.add(avail.name);
      } else {
        // If explicitly unavailable, remove them if they were added before
        dayAvailability.get(dateKey)!.delete(avail.name);
      }
      
      currentDate = addDays(currentDate, 1);
    }
  });
  
  // Find days where everyone is available
  const commonDays: string[] = [];
  
  dayAvailability.forEach((people, dateKey) => {
    // Only include days where all people are available
    if (people.size === allPeople.length) {
      commonDays.push(dateKey);
    }
  });
  
  // Sort the common days
  commonDays.sort();
  
  // Convert consecutive days into date ranges
  const commonRanges: { startDate: string; endDate: string }[] = [];
  
  if (commonDays.length > 0) {
    let rangeStart = commonDays[0];
    let currentDate = commonDays[0];
    
    for (let i = 1; i < commonDays.length; i++) {
      const nextDate = commonDays[i];
      const expectedNextDay = format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd');
      
      if (nextDate !== expectedNextDay) {
        // This is a break in the sequence, add the range
        commonRanges.push({
          startDate: rangeStart,
          endDate: currentDate,
        });
        
        // Start a new range
        rangeStart = nextDate;
      }
      
      currentDate = nextDate;
    }
    
    // Add the last range
    commonRanges.push({
      startDate: rangeStart,
      endDate: currentDate,
    });
  }
  
  return commonRanges;
}