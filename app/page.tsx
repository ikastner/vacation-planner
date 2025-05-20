'use client';

import { useState, useEffect, useMemo } from 'react';
import { AvailabilityForm } from '@/components/AvailabilityForm';
import { AvailabilityList } from '@/components/AvailabilityList';
import { CommonAvailability } from '@/components/CommonAvailability';
import { Availability } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Sunset, LogOut, CalendarDays, Users, Trash2, Check } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { ModeToggle } from '@/components/ModeToggle';

function isConsecutive(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export default function Home() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [allAvailabilities, setAllAvailabilities] = useState<Availability[]>([]);
  const [commonDates, setCommonDates] = useState<string[]>([]);
  const { isAuthenticated, logout, user } = useAuth();
  const { toast } = useToast();
  const [userMap, setUserMap] = useState<Record<string, { username: string, email: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attendre un court instant pour laisser le temps à la session de se charger
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const allUserIds = Object.keys(userMap);
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDataChange = (data: Availability[]) => {
    setAvailabilities(data);
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
    if (isAuthenticated && user?.id) {
      loadUsers();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, user?.id]);

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sunset className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-primary">Chargement...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Menu profil en haut à droite */}
      <div className="w-full flex justify-end items-center px-8 pt-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full bg-card w-10 h-10 flex items-center justify-center font-bold text-lg text-primary shadow hover:bg-muted transition">
              {(() => {
                const username = user?.user_metadata?.username;
                if (username) {
                  // Prendre l'initiale du username
                  return username[0]?.toUpperCase();
                }
                const email = user?.email;
                if (email) {
                  return email[0]?.toUpperCase();
                }
                return '?';
              })()}
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
          <h3 className="text-sm font-semibold mb-2 text-primary">Mes jours saisis</h3>
          <div className="flex flex-wrap gap-2">
            {userAvailabilities.length === 0 && (
              <span className="text-muted-foreground text-xs">Aucune saisie pour l'instant.</span>
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
                <span key={avail.id + day} className="inline-flex items-center bg-muted text-primary rounded px-2 py-1 text-xs font-medium">
                  {day}
                  <button
                    className="ml-1 text-muted-foreground hover:text-primary"
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
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
            <Users className="w-6 h-6 text-primary" /> 
            Planning des disponibilités
          </h2>
          {allAvailabilities.length === 0 ? (
            <p className="text-muted-foreground">Aucune disponibilité enregistrée.</p>
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
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
                      <Calendar className="w-5 h-5 text-primary" />
                      Périodes avec disponibilités
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedDays.map((group, index) => (
                        <div key={index} className="bg-card text-card-foreground p-4 rounded-lg shadow border border-border">
                          <div className="font-medium text-sm text-muted-foreground mb-2">
                            {format(new Date(group[0]), 'dd MMM yyyy')} - {format(new Date(group[group.length - 1]), 'dd MMM yyyy')}
                          </div>
                          <div className="space-y-2">
                            {users.map(userId => {
                              const availableDays = group.filter(day => daysByUser[userId]?.has(day));
                              if (availableDays.length > 0) {
                                return (
                                  <div key={userId} className="flex items-center gap-2 text-sm">
                                    <div className="w-6 h-6 rounded-full bg-muted text-primary flex items-center justify-center font-medium">
                                      {userMap[userId]?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-primary">
                                      {userMap[userId]?.username || userId}
                                    </span>
                                    <span className="text-muted-foreground">
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
                          <th className="sticky left-0 z-20 bg-card text-card-foreground px-4 py-3 font-medium text-primary text-left border-r border-border">
                          </th>
                          {days.map(date => {
                            const formattedDate = format(new Date(date), 'dd');
                            const isCommon = users.every(u => daysByUser[u]?.has(date));
                            const hasAnyAvailability = users.some(u => daysByUser[u]?.has(date));
                            return (
                              <th key={date} className="px-2 py-3 font-medium text-muted-foreground text-center min-w-[60px]">
                                <div className={`rounded-full w-8 h-8 mx-auto flex items-center justify-center text-xs ${
                                  isCommon ? 'bg-card text-primary' : 
                                  hasAnyAvailability ? 'bg-muted text-primary' : 
                                  'bg-card text-muted-foreground'
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
                            <td className="sticky left-0 z-10 bg-card text-card-foreground px-4 py-2 font-medium text-primary text-left border-r border-border">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-muted text-primary flex items-center justify-center font-medium">
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
                                  isCommon ? 'bg-card text-primary' : 
                                  isAvailable ? 'bg-muted text-primary' : 
                                  'bg-card text-muted-foreground'
                                }`}>
                                  {isAvailable ? <Check className="w-4 h-4 mx-auto" /> : ''}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-card text-primary"></div>
                      <span>Tous disponibles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted text-primary"></div>
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