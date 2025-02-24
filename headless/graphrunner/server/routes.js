// server/routes.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger.js';

//import 'dotenv/config'; // Load environment variables
import { createRequire } from 'module';
// Use createRequire so that we can use require() in this ES module.
const require = createRequire(import.meta.url);
// Load environment variables from headless/graphrunner/.env
require('dotenv').config({ path: path.join(process.cwd(), "headless", "graphrunner", ".env") });

export const router = express.Router();

// Use the WORKFLOWS_DIR from the .env file or fallback
const WORKFLOWS_DIR = process.env.WORKFLOWS_DIR ||
  path.join(process.cwd(), "headless", "graphrunner", "workflows");

// Ensure workflows directory exists at startup
if (!fs.existsSync(WORKFLOWS_DIR)) {
  logger.warn(`Creating missing workflows directory: ${WORKFLOWS_DIR}`);
  fs.mkdirSync(WORKFLOWS_DIR, { recursive: true });
}else{
  logger.info(`Using workflows directory: ${WORKFLOWS_DIR}`);
}

router.get('/list_files', (req, res) => {
  fs.readdir(WORKFLOWS_DIR, (err, files) => {
    if (err) {
      logger.error(`Error reading workflows directory: ${err.message}`);
      return res.status(500).json({ error: 'Failed to read workflows directory' });
    }
    const jsonFiles = files.filter(file => file.toLocaleLowerCase().endsWith('.json'));
    res.json(jsonFiles);
  });
});
