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

// Redirect console methods to our dedicated logger.
console.log = (...args) => logger.info(args.join(" "));
console.info = (...args) => logger.info(args.join(" "));
console.error = (...args) => logger.error(args.join(" "));
console.warn = (...args) => logger.warn(args.join(" "));

// Handle uncaught exceptions.
process.on('uncaughtException', (err) => {
  logger.error(`[GR] Uncaught Exception: ${err.message}`);
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
    process.exit(1);
  }
}

safeLoadGraph();

graph.onExecute = function () {
  try {
    parentPort.postMessage({ event: 'graphExecuted' });
  } catch (error) {
    logger.error(`[GR] Execution error: ${error.message}`);
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
  }
});
