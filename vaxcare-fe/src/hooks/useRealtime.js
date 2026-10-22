import { useEffect, useRef, useState } from 'react';
import {
  subscribeMany,
  onConnectionChange,
  REALTIME_DEST,
} from '../services/realtimeClient';
import { apiClient } from '../services/apiClient';

export function useRealtime({ enabled = true, destinations = [], onEvent } = {}) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  // eslint-disable-next-line react-hooks/refs
  onEventRef.current = onEvent;

  const destKey = (destinations || []).filter(Boolean).sort().join('|');

  useEffect(() => {
    if (!enabled) return undefined;
    if (!apiClient.getAccessToken()) return undefined;
    const dests = destKey ? destKey.split('|') : [];
    if (dests.length === 0) return undefined;

    const offConn = onConnectionChange(setConnected);
    const unsub = subscribeMany(dests, (body) => {
      onEventRef.current?.(body);
    });

    return () => {
      unsub();
      offConn();
    };
  }, [enabled, destKey]);

  return { connected };
}

export function useAppointmentRealtime({ enabled = true, onEvent } = {}) {
  return useRealtime({
    enabled,
    destinations: [REALTIME_DEST.appointmentsUser, REALTIME_DEST.appointmentsTopic],
    onEvent,
  });
}

export function useNotificationRealtime({ enabled = true, onEvent } = {}) {
  return useRealtime({
    enabled,
    destinations: [REALTIME_DEST.notificationsUser],
    onEvent,
  });
}

export function useReactionRealtime({ enabled = true, onEvent } = {}) {
  return useRealtime({
    enabled,
    destinations: [REALTIME_DEST.reactionsUser, REALTIME_DEST.reactionsTopic],
    onEvent,
  });
}

export function useFacilityRealtime({ enabled = true, facilityId, onEvent } = {}) {
  const destinations = facilityId
    ? [
        REALTIME_DEST.facility('appointments', facilityId),
        REALTIME_DEST.facility('inventory', facilityId),
        REALTIME_DEST.facility('reactions', facilityId),
        REALTIME_DEST.facility('vaccinations', facilityId),
        REALTIME_DEST.appointmentsTopic,
        REALTIME_DEST.inventoryTopic,
        REALTIME_DEST.reactionsTopic,
        REALTIME_DEST.vaccinationsTopic,
      ]
    : [];

  return useRealtime({ enabled: enabled && !!facilityId, destinations, onEvent });
}

export { REALTIME_DEST };
