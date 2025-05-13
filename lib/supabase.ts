import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type Availability = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_available: boolean;
  created_at: string;
};

export async function fetchAvailabilities(): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availabilities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function addAvailability(
  name: string,
  startDate: Date,
  endDate: Date,
  isAvailable: boolean
): Promise<Availability> {
  const { data, error } = await supabase
    .from('availabilities')
    .insert([
      {
        name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_available: isAvailable,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAvailability(
  id: string,
  name: string,
  startDate: Date,
  endDate: Date,
  isAvailable: boolean
): Promise<Availability> {
  const { data, error } = await supabase
    .from('availabilities')
    .update({
      name,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_available: isAvailable,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAvailability(id: string): Promise<void> {
  const { error } = await supabase.from('availabilities').delete().eq('id', id);
  if (error) throw new Error(error.message);
}