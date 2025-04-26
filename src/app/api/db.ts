import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Use dynamic import to avoid module not found errors
const sqlite3 = require('sqlite3').verbose();

// Ensure db directory exists
const dbDir = path.join(process.cwd(), 'db');
console.log('API: DB directory path:', dbDir);

if (!fs.existsSync(dbDir)) {
  console.log('API: Creating DB directory as it doesn\'t exist');
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'travel.db');
console.log('API: SQLite database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err: Error | null) => {
  if (err) {
    console.error('API: Error connecting to SQLite database:', err.message);
  } else {
    console.log('API: Connected to SQLite database');
    // Initialize database immediately upon connection
    initDatabase()
      .then(() => console.log('API: Database initialized successfully on connection'))
      .catch((err: Error) => console.error('API: Failed to initialize database on connection:', err));
  }
});

// Initialize database tables
function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('API: Starting database initialization...');
    // Create places table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        rating INTEGER NOT NULL,
        description TEXT NOT NULL,
        videoUrl TEXT
      )
    `, (err: Error | null) => {
      if (err) {
        console.error('API: Error creating places table:', err.message);
        reject(err);
        return;
      }
      
      console.log('API: Places table created or already exists');
      
      // Check if we need to load initial data (only if table is empty)
      db.get('SELECT COUNT(*) as count FROM places', (err: Error | null, row: any) => {
        if (err) {
          console.error('API: Error checking places count:', err.message);
          reject(err);
          return;
        }
        
        console.log('API: Current places count:', row ? row.count : 0);
        
        if (row && row.count === 0) {
          console.log('API: Table is empty, loading initial data...');
          // Load initial data
          const initialPlaces = [
            { 
              name: 'South Beach', 
              location: 'Miami, Florida', 
              rating: 5, 
              description: 'Beautiful sandy beach with crystal clear waters. Perfect for swimming, sunbathing, and people watching. The vibrant atmosphere and nearby restaurants make it a must-visit destination.',
              videoUrl: null
            },
            { 
              name: 'Rocky Mountain National Park', 
              location: 'Colorado', 
              rating: 4, 
              description: 'Stunning mountain views with diverse wildlife and hiking trails for all skill levels. The park offers breathtaking scenery, alpine lakes, and opportunities to see elk, moose, and other wildlife in their natural habitat.',
              videoUrl: null
            },
            { 
              name: 'Cancun Resort & Spa', 
              location: 'Cancun, Mexico', 
              rating: 4, 
              description: 'Luxury all-inclusive resort with pristine beaches, multiple swimming pools, and world-class dining options. Enjoy water sports, spa treatments, and evening entertainment in this tropical paradise.',
              videoUrl: null
            },
            { 
              name: 'Lake Michigan', 
              location: 'Michigan', 
              rating: 3, 
              description: 'Peaceful lake perfect for fishing, boating, and water sports. The surrounding forests and small towns offer charming accommodations and local cuisine. Great for family vacations and outdoor enthusiasts.',
              videoUrl: null
            },
            { 
              name: 'Manhattan Experience', 
              location: 'New York City', 
              rating: 2, 
              description: 'Exciting city break with world-famous attractions including Times Square, Central Park, and Broadway shows. Shop on Fifth Avenue, visit museums, and experience the diverse culinary scene that makes NYC a global destination.',
              videoUrl: null
            },
            { 
              name: 'Roman Colosseum', 
              location: 'Rome, Italy', 
              rating: 5, 
              description: 'Ancient amphitheater dating back to 70-80 AD. This iconic symbol of Imperial Rome offers a glimpse into the past with its impressive architecture and historical significance. Guided tours available to learn about gladiatorial contests and public spectacles.',
              videoUrl: null
            }
          ];
          
          let initialDataInserted = 0;
          const totalPlaces = initialPlaces.length;
          
          initialPlaces.forEach(place => {
            db.run(
              'INSERT INTO places (name, location, rating, description, videoUrl) VALUES (?, ?, ?, ?, ?)',
              [
                place.name, 
                place.location, 
                place.rating, 
                place.description, 
                place.videoUrl || null
              ],
              function(err: Error | null) {
                if (err) {
                  console.error('API: Error inserting initial place:', err.message);
                } else {
                  initialDataInserted++;
                  console.log(`API: Inserted place ${initialDataInserted}/${totalPlaces}`);
                  if (initialDataInserted === totalPlaces) {
                    console.log('API: Initial places data loaded successfully');
                    resolve();
                  }
                }
              }
            );
          });
        } else {
          console.log('API: Table already has data, skipping initial data load');
          resolve();
        }
      });
    });
  });
}

// Database operations for places
export const placesDB = {
  // Get all places
  getAllPlaces: (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM places', (err: Error | null, rows: any[]) => {
        if (err) {
          console.error('API: Error getting all places:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  
  // Get place by ID
  getPlaceById: (id: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM places WHERE id = ?', [id], (err: Error | null, row: any) => {
        if (err) {
          console.error(`API: Error getting place with ID ${id}:`, err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  },
  
  // Add new place
  addPlace: (place: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const { name, location, rating, description, videoUrl } = place;
      db.run(
        'INSERT INTO places (name, location, rating, description, videoUrl) VALUES (?, ?, ?, ?, ?)',
        [name, location, rating, description, videoUrl || null],
        function(this: any, err: Error | null) {
          if (err) {
            console.error('API: Error adding place:', err.message);
            reject(err);
          } else {
            // Return the inserted place with the new ID
            resolve({
              id: this.lastID,
              name,
              location,
              rating,
              description,
              videoUrl: videoUrl || null
            });
          }
        }
      );
    });
  },
  
  // Update place
  updatePlace: (id: number, place: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const { name, location, rating, description, videoUrl } = place;
      db.run(
        'UPDATE places SET name = ?, location = ?, rating = ?, description = ?, videoUrl = ? WHERE id = ?',
        [name, location, rating, description, videoUrl || null, id],
        function(this: any, err: Error | null) {
          if (err) {
            console.error(`API: Error updating place with ID ${id}:`, err.message);
            reject(err);
          } else if (this.changes === 0) {
            // No rows affected - place not found
            resolve(null);
          } else {
            // Return the updated place
            resolve({
              id,
              name,
              location,
              rating,
              description,
              videoUrl: videoUrl || null
            });
          }
        }
      );
    });
  },
  
  // Delete place
  deletePlace: (id: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM places WHERE id = ?', [id], function(this: any, err: Error | null) {
        if (err) {
          console.error(`API: Error deleting place with ID ${id}:`, err.message);
          reject(err);
        } else if (this.changes === 0) {
          // No rows affected - place not found
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
};

// Initialize database on module load
initDatabase(); 