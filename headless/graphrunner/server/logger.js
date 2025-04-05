// server/logger.js

import winston from 'winston';
import path from 'path';
//import 'dotenv/config'; // Load environment variables
import { createRequire } from 'module';
// Use createRequire so that we can use require() in this ES module.
const require = createRequire(import.meta.url);
// Load environment variables from headless/graphrunner/.env
require('dotenv').config({ path: path.join(process.cwd(), "headless", "graphrunner", ".env") });

const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || 'server.log';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logFile })
  ],
});
