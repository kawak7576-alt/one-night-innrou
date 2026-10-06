import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientAction, ClientGameState, RoleId } from '../types/game';

const LOCAL_STORAGE_PLAYER_ID_KEY = 'werewolf_player_id';
const LOCAL_STORAGE_PLAYER_NAME_KEY = 'werewolf_player_name';
const LOCAL_STORAGE_ROOM_ID_KEY = 'werewolf_room_id';

export function useGameSocket() {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const joinedRef = useRef<{ roomId: string; name: string } | null>(null);

  // Initialize stored player ID
  const getStoredPlayerId = () => {
    let pid = localStorage.getItem(LOCAL_STORAGE_PLAYER_ID_KEY);
    if (!pid) {
      pid = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem(LOCAL_STORAGE_PLAYER_ID_KEY, pid);
    }
    return pid;
  };

  const getStoredPlayerName = () => {
    return localStorage.getItem(LOCAL_STORAGE_PLAYER_NAME_KEY) || '';
  };

  const sendAction = useCallback((action: ClientAction) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      setErrorMessage(null);

      // If we already had a room and name joined, re-join
      if (joinedRef.current) {
        const pid = getStoredPlayerId();
        sendAction({
          type: 'JOIN_ROOM',
          roomId: joinedRef.current.roomId,
          playerName: joinedRef.current.name,
          playerId: pid,
        });
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.kicked) {
          localStorage.removeItem(LOCAL_STORAGE_ROOM_ID_KEY);
          joinedRef.current = null;
          setGameState(null);
          setErrorMessage(data.error || '部屋主によって部屋から追放されましたワン。');
          return;
        }
        if (data.error) {
          setErrorMessage(data.error);
          joinedRef.current = null;
          return;
        }
        setGameState(data as ClientGameState);
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      wsRef.current = null;
      // Auto reconnect after 2 seconds
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };
  }, [sendAction]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const joinRoom = useCallback(
    (roomId: string, playerName: string) => {
      const pid = getStoredPlayerId();
      const cleanRoom = roomId.trim().toUpperCase();
      const cleanName = playerName.trim() || '名無し';

      localStorage.setItem(LOCAL_STORAGE_ROOM_ID_KEY, cleanRoom);
      localStorage.setItem(LOCAL_STORAGE_PLAYER_NAME_KEY, cleanName);
      joinedRef.current = { roomId: cleanRoom, name: cleanName };

      sendAction({
        type: 'JOIN_ROOM',
        roomId: cleanRoom,
        playerName: cleanName,
        playerId: pid,
      });
    },
    [sendAction]
  );

  const startRoleConfig = useCallback(() => {
    sendAction({ type: 'START_ROLE_CONFIG' });
  }, [sendAction]);

  const setRoleConfig = useCallback(
    (config: Record<RoleId, number>) => {
      sendAction({ type: 'SET_ROLE_CONFIG', config });
    },
    [sendAction]
  );

  const startNight = useCallback(() => {
    sendAction({ type: 'START_NIGHT' });
  }, [sendAction]);

  const submitNightAction = useCallback(
    (params: {
      seerChoice?: { targetPlayerId?: string; checkGraveyard?: boolean };
      thiefChoice?: { targetPlayerId: string };
      isReady?: boolean;
    }) => {
      sendAction({
        type: 'SUBMIT_NIGHT_ACTION',
        seerChoice: params.seerChoice,
        thiefChoice: params.thiefChoice,
        isReady: params.isReady,
      });
    },
    [sendAction]
  );

  const endDiscussion = useCallback(() => {
    sendAction({ type: 'END_DISCUSSION' });
  }, [sendAction]);

  const submitVote = useCallback(
    (targetId: string) => {
      sendAction({ type: 'SUBMIT_VOTE', targetId });
    },
    [sendAction]
  );

  const submitHunterRevenge = useCallback(
    (targetPlayerId: string) => {
      sendAction({ type: 'SUBMIT_HUNTER_REVENGE', targetPlayerId });
    },
    [sendAction]
  );

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      sendAction({ type: 'KICK_PLAYER', targetPlayerId });
    },
    [sendAction]
  );

  const newGame = useCallback(() => {
    sendAction({ type: 'NEW_GAME' });
  }, [sendAction]);

  return {
    gameState,
    connectionStatus,
    errorMessage,
    clearError: () => setErrorMessage(null),
    getStoredPlayerId,
    getStoredPlayerName,
    joinRoom,
    startRoleConfig,
    setRoleConfig,
    startNight,
    submitNightAction,
    endDiscussion,
    submitVote,
    submitHunterRevenge,
    kickPlayer,
    newGame,
  };
}
