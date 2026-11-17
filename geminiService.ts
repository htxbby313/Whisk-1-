import { SearchParams, TripItinerary, BlogPost, ChatMode, GroundingSource } from './types';

/**
 * Client service that proxies all Gemini requests through the application's
 * server-side API endpoints. Never exposes API keys or imports @google/genai in the browser.
 */

export const generateItinerary = async (params: SearchParams): Promise<TripItinerary> => {
  const response = await fetch('/api/gemini/itinerary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  return response.json();
};

export const searchMapsPlaces = async (params: {
  query?: string;
  destination?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ text: string; sources: GroundingSource[]; model: string }> => {
  const response = await fetch('/api/gemini/places', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Places lookup failed with status ${response.status}`);
  }

  return response.json();
};

export const generateBlogPost = async (
  itinerary: TripItinerary
): Promise<Omit<BlogPost, 'id' | 'imageUrl' | 'createdAt'>> => {
  const response = await fetch('/api/gemini/blog-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itinerary),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  return response.json();
};

export const sendChatMessage = async (
  message: string,
  history: any[] = [],
  mode: ChatMode = 'standard',
  coords?: { latitude: number; longitude: number }
): Promise<{ text?: string; sources?: GroundingSource[]; model?: string }> => {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      mode,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat error: ${response.status}`);
  }

  return response.json();
};

/**
 * Server-Sent Events (SSE) streaming for real-time text chunks + grounding metadata
 */
export const sendChatMessageStream = async (
  message: string,
  history: any[] = [],
  onChunk: (text: string) => void,
  mode: ChatMode = 'standard',
  coords?: { latitude: number; longitude: number }
): Promise<{ text: string; sources: GroundingSource[]; model?: string }> => {
  const response = await fetch('/api/gemini/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      mode,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    }),
  });

  if (!response.ok || !response.body) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Streaming failed with status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let sources: GroundingSource[] = [];
  let model: string | undefined;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.text) {
            accumulated += parsed.text;
            onChunk(parsed.text);
          }
          if (Array.isArray(parsed.sources)) {
            sources = parsed.sources;
          }
          if (parsed.model) {
            model = parsed.model;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (err: any) {
          if (err?.message && !err.message.includes('JSON')) {
            throw err;
          }
        }
      }
    }
  }

  return { text: accumulated, sources, model };
};

/**
 * Connect to server-side Gemini Live API bridge over WebSocket
 */
export const connectLiveSession = (callbacks: {
  onAudio?: (base64Audio: string) => void;
  onText?: (text: string) => void;
  onInterrupted?: () => void;
  onError?: (err: any) => void;
  onClose?: () => void;
}) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/live`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.audio && callbacks.onAudio) callbacks.onAudio(data.audio);
      if (data.text && callbacks.onText) callbacks.onText(data.text);
      if (data.interrupted && callbacks.onInterrupted) callbacks.onInterrupted();
      if (data.error && callbacks.onError) callbacks.onError(data.error);
    } catch (e) {
      callbacks.onError?.(e);
    }
  };

  ws.onerror = (e) => callbacks.onError?.(e);
  ws.onclose = () => callbacks.onClose?.();

  return {
    sendAudio: (base64Pcm: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ audio: base64Pcm }));
      }
    },
    sendText: (text: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ text }));
      }
    },
    sendVideo: (base64Jpeg: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ video: base64Jpeg, mimeType: 'image/jpeg' }));
      }
    },
    close: () => {
      ws.close();
    },
  };
};

export const suggestPackingItems = async (params: {
  destination: string;
  duration?: string;
  interests?: string[];
}): Promise<Array<{ item: string; category: string }>> => {
  const response = await fetch('/api/gemini/suggest-packing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Packing suggestions failed (${response.status})`);
  }

  const data = await response.json();
  return Array.isArray(data.items) ? data.items : [];
};

export const syncAuthenticatedAccount = async (idToken: string): Promise<void> => {
  const response = await fetch('/api/sql/users/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to sync account');
  }
};

export const fetchTripToolkit = async (idToken: string, itineraryId: string) => {
  const response = await fetch(`/api/sql/trips/${encodeURIComponent(itineraryId)}/toolkit`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to load trip toolkit');
  }
  return response.json();
};

export const addTripPackingItem = async (
  idToken: string,
  itineraryId: string,
  payload: { destination: string; item: string; category: string }
) => {
  const response = await fetch(`/api/sql/trips/${encodeURIComponent(itineraryId)}/packing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add packing item');
  }
  return response.json();
};

export const toggleTripPackingItem = async (
  idToken: string,
  itemId: number,
  isPacked: boolean
) => {
  const response = await fetch(`/api/sql/packing/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ isPacked }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update packing item');
  }
  return response.json();
};

export const deleteTripPackingItem = async (idToken: string, itemId: number) => {
  const response = await fetch(`/api/sql/packing/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete packing item');
  }
  return response.json();
};

export const addTripJournalNote = async (
  idToken: string,
  itineraryId: string,
  payload: { destination: string; title: string; content: string; rating: number }
) => {
  const response = await fetch(`/api/sql/trips/${encodeURIComponent(itineraryId)}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save journal note');
  }
  return response.json();
};

export const deleteTripJournalNote = async (idToken: string, noteId: number) => {
  const response = await fetch(`/api/sql/notes/${noteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete journal note');
  }
  return response.json();
};
