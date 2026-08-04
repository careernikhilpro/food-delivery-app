import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { logger } from './utils/logger';
import { setupWorkers } from './services/queue';
import dotenv from 'dotenv';
import { pool } from './db';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.io setup (In-memory, no Redis adapter required for local testing)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import { assignmentManager } from './services/assignment';

app.set('io', io);
assignmentManager.init(io);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('rider_online', (data) => {
    // For local testing, we expect the client to send their ID. 
    // If none provided, we mock it using the socket ID.
    const riderId = data?.riderId || `mock_rider_${socket.id.substring(0,5)}`;
    assignmentManager.registerRider(riderId, socket.id, data?.lat, data?.lng);
  });

  socket.on('rider_sync_location', (data) => {
    const riderId = data?.riderId;
    if (riderId && data?.lat && data?.lng) {
      assignmentManager.updateRiderLocation(riderId, data.lat, data.lng);
    }
  });

  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('rider_location_update', (data) => {
    if (data.orderId) {
      // Relay to the specific customer tracking this order
      socket.to(`room_${data.orderId}`).emit('rider_location_update', data);
    }
  });

  socket.on('support_message', (data) => {
    if (data.ticketId) {
      // Relay the message to the support room so both admin and user can see it instantly
      socket.to(`support_${data.ticketId}`).emit('support_message', data);
    }
  });

  socket.on('disconnect', () => {
    assignmentManager.unregisterSocket(socket.id);
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Setup mock background workers
setupWorkers();

// Auto-migrate FCM columns on startup to fix Render DB issues
const migrateDB = async () => {
  try {
    const client = await pool.connect();
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;`);
    await client.query(`ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fcm_token TEXT;`);
    await client.query(`ALTER TABLE delivery_partners ADD COLUMN IF NOT EXISTS fcm_token TEXT;`);
    
    // Auto-migrate menu_items
    await client.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;`);
    await client.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;`);
    await client.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS has_addons BOOLEAN DEFAULT false;`);
    await client.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]'::jsonb;`);
    
    // Add PIN hash and email columns for new authentication system
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_pin_hash VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS vendor_pin_hash VARCHAR(255);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS delivery_pin_hash VARCHAR(255);`);
    
    // Migrate existing pin_hash based on current role
    await client.query(`UPDATE users SET customer_pin_hash = pin_hash WHERE role = 'customer' AND customer_pin_hash IS NULL AND pin_hash IS NOT NULL;`);
    await client.query(`UPDATE users SET vendor_pin_hash = pin_hash WHERE role = 'vendor' AND vendor_pin_hash IS NULL AND pin_hash IS NOT NULL;`);
    await client.query(`UPDATE users SET delivery_pin_hash = pin_hash WHERE role = 'delivery' AND delivery_pin_hash IS NULL AND pin_hash IS NOT NULL;`);
    
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`);
    
    // Create notifications table for history
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER, -- Can be customer, vendor, or rider
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system',
        is_read BOOLEAN DEFAULT false,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create support tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_type VARCHAR(50) NOT NULL, -- 'user' or 'admin'
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Connected to PostgreSQL Database');
    
    // Auto-migrate missing columns for orders and order_items table
    try {
      await pool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS item_total DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS restaurant_share DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
        ADD COLUMN IF NOT EXISTS restaurant_instructions TEXT;

        ALTER TABLE order_items
        ADD COLUMN IF NOT EXISTS item_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '[]'::jsonb;
      `);
      logger.info('Auto-migrated orders and order_items table schema successfully.');
    } catch (migErr) {
      logger.error('Failed to auto-migrate schema:', migErr);
    }
    logger.info('Database FCM columns & notifications table migrated successfully.');
  } catch (error) {
    logger.error('Database migration failed:', error);
  }
};

migrateDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
