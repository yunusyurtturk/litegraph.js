// graphRunners/graphRunner.js
import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import { createLogger } from '../logger.js'; // Our dedicated logger factory.
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require("../../../build_node/litegraph_nodejs.full.cjs");

// Create a dedicated logger instance for this worker.
const logger = createLogger({ level: 'info', logFile: 'custom.log' });

const workflowPath = workerData;
logger.info(`[GR] GraphRunner starting for ${workflowPath}`);

// Helper function to pipe messages to parent.
function pipeConsoleEvent(level, ...args) {
  const message = args.join(" ");
  // Send the message to parent (UI) along with its log level.
  if (parentPort) {
    parentPort.postMessage({ event: 'console', level, message });
  }
}

// Redirect console methods to our dedicated logger and pipe events.
console.log = (...args) => {
  const msg = args.join(" ");
  logger.info(msg);
  pipeConsoleEvent('info', msg);
};
console.info = (...args) => {
  const msg = args.join(" ");
  logger.info(msg);
  pipeConsoleEvent('info', msg);
};
console.error = (...args) => {
  const msg = args.join(" ");
  logger.error(msg);
  pipeConsoleEvent('error', msg);
};
console.warn = (...args) => {
  const msg = args.join(" ");
  logger.warn(msg);
  pipeConsoleEvent('warn', msg);
};

// Handle uncaught exceptions.
process.on('uncaughtException', (err) => {
  logger.error(`[GR] Uncaught Exception: ${err.message}`);
  pipeConsoleEvent('error', `[GR] Uncaught Exception: ${err.message}`);
  process.exit(1);
});

const graph = new LiteGraph.LGraph();

function safeLoadGraph() {
  try {
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`File not found: ${workflowPath}`);
    }
    const graphData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    graph.configure(graphData);
    logger.info(`[GR] GraphRunner initialized for ${workflowPath}`);
  } catch (error) {
    logger.error(`[GR] Error loading graph from ${workflowPath}: ${error.message}`);
    pipeConsoleEvent('error', `[GR] Error loading graph from ${workflowPath}: ${error.message}`);
    process.exit(1);
  }
}

safeLoadGraph();

graph.onExecute = function () {
  try {
    parentPort.postMessage({ event: 'graphExecuted' });
  } catch (error) {
    logger.error(`[GR] Execution error: ${error.message}`);
    pipeConsoleEvent('error', `[GR] Execution error: ${error.message}`);
  }
};

parentPort.on('message', (message) => {
  try {
    switch (message.action) {
      case 'start':
        graph.start();
        parentPort.postMessage({ event: 'graphStarted' });
        break;
      case 'stop':
        graph.stop();
        parentPort.postMessage({ event: 'graphStopped' });
        break;
      case 'status':
        parentPort.postMessage({ event: 'graphStatus', running: graph.running });
        break;
      default:
        parentPort.postMessage({ event: 'unknownCommand', command: message.action });
    }
  } catch (error) {
    logger.error(`[GR] GraphRunner error processing command: ${error.message}`);
    pipeConsoleEvent('error', `[GR] GraphRunner error processing command: ${error.message}`);
  }
});
