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
  user_id: string;
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
  userId: string,
  startDate: string,
  endDate: string,
  isAvailable: boolean
): Promise<Availability> {
  const { data, error } = await supabase
    .from('availabilities')
    .insert([
      {
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        is_available: isAvailable,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase addAvailability:', error);
    throw new Error(error.message);
  }
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

export type User = {
  id: string;
  email: string;
  user_metadata: {
    username?: string;
  };
};

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata
  };
}

type DbUser = {
  id: string;
  email: string;
  username: string;
};

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .rpc('get_users') as { data: DbUser[] | null, error: any };

  if (error) throw new Error(error.message);
  return (data || []).map(user => ({
    id: user.id,
    email: user.email,
    user_metadata: { username: user.username }
  }));
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });
  if (error) throw error;
  
  // Connexion automatique après l'inscription
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) throw signInError;
  return signInData;
}