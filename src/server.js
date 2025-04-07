const { WebSocketServer } = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Global state for auto-refresh
let isAutoRefreshEnabled = false;
let updateInterval = null;

// Function to send update to all connected clients
function broadcastUpdate(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
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
          videoUrl: undefined
        };

        // Broadcast the new place
        broadcastUpdate({
          type: 'update',
          action: 'add',
          data: newPlace
        });
      } else {
        // Generate an update event
        const updatedPlace = {
          id: Date.now() - Math.floor(Math.random() * 1000),
          name: `Updated Place`,
          location: `Updated Location ${Math.floor(Math.random() * 100)}`,
          description: `This is an updated place`,
          rating: Math.floor(Math.random() * 5) + 1,
          videoUrl: undefined
        };

        // Broadcast the update
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
      console.log('Received message:', data);
      
      if (data.type === 'toggle-auto-refresh') {
        isAutoRefreshEnabled = data.enabled;
        console.log('Auto-refresh toggled:', isAutoRefreshEnabled);
        
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
        // Handle add, delete, and update operations
        if (data.action === 'add') {
          console.log('Broadcasting new place:', data.data);
          broadcastUpdate({
            type: 'update',
            action: 'add',
            data: data.data
          });
        }
        else if (data.action === 'delete') {
          console.log('Broadcasting place deletion:', data.id);
          broadcastUpdate({
            type: 'update',
            action: 'delete',
            id: data.id
          });
        }
        else if (data.action === 'refresh') {
          console.log('Broadcasting place update:', data.data);
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

// Start server
const PORT = process.env.WS_PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
}); 