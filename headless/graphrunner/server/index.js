// index.js
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupWebSocket } from './wsHandler.js';
import { router as apiRoutes } from './routes.js';
import { logger } from '../logger.js';
import { createRequire } from 'module';

// Use createRequire so that we can use require() in this ES module.
const require = createRequire(import.meta.url);
// Load environment variables from headless/graphrunner/.env
require('dotenv').config({ path: path.join(process.cwd(), "headless", "graphrunner", ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/css', express.static(path.join(process.cwd(), "css")));
app.use('/src', express.static(path.join(process.cwd(), "src")));
app.use('/build', express.static(path.join(process.cwd(), "build")));
app.use('/external', express.static(path.join(process.cwd(), "external")));
app.use('/editor', express.static(path.join(process.cwd(), "editor")));

// API Routes
app.use('/api', apiRoutes);

// Start WebSocket server
setupWebSocket(server);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
