import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';

// @ts-ignore
import { api } from '../convex/_generated/api';

export const getDeviceId = () => {
  let id = localStorage.getItem('ot_device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('ot_device_id', id);
  }
  return id;
};

export const SyncManager: React.FC = () => {
  const [deviceId] = useState(getDeviceId());
  
  // Safe calls in case api is not generated yet
  const serverState = useQuery(api?.sync?.getSyncState || ('skip' as any), { deviceId });
  const pushSync = useMutation(api?.sync?.pushSyncState || ('skip' as any));

  useEffect(() => {
    if (!serverState) return;

    const localUpdatedAt = parseInt(localStorage.getItem('ot_last_update') || '0', 10);
    
    if (serverState.updatedAt > localUpdatedAt) {
      // Server is newer
      localStorage.setItem('fitness_pro_logs_v1', serverState.logs);
      localStorage.setItem('fitness_pro_achievements_v1', serverState.achievements);
      if (serverState.routines) localStorage.setItem('customRoutines', serverState.routines);
      if (serverState.settings) localStorage.setItem('appSettings', serverState.settings);
      if (serverState.rpgLevel) localStorage.setItem('rpg_last_seen_level', serverState.rpgLevel);
      if (serverState.rpgXp !== undefined) localStorage.setItem('rutinag_xp_total', serverState.rpgXp.toString());
      if (serverState.username) localStorage.setItem('rutinag_username', serverState.username);
      localStorage.setItem('ot_last_update', serverState.updatedAt.toString());
      window.dispatchEvent(new Event('storage-update'));
      window.dispatchEvent(new Event('achievements-unlocked'));
    } else if (localUpdatedAt > serverState.updatedAt) {
      // Local is newer
      const logs = localStorage.getItem('fitness_pro_logs_v1') || '{}';
      const achievements = localStorage.getItem('fitness_pro_achievements_v1') || '{}';
      const routines = localStorage.getItem('customRoutines') || '[]';
      const settings = localStorage.getItem('appSettings') || '{}';
      const rpgLevel = localStorage.getItem('rpg_last_seen_level') || '1';
      const rpgXpStr = localStorage.getItem('rutinag_xp_total');
      const rpgXp = rpgXpStr ? parseInt(rpgXpStr, 10) : 0;
      const username = localStorage.getItem('rutinag_username') || undefined;
      
      if (pushSync && api) {
        pushSync({
          deviceId,
          logs,
          achievements,
          routines,
          settings,
          rpgLevel,
          rpgXp,
          username,
          updatedAt: localUpdatedAt
        }).catch(console.error);
      }
    }
  }, [serverState, deviceId, pushSync]);

  useEffect(() => {
    const handleStorageUpdate = () => {
      const now = Date.now();
      // Set local updated at
      localStorage.setItem('ot_last_update', now.toString());
      
      const logs = localStorage.getItem('fitness_pro_logs_v1') || '{}';
      const achievements = localStorage.getItem('fitness_pro_achievements_v1') || '{}';
      const routines = localStorage.getItem('customRoutines') || '[]';
      const settings = localStorage.getItem('appSettings') || '{}';
      const rpgLevel = localStorage.getItem('rpg_last_seen_level') || '1';
      const rpgXpStr = localStorage.getItem('rutinag_xp_total');
      const rpgXp = rpgXpStr ? parseInt(rpgXpStr, 10) : 0;
      const username = localStorage.getItem('rutinag_username') || undefined;

      if (pushSync && api) {
        pushSync({
          deviceId,
          logs,
          achievements,
          routines,
          settings,
          rpgLevel,
          rpgXp,
          username,
          updatedAt: now
        }).catch(console.error);
      }
    };

    // We also hook into the original saveLog event and achievements events
    window.addEventListener('storage-update', handleStorageUpdate);
    window.addEventListener('achievements-unlocked', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage-update', handleStorageUpdate);
      window.removeEventListener('achievements-unlocked', handleStorageUpdate);
    };
  }, [deviceId, pushSync]);

  return null;
};
