'use client';

import { useState, useEffect, useMemo } from 'react';
import { AvailabilityForm } from '@/components/AvailabilityForm';
import { AvailabilityList } from '@/components/AvailabilityList';
import { CommonAvailability } from '@/components/CommonAvailability';
import { Availability } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Sunset, LogOut, CalendarDays, Users, Trash2 } from 'lucide-react';
import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { DisponibiliteCalendrier } from '@/components/DisponibiliteCalendrier';
import { addAvailability, fetchAvailabilities, fetchUsers, deleteAvailability } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

function isConsecutive(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [allAvailabilities, setAllAvailabilities] = useState<Availability[]>([]);
  const [commonDates, setCommonDates] = useState<string[]>([]);
  const { isAuthenticated, login, logout, user } = useAuth();
  const { toast } = useToast();
  const [userMap, setUserMap] = useState<Record<string, { username: string, email: string }>>({});

  const allUserIds = Object.keys(userMap);
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDataChange = (data: Availability[]) => {
    setAvailabilities(data);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Tentative de connexion', email, password ? '***' : '');
      await login(email, password);
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Une erreur est survenue lors de la connexion',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Déconnexion réussie',
      description: 'Vous avez été déconnecté avec succès',
    });
  };

  const loadUsers = async () => {
    const users = await fetchUsers();
    const map: Record<string, { username: string, email: string }> = {};
    users.forEach(u => { 
      map[u.id] = { 
        username: u.user_metadata.username || u.email.split('@')[0],
        email: u.email
      };
    });
    setUserMap(map);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const load = async () => {
      const data = await fetchAvailabilities();
      setAllAvailabilities(data);
      const datesByUser: Record<string, Set<string>> = {};
      data.forEach(a => {
        if (!datesByUser[a.user_id]) datesByUser[a.user_id] = new Set();
        let d = new Date(a.start_date);
        const end = new Date(a.end_date);
        while (d <= end) {
          datesByUser[a.user_id].add(d.toLocaleDateString('fr-CA'));
          d.setDate(d.getDate() + 1);
        }
      });
      const allUsers = Object.keys(datesByUser);
      if (allUsers.length === 0) {
        setCommonDates([]);
        return;
      }
      let intersection = Array.from(datesByUser[allUsers[0]]);
      for (let i = 1; i < allUsers.length; i++) {
        intersection = intersection.filter(date => datesByUser[allUsers[i]].has(date));
      }
      setCommonDates(intersection.sort());
    };
    load();
  }, [refreshTrigger]);

  // Récupérer les jours déjà enregistrés pour l'utilisateur connecté
  const userAvailabilities = allAvailabilities.filter(a => a.user_id === user?.id);
  const disabledDates: Date[] = [];
  userAvailabilities.forEach(a => {
    let d = new Date(a.start_date);
    const end = new Date(a.end_date);
    while (d <= end) {
      disabledDates.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
  });

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <Sunset className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold tracking-tight">Planificateur de Vacances</h1>
          </div>
          <LoginForm onLogin={handleLogin} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Menu profil en haut à droite */}
      <div className="w-full flex justify-end items-center px-8 pt-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full bg-gray-200 w-10 h-10 flex items-center justify-center font-bold text-lg text-primary shadow hover:bg-gray-300 transition">
              {userMap[user?.id || '']?.username?.[0]?.toUpperCase() || "?"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-12">
          <DisponibiliteCalendrier 
            onSave={async (dates) => {
              if (!user?.id) {
                toast({ title: "Erreur", description: "Utilisateur non connecté", variant: "destructive" });
                return;
              }
              try {
                // Supprimer toutes les anciennes disponibilités de l'utilisateur
                const userAvailabilities = allAvailabilities.filter(a => a.user_id === user.id);
                for (const avail of userAvailabilities) {
                  console.log('Suppression de', avail.id);
                  await deleteAvailability(avail.id);
                }
                // Ajouter les nouvelles dates
                for (const date of dates) {
                  const yyyyMMdd = format(date, 'yyyy-MM-dd');
                  console.log('Ajout de', yyyyMMdd, 'pour user', user.id);
                  await addAvailability(user.id, yyyyMMdd, yyyyMMdd, true);
                }
                toast({ title: 'Disponibilités enregistrées !' });
                handleRefresh();
                await loadUsers();
              } catch (e) {
                toast({ 
                  title: 'Erreur', 
                  description: e instanceof Error ? e.message : String(e), 
                  variant: 'destructive' 
                });
              }
            }} 
            disabledDates={disabledDates} 
          />
        </div>

        {/* Liste des jours saisis par l'utilisateur connecté */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold mb-2 text-[hsl(var(--primary))]">Mes jours saisis</h3>
          <div className="flex flex-wrap gap-2">
            {userAvailabilities.length === 0 && (
              <span className="text-[hsl(var(--primary)/0.5)] text-xs">Aucune saisie pour l'instant.</span>
            )}
            {userAvailabilities.map(avail => {
              let days = [];
              let d = new Date(avail.start_date);
              const end = new Date(avail.end_date);
              while (d <= end) {
                days.push(format(d, "yyyy-MM-dd"));
                d.setDate(d.getDate() + 1);
              }
              return days.map(day => (
                <span key={avail.id + day} className="inline-flex items-center bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] rounded px-2 py-1 text-xs font-medium">
                  {day}
                  <button
                    className="ml-1 text-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--primary))]"
                    onClick={async () => {
                      await deleteAvailability(avail.id);
                      handleRefresh();
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ));
            })}
          </div>
        </div>

        {/* Planning des disponibilités */}
        <div className="overflow-x-auto w-full">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[hsl(var(--primary))]">
            <Users className="w-6 h-6 text-[hsl(var(--primary))]" /> 
            Planning des disponibilités
          </h2>
          {allAvailabilities.length === 0 ? (
            <p className="text-[hsl(var(--primary)/0.5)]">Aucune disponibilité enregistrée.</p>
          ) : (
            (() => {
              const users = Array.from(new Set(allAvailabilities.map(a => a.user_id)));
              let minDate = new Date(Math.min(...allAvailabilities.map(a => new Date(a.start_date).getTime())));
              let maxDate = new Date(Math.max(...allAvailabilities.map(a => new Date(a.end_date).getTime())));
              const days: string[] = [];
              let d = new Date(minDate);
              while (d <= maxDate) {
                days.push(format(d, 'yyyy-MM-dd'));
                d.setDate(d.getDate() + 1);
              }
              const daysByUser: Record<string, Set<string>> = {};
              allAvailabilities.forEach(a => {
                if (!daysByUser[a.user_id]) daysByUser[a.user_id] = new Set();
                let d = new Date(a.start_date);
                const end = new Date(a.end_date);
                while (d <= end) {
                  daysByUser[a.user_id].add(format(d, 'yyyy-MM-dd'));
                  d.setDate(d.getDate() + 1);
                }
              });

              // Calculer les jours où au moins une personne est disponible
              const daysWithAvailability = days.filter(date => 
                users.some(u => daysByUser[u]?.has(date))
              );

              // Grouper les jours consécutifs
              const groupedDays = daysWithAvailability.reduce((groups: string[][], day) => {
                const lastGroup = groups[groups.length - 1];
                if (!lastGroup || !isConsecutive(lastGroup[lastGroup.length - 1], day)) {
                  groups.push([day]);
                } else {
                  lastGroup.push(day);
                }
                return groups;
              }, []);

              return (
                <>
                  {/* Périodes avec disponibilités */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[hsl(var(--primary))]">
                      <Calendar className="w-5 h-5 text-[hsl(var(--primary))]" />
                      Périodes avec disponibilités
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedDays.map((group, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow border border-[hsl(var(--primary)/0.2)]">
                          <div className="font-medium text-sm text-[hsl(var(--primary)/0.6)] mb-2">
                            {format(new Date(group[0]), 'dd MMM yyyy')} - {format(new Date(group[group.length - 1]), 'dd MMM yyyy')}
                          </div>
                          <div className="space-y-2">
                            {users.map(userId => {
                              const availableDays = group.filter(day => daysByUser[userId]?.has(day));
                              if (availableDays.length > 0) {
                                return (
                                  <div key={userId} className="flex items-center gap-2 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] flex items-center justify-center font-medium">
                                      {userMap[userId]?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-[hsl(var(--primary))]">
                                      {userMap[userId]?.username || userId}
                                    </span>
                                    <span className="text-[hsl(var(--primary)/0.6)]">
                                      ({availableDays.length} jours)
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tableau des disponibilités */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-20 bg-[hsl(var(--primary)/0.04)] px-4 py-3 font-medium text-[hsl(var(--primary))] text-left border-r border-[hsl(var(--primary)/0.2)]">
                          </th>
                          {days.map(date => {
                            const formattedDate = format(new Date(date), 'dd');
                            const isCommon = users.every(u => daysByUser[u]?.has(date));
                            const hasAnyAvailability = users.some(u => daysByUser[u]?.has(date));
                            return (
                              <th key={date} className="px-2 py-3 font-medium text-[hsl(var(--primary)/0.6)] text-center min-w-[60px]">
                                <div className={`rounded-full w-8 h-8 mx-auto flex items-center justify-center text-xs ${
                                  isCommon ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]' : 
                                  hasAnyAvailability ? 'bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]' : 
                                  'bg-[hsl(var(--primary)/0.04)] text-[hsl(var(--primary)/0.4)]'
                                }`}>
                                  {formattedDate}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(userId => (
                          <tr key={userId}>
                            <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-[hsl(var(--primary))] text-left border-r border-[hsl(var(--primary)/0.2)]">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] flex items-center justify-center font-medium">
                                  {userMap[userId]?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span>{userMap[userId]?.username || userId}</span>
                              </div>
                            </td>
                            {days.map(date => {
                              const isAvailable = daysByUser[userId]?.has(date);
                              const isCommon = users.every(u => daysByUser[u]?.has(date));
                              const hasAnyAvailability = users.some(u => daysByUser[u]?.has(date));
                              return (
                                <td key={date} className={`px-2 py-2 text-center text-xs font-medium ${
                                  isCommon ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]' : 
                                  isAvailable ? 'bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]' : 
                                  'bg-[hsl(var(--primary)/0.04)] text-[hsl(var(--primary)/0.4)]'
                                }`}>
                                  {isAvailable ? 'A' : ''}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 text-sm text-[hsl(var(--primary)/0.6)] flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--primary)/0.15)]"></div>
                      <span>Tous disponibles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[hsl(var(--primary)/0.08)]"></div>
                      <span>Certains disponibles</span>
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </div>
    </main>
  );
}