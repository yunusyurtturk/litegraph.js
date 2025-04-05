// server/graphManager.js
import path from 'path';
import fs from 'fs';
import { Worker } from 'worker_threads';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require("../../../build_node/litegraph_nodejs.full.cjs");

// Load environment variables.
require('dotenv').config({ path: path.join(process.cwd(), "headless", "graphrunner", ".env") });

const WORKFLOWS_DIR = process.env.WORKFLOWS_DIR ||
  path.join(process.cwd(), "headless", "graphrunner", "workflows");

/* ===================== In‑Memory Graph Functions (Visualization) ===================== */

// Storage for visualization graphs.
// Key: graphId (the relative file path) -> { graph, status, file }
const graphs = {};

/**
 * openGraph(file, logger)
 * Loads a graph JSON file from disk for visualization and simultaneously spawns a worker
 * (via our external graphRunner) to execute the graph.
 * Returns an object with the graphId and its serialized configuration.
 */
export function openGraph(file, logger) {
  const filePath = path.join(WORKFLOWS_DIR, file);
  try {
    const data = fs.readFileSync(filePath, "utf8");
    
    // load graph in this thread
    const json = JSON.parse(data);
    const graph = new LiteGraph.LGraph();
    try {
      graph.configure(json);
    } catch (e) {
      logger.error("Graph configuration error for " + filePath + ": " + e.message);
    }
    
    // Use the relative file path as the graphId for consistency.
    const graphId = file;
    
    graphs[graphId] = { graph, status: "paused", file };
    // graphs[graphId] = { graph: data, status: "paused", file };

    logger.info("Graph loaded for visualization from " + filePath);

    // Spawn an external worker to execute the graph.
    loadGraph(file, logger);

    return { graphId, serializedGraph: graph.serialize() };
  } catch (err) {
    logger.error("Error loading graph file " + filePath + ": " + err.message);
    return { error: "Failed to load graph file: " + err.message };
  }
}

/**
 * updateGraph(graphId, serializedGraph, logger)
 * Reconfigures an in‑memory visualization graph using a new serialized configuration.
 */
export function updateGraph(graphId, serializedGraph, logger) {
  if (!graphs[graphId]) {
    return { error: "Graph not found." };
  }
  logger.info("Graph update for " + graphId);
  const graphObj = graphs[graphId];
  try {
    graphObj.graph.configure(serializedGraph);
  } catch (err) {
    logger.error("Graph configuration error in update_graph for " + graphId + ": " + err.message);
    return { error: "Graph configuration error: " + err.message };
  }
  return { serializedGraph: graphObj.graph.serialize() };
}

/**
 * requestSync(graphId, logger)
 * Returns the current serialized configuration of an in‑memory visualization graph.
 */
export function requestSync(graphId, logger) {
  if (!graphs[graphId]) {
    return { error: "Graph not found." };
  }
  const graphObj = graphs[graphId];
  return { graphId, serializedGraph: graphObj.graph.serialize() };
}

/* ===================== Worker‑Based Graph Functions (Execution) ===================== */

// Storage for graphs running in worker threads.
// Key: graphId (same as in visualization) -> worker instance
const graphRunners = new Map();

/**
 * loadGraph(file, logger)
 * Spawns a worker thread to execute a graph using our external graphRunner.
 * The graphId is set to the relative file path.
 */
export function loadGraph(file, logger) {
  const graphId = file; // Use the same graphId as in openGraph.
  if (graphRunners.has(graphId)) {
    logger.warn(`Graph ${graphId} is already loaded as a worker.`);
    return;
  }
  const fullPath = path.join(WORKFLOWS_DIR, file);
  try {
    logger.info(`Launching worker for graph ${graphId} from ${fullPath}`);
    const runner = new Worker(
      path.join(process.cwd(), "headless", "graphrunner", "graphRunners", "graphRunner.js"),
      { workerData: fullPath }
    );
    runner.on('message', (message) => {
      logger.info(`Worker graph ${graphId} message: ${JSON.stringify(message)}`);
      // Pipe console events if received from worker.
      if (message.event === 'console' && typeof consolePipeCallback === 'function') {
        consolePipeCallback(graphId, message.level, message.message);
      }
      // TODO should implement hear all message from Runner
      // eg. state changes confirmation
      // callback and logs
      /*
      graphInitialized
      graphLoadFailed
      graphExecuted
      graphStarted
      graphStopped
      graphStatus
      graphCleared
      unknownCommand
      */
    });
    runner.on('exit', (code) => {
      logger.warn(`Worker graph ${graphId} exited with code ${code}`);
      graphRunners.delete(graphId);
      // Optionally trigger UI updates here.
    });
    runner.on('error', (error) => {
      logger.error(`Worker graph ${graphId} encountered an error: ${error.message}`);
    });
    graphRunners.set(graphId, runner);
    logger.info(`Worker graph ${graphId} launched successfully.`);
  } catch (error) {
    logger.error(`Failed to launch worker graph ${graphId}: ${error.message}`);
  }
}

/**
 * controlGraph(graphId, action, logger)
 * Sends control commands (e.g., "start" or "stop") to the worker running the graph.
 * Returns an object indicating the new status or an error.
 */
export function controlGraph(graphId, action, logger) {
  if (graphRunners.has(graphId)) {
    const runner = graphRunners.get(graphId);
    try {
      runner.postMessage({ action });
      logger.info(`Sent ${action} command to worker graph ${graphId}`);
      return { status: action };
    } catch (err) {
      logger.error(`Failed to send command to worker graph ${graphId}: ${err.message}`);
      return { error: err.message };
    }
  }
  return { error: "Graph not running in worker mode.", graphId: graphId };
}

/**
 * unloadGraph(graphId, logger)
 * Terminates the worker thread running a graph.
 */
export function unloadGraph(graphId, logger) {
  const runner = graphRunners.get(graphId);
  if (!runner) {
    logger.warn(`Worker graph ${graphId} is not running.`);
    return;
  }
  try {
    runner.postMessage({ action: "clear" });
    // TODO should wait graphCleared event
    setTimeout(()=>{
      runner.terminate();
      graphRunners.delete(graphId);
      logger.info(`Worker graph ${graphId} has been unloaded.`);
    },1000);
  } catch (error) {
    logger.error(`Failed to unload worker graph ${graphId}: ${error.message}`);
  }
}

/**
 * getCurrentProcesses()
 * Returns an array of graphIds currently running as worker threads.
 */
export function getCurrentProcesses() {
  return Array.from(graphRunners.keys());
}

/**
 * isGraphRunning(graphId)
 * Returns true if a worker graph with the given graphId is running.
 */
export function isGraphRunning(graphId) {
  return graphRunners.has(graphId);
}

/**
 * stopAllGraphs(logger)
 * Terminates all worker graph processes.
 */
export function stopAllGraphs(logger) {
  for (const graphId of graphRunners.keys()) {
    unloadGraph(graphId, logger);
  }
  logger.info("All worker graphs have been stopped.");
}

/* ===================== Console Piping ===================== */

// A callback that will be invoked when a worker sends a console event.
// The callback receives (graphId, level, message).
let consolePipeCallback = null;

/**
 * setConsolePipeCallback(callback)
 * Registers a callback to receive console events from worker threads.
 */
export function setConsolePipeCallback(callback) {
  consolePipeCallback = callback;
}
