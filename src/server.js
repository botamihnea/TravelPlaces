const { WebSocketServer } = require('ws');
const http = require('http');
const { initDatabase, placesDB } = require('./db');

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
async function startAutoRefresh() {
  if (updateInterval) return;

  let counter = 1;
  updateInterval = setInterval(async () => {
    if (!isAutoRefreshEnabled || wss.clients.size === 0) return;

    try {
      // Get all places for random selection
      const allPlaces = await placesDB.getAllPlaces();
      
      // Randomly decide whether to add a new place or update existing
      const shouldAddNew = Math.random() < 0.3; // 30% chance to add new place

      if (shouldAddNew) {
        // Generate a new place
        const newPlace = {
          name: `Auto Generated Place ${counter++}`,
          location: `Location ${Math.floor(Math.random() * 100)}`,
          description: `This is an automatically generated place ${counter}`,
          rating: Math.floor(Math.random() * 5) + 1,
          videoUrl: null
        };

        // Add to database
        const addedPlace = await placesDB.addPlace(newPlace);

        // Broadcast the new place
        broadcastUpdate({
          type: 'update',
          action: 'add',
          data: addedPlace
        });
      } else if (allPlaces.length > 0) {
        // Get a random place to update
        const randomIndex = Math.floor(Math.random() * allPlaces.length);
        const placeToUpdate = allPlaces[randomIndex];
        
        // Generate updated data
        const updatedData = {
          name: `Updated ${placeToUpdate.name}`,
          location: `Updated ${placeToUpdate.location}`,
          description: `${placeToUpdate.description} (updated)`,
          rating: Math.min(5, placeToUpdate.rating + 1) || Math.floor(Math.random() * 5) + 1,
          videoUrl: placeToUpdate.videoUrl
        };

        // Update in database
        const updatedPlace = await placesDB.updatePlace(placeToUpdate.id, updatedData);

        if (updatedPlace) {
          // Broadcast the update
          broadcastUpdate({
            type: 'update',
            action: 'refresh',
            data: updatedPlace
          });
        }
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
  ws.on('message', async (message) => {
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
          // Check if this is a notification about a place already added via the API
          // If the data includes an id, it means it was already added via the API
          if (data.data && data.data.id) {
            console.log('Broadcasting existing place (added via API):', data.data);
            // Just broadcast the existing place to other clients
            broadcastUpdate({
              type: 'update',
              action: 'add',
              data: data.data
            });
          } else {
            // This is a new place being added directly through WebSocket
            try {
              const newPlace = await placesDB.addPlace(data.data);
              console.log('Added new place to database:', newPlace);
              
              // Broadcast to all clients
              broadcastUpdate({
                type: 'update',
                action: 'add',
                data: newPlace
              });
            } catch (error) {
              console.error('Error adding place to database:', error);
            }
          }
        }
        else if (data.action === 'delete') {
          try {
            const success = await placesDB.deletePlace(data.id);
            console.log(`Deleted place with ID ${data.id} from database: ${success}`);
            
            if (success) {
              // Broadcast to all clients
              broadcastUpdate({
                type: 'update',
                action: 'delete',
                id: data.id
              });
            }
          } catch (error) {
            console.error('Error deleting place from database:', error);
          }
        }
        else if (data.action === 'refresh') {
          try {
            const updatedPlace = await placesDB.updatePlace(data.data.id, data.data);
            console.log('Updated place in database:', updatedPlace);
            
            if (updatedPlace) {
              // Broadcast to all clients
              broadcastUpdate({
                type: 'update',
                action: 'refresh',
                data: updatedPlace
              });
            }
          } catch (error) {
            console.error('Error updating place in database:', error);
          }
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

// Initialize database and start server
initDatabase()
  .then(() => {
    console.log('Database initialized successfully, starting server...');
    // Start server
    const PORT = process.env.WS_PORT || 8080;
    server.listen(PORT, () => {
      console.log(`WebSocket server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1); // Exit if database initialization fails
  }); 