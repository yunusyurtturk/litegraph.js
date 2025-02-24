// server/wsHandler.js
import { WebSocketServer } from 'ws';
import { 
  openGraph, 
  controlGraph, 
  updateGraph, 
  requestSync, 
  getCurrentProcesses, 
  isGraphRunning,
  unloadGraph
} from './graphManager.js';
import { logger } from '../logger.js';

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  // Helper: Broadcast a message to all connected clients.
  function broadcast(messageObj) {
    const msg = JSON.stringify(messageObj);
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(msg);
      }
    });
  }

  // Broadcast the active graphs list to all connected clients.
  function sendActiveGraphs() {
    const activeGraphs = getCurrentProcesses().map(graphId => ({
      graphId,
      status: isGraphRunning(graphId) ? 'running' : 'stopped'
    }));
    const message = JSON.stringify({ type: 'active_graphs', data: { graphs: activeGraphs } });
    logger.debug("Broadcast active graphs: " + activeGraphs.length);
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on("connection", (ws) => {
    logger.info("Client connected via WebSocket");

    ws.on("message", (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (err) {
        logger.error("Invalid JSON received: " + err.message);
        ws.send(JSON.stringify({ type: "error", data: { message: "Invalid JSON" } }));
        return;
      }

      logger.debug("WS received: " + message);

      // Process the message based on its type.
      switch(data.type) {
        case "open_graph":
          handleOpenGraph(ws, data.data, logger);
          break;
        case "control_graph":
          handleControlGraph(ws, data.data, logger, broadcast);
          break;
        case "update_graph":
          handleUpdateGraph(ws, data.data, logger, broadcast);
          break;
        case "request_sync":
          handleRequestSync(ws, data.data, logger);
          break;
        case "unload_graph":
          handleUnloadGraph(ws, data.data, logger, broadcast);
          break;
        case "get_active_graphs":
          sendActiveGraphs();
          break;
        default:
          ws.send(JSON.stringify({ type: "error", data: { message: "Unknown event type" } }));
      }
    });
  });
}

function handleOpenGraph(ws, payload, logger) {
  if (!payload || !payload.file) {
    ws.send(JSON.stringify({ type: "error", data: { message: "Invalid parameters for open_graph" } }));
    return;
  }
  const result = openGraph(payload.file, logger);
  if (result.error) {
    ws.send(JSON.stringify({ type: "error", data: { message: result.error } }));
  } else {
    ws.send(JSON.stringify({ type: "graph_opened", data: result }));
    logger.info(`Graph ${result.graphId} opened by a client`);
  }
}

function handleControlGraph(ws, payload, logger, broadcast) {
  if (!payload || !payload.graphId || !payload.action) {
    ws.send(JSON.stringify({ type: "error", data: { message: "Invalid parameters for control_graph" } }));
    return;
  }
  const result = controlGraph(payload.graphId, payload.action, logger);
  if (result.error) {
    ws.send(JSON.stringify({ type: "error", data: { message: result.error } }));
  } else {
    broadcast({ type: "graph_status", data: { graphId: payload.graphId, status: result.status } });
    logger.info(`Graph ${payload.graphId} ${payload.action} command processed`);
  }
}

function handleUpdateGraph(ws, payload, logger, broadcast) {
  if (!payload || !payload.graphId || !payload.serializedGraph) {
    ws.send(JSON.stringify({ type: "error", data: { message: "Invalid parameters for update_graph" } }));
    return;
  }
  const result = updateGraph(payload.graphId, payload.serializedGraph, logger);
  if (result.error) {
    ws.send(JSON.stringify({ type: "error", data: { message: result.error } }));
  } else {
    broadcast({ type: "graph_updated", data: { graphId: payload.graphId, serializedGraph: result.serializedGraph } });
    logger.info(`Graph ${payload.graphId} updated`);
  }
}

function handleRequestSync(ws, payload, logger) {
  if (!payload || !payload.graphId) {
    ws.send(JSON.stringify({ type: "error", data: { message: "Invalid parameters for request_sync" } }));
    return;
  }
  const result = requestSync(payload.graphId, logger);
  if (result.error) {
    ws.send(JSON.stringify({ type: "error", data: { message: result.error } }));
  } else {
    ws.send(JSON.stringify({ type: "graph_sync", data: result }));
    logger.info(`Graph ${payload.graphId} sync sent to client`);
  }
}

function handleUnloadGraph(ws, payload, logger, broadcast) {
  if (!payload || !payload.graphId) {
    ws.send(JSON.stringify({ type: "error", data: { message: "Invalid parameters for unload_graph" } }));
    return;
  }
  unloadGraph(payload.graphId, logger);
  broadcast({ type: "graph_status", data: { graphId: payload.graphId, status: "unloaded" } });
  logger.info(`Graph ${payload.graphId} unloaded`);
}
