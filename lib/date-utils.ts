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
  availabilities: Availability[],
  users: { id: string; user_metadata: { username?: string } }[]
): { startDate: string; endDate: string }[] {
  // First, extract all available periods
  const availablePeriods = availabilities.filter((a) => a.is_available);
  if (availablePeriods.length === 0) return [];

  // Group availabilities by person (username)
  const personAvailabilities = new Map<string, Availability[]>();
  availabilities.forEach((avail) => {
    const userObj = users.find(u => u.id === avail.user_id);
    const username = userObj?.user_metadata?.username || 'Inconnu';
    if (!personAvailabilities.has(username)) {
      personAvailabilities.set(username, []);
    }
    personAvailabilities.get(username)!.push(avail);
  });
  const allPeople = Array.from(personAvailabilities.keys());

  // Create a day-by-day availability map
  const dayAvailability = new Map<string, Set<string>>();
  availabilities.forEach((avail) => {
    const userObj = users.find(u => u.id === avail.user_id);
    const username = userObj?.user_metadata?.username || 'Inconnu';
    const startDate = parseISO(avail.start_date);
    const endDate = parseISO(avail.end_date);
    let currentDate = startDate;
    while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      if (!dayAvailability.has(dateKey)) {
        dayAvailability.set(dateKey, new Set());
      }
      if (avail.is_available) {
        dayAvailability.get(dateKey)!.add(username);
      } else {
        dayAvailability.get(dateKey)!.delete(username);
      }
      currentDate = addDays(currentDate, 1);
    }
  });

  // Find days where everyone is available
  const commonDays: string[] = [];
  dayAvailability.forEach((people, dateKey) => {
    if (people.size === allPeople.length) {
      commonDays.push(dateKey);
    }
  });
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
        commonRanges.push({ startDate: rangeStart, endDate: currentDate });
        rangeStart = nextDate;
      }
      currentDate = nextDate;
    }
    commonRanges.push({ startDate: rangeStart, endDate: currentDate });
  }
  return commonRanges;
}