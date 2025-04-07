import { WebSocketServer } from 'ws';
import { NextResponse } from 'next/server';
import { placesStore } from '../../lib/placesStore';

// Initialize WebSocket server
const wss = new WebSocketServer({ port: 8080 });

// Global state for auto-refresh
let isAutoRefreshEnabled = false;
let updateInterval: NodeJS.Timeout | null = null;

// Function to send update to all connected clients
function broadcastUpdate(data: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending update:', error);
      }
    }
  });
}

// Start the background task for auto-refresh
function startAutoRefresh() {
  if (updateInterval) return;

  let counter = 1;
  updateInterval = setInterval(() => {
    if (!isAutoRefreshEnabled || wss.clients.size === 0) return;

    try {
      const places = placesStore.getAllPlaces();
      
      // Randomly decide whether to add a new place or update existing
      const shouldAddNew = Math.random() < 0.3; // 30% chance to add new place

      if (shouldAddNew) {
        // Generate a new place
        const newPlace = {
          id: Date.now(),
          name: `Auto Generated Place ${counter++}`,
          location: `Location ${Math.floor(Math.random() * 100)}`,
          description: `This is an automatically generated place ${counter}`,
          rating: Math.floor(Math.random() * 5) + 1,
          videoUrl: ""
        };

        // Add to store and broadcast
        placesStore.addPlace(newPlace);
        broadcastUpdate({
          type: 'update',
          action: 'add',
          data: newPlace
        });
      } else if (places.length > 0) {
        // Update an existing place
        const randomIndex = Math.floor(Math.random() * places.length);
        const place = places[randomIndex];
        const updatedPlace = {
          ...place,
          rating: Math.floor(Math.random() * 5) + 1,
          location: `Updated Location ${Math.floor(Math.random() * 100)}`
        };

        // Update store and broadcast
        placesStore.updatePlace(place.id, updatedPlace);
        broadcastUpdate({
          type: 'update',
          action: 'refresh',
          data: updatedPlace
        });
      }
    } catch (error) {
      console.error('Error in auto-refresh task:', error);
    }
  }, 3000);
}

// Stop the background task
function stopAutoRefresh() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial connection message
  ws.send(JSON.stringify({ type: 'connected' }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);
      
      if (data.type === 'toggle-auto-refresh') {
        isAutoRefreshEnabled = data.enabled;
        if (isAutoRefreshEnabled) {
          startAutoRefresh();
        } else {
          stopAutoRefresh();
        }
        // Broadcast auto-refresh status to all clients
        broadcastUpdate({
          type: 'auto-refresh-status',
          enabled: isAutoRefreshEnabled
        });
      }
      else if (data.type === 'update') {
        if (data.action === 'add') {
          console.log('Broadcasting new place:', data.data);
          placesStore.addPlace(data.data);
          broadcastUpdate({
            type: 'update',
            action: 'add',
            data: data.data
          });
        }
        else if (data.action === 'delete') {
          console.log('Broadcasting place deletion:', data.id);
          placesStore.deletePlace(data.id);
          broadcastUpdate({
            type: 'update',
            action: 'delete',
            id: data.id
          });
        }
        else if (data.action === 'refresh') {
          console.log('Broadcasting place update:', data.data); 
          placesStore.updatePlace(data.data.id, data.data);
          broadcastUpdate({
            type: 'update',
            action: 'refresh',
            data: data.data
          });
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    if (wss.clients.size === 0) {
      stopAutoRefresh();
    }
  });
});

// Export dummy handler for Next.js (required for API routes)
export async function GET() {
  return new NextResponse('WebSocket server running', { status: 200 });
} 