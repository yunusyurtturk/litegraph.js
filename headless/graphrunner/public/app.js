// public/app.js
import { LiteGraph } from "../../build/litegraph.full.js";

/* =================== WebSocket Client =================== */
class WebSocketClient {
  constructor(url, onMessage) {
    this.url = url;
    this.onMessage = onMessage;
    this.reconnect();
  }

  reconnect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket connected.");
      this.fetchActiveGraphs();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onMessage(message);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.warn("WebSocket connection lost. Reconnecting...");
      setTimeout(() => this.reconnect(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  send(type, data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn("WebSocket not connected. Cannot send message.", type, data);
    }
  }

  fetchActiveGraphs() {
    this.send("get_active_graphs", {});
  }
}

/* =================== File Explorer =================== */
class FileExplorer {
  constructor(elementId, onFileSelect) {
    this.element = document.getElementById(elementId);
    this.onFileSelect = onFileSelect;
    this.currentPath = "/";
    this.loadFiles();
  }

  loadFiles() {
    // Using the /api/list_files endpoint.
    fetch(`/api/list_files?path=${encodeURIComponent(this.currentPath)}`)
      .then(res => res.json())
      .then(files => this.renderFiles(files))
      .catch(err => console.error("Error fetching files:", err));
  }

  renderFiles(files) {
    this.element.innerHTML = "";
    // Add parent folder navigation if not at root.
    if (this.currentPath !== "/") {
      const li = document.createElement("li");
      li.className = "list-group-item list-group-item-action";
      li.textContent = ".. (parent folder)";
      li.style.cursor = "pointer";
      li.onclick = () => {
        let parts = this.currentPath.split("/");
        parts.pop(); // remove empty string
        parts.pop(); // remove current folder
        this.currentPath = parts.length ? parts.join("/") + "/" : "/";
        this.loadFiles();
      };
      this.element.appendChild(li);
    }
    // Render each file/folder.
    files.forEach(file => {
      const li = document.createElement("li");
      li.className = "list-group-item list-group-item-action";
      li.textContent = file;
      li.style.cursor = "pointer";
      li.onclick = () => {
        if (file.endsWith("/")) {
          // Folder: navigate into it.
          this.currentPath += file;
          this.loadFiles();
        } else {
          // File: send open_graph request.
          this.onFileSelect(this.currentPath + file);
        }
      };
      this.element.appendChild(li);
    });
  }
}

/* =================== Tab Manager =================== */
class TabManager {
  constructor(elementId, onLastTabClosed) {
    this.element = document.getElementById(elementId);
    this.tabs = {};
    this.onLastTabClosed = onLastTabClosed;
  }

  addTab(tabId, title, state, onClickCallback) {
    if (this.tabs[tabId]) return; // Prevent duplicate tabs.

    const li = document.createElement("li");
    li.className = "nav-item d-flex align-items-center";
    const a = document.createElement("a");
    a.className = "nav-link";
    a.href = "#";
    // Visualization state is always "paused"
    a.innerHTML = `${title} <span class="badge bg-secondary">paused</span>`;
    a.onclick = (e) => {
      e.preventDefault();
      this.activateTab(tabId);
      if (onClickCallback) onClickCallback();
    };

    // Close button to remove the tab.
    const closeBtn = document.createElement("button");
    closeBtn.className = "btn-close ms-2";
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.removeTab(tabId);
    };

    li.appendChild(a);
    li.appendChild(closeBtn);
    this.element.appendChild(li);
    this.tabs[tabId] = { li, a };
  }

  updateTabState(tabId, state) {
    if (this.tabs[tabId]) {
      const regex = /<span.*<\/span>/;
      this.tabs[tabId].a.innerHTML = this.tabs[tabId].a.innerHTML.replace(
        regex,
        `<span class="badge bg-secondary">${state}</span>`
      );
    }
  }

  removeTab(tabId) {
    if (this.tabs[tabId]) {
      this.element.removeChild(this.tabs[tabId].li);
      delete this.tabs[tabId];
    }
    // If no tabs remain, clear the canvas.
    if (Object.keys(this.tabs).length === 0 && typeof clearCanvas === "function") {
      clearCanvas();
    }
  }

  activateTab(tabId) {
    Object.values(this.tabs).forEach(tab => tab.a.classList.remove("active"));
    if (this.tabs[tabId]) this.tabs[tabId].a.classList.add("active");
  }
}

/* =================== Graph Viewer =================== */
class GraphViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.graph = null;
    this.editor = null;
  }

  loadGraph(serializedGraph) {
    this.graph = new LiteGraph.LGraph();
    try {
      this.graph.configure(serializedGraph);
    } catch (err) {
      console.error("Graph configuration error:", err);
    }
    this.editor = new LiteGraph.LGraphCanvas("#" + this.canvas.id, this.graph);
    this.editor.read_only = true;
  }

  updateGraph(serializedGraph) {
    if (this.graph) {
      try {
        this.graph.configure(serializedGraph);
        if (this.editor) this.editor.setDirty(true);
      } catch (err) {
        console.error("Error updating graph:", err);
      }
    }
  }

  toggleReadOnly() {
    if (this.editor) {
      this.editor.read_only = !this.editor.read_only;
      return this.editor.read_only ? "Read-Only" : "Editable";
    }
    return "Unknown";
  }

  clearCanvas() {
    if (this.canvas.getContext) {
      const ctx = this.canvas.getContext("2d");
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.graph = null;
    this.editor = null;
  }
}

/* =================== Graph Controls =================== */
class GraphControls {
  constructor(runBtnId, pauseBtnId, toggleBtnId) {
    this.runBtn = document.getElementById(runBtnId);
    this.pauseBtn = document.getElementById(pauseBtnId);
    this.toggleBtn = document.getElementById(toggleBtnId);
  }

  onRun(callback) {
    this.runBtn.onclick = callback;
  }

  onPause(callback) {
    this.pauseBtn.onclick = callback;
  }

  onToggle(callback) {
    this.toggleBtn.onclick = callback;
  }
}

/* =================== Console Logger =================== */
class ConsoleLogger {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
  }

  log(message) {
    const div = document.createElement("div");
    // Prepend a timestamp to each message.
    const now = new Date().toLocaleTimeString();
    div.textContent = `[${now}] ${message}`;
    this.element.appendChild(div);
    this.element.scrollTop = this.element.scrollHeight;
  }

  clear() {
    this.element.innerHTML = "";
  }
}

/* =================== Active Graphs List =================== */
class ActiveGraphsList {
  constructor(elementId, wsClient) {
    this.element = document.getElementById(elementId);
    this.wsClient = wsClient;
  }

  updateGraphs(graphs) {
    this.element.innerHTML = "";
    graphs.forEach(({ graphId, status }) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        ${graphId} - <span class="badge bg-secondary">${status}</span>
        <div>
          <button class="btn btn-sm btn-success">Start</button>
          <button class="btn btn-sm btn-warning">Stop</button>
          <button class="btn btn-sm btn-danger">Unload</button>
        </div>
      `;
      const [startBtn, stopBtn, unloadBtn] = li.querySelectorAll("button");
      // Send commands: "start" to run, "stop" to pause.
      startBtn.onclick = () => this.wsClient.send("control_graph", { graphId, action: "start" });
      stopBtn.onclick = () => this.wsClient.send("control_graph", { graphId, action: "stop" });
      unloadBtn.onclick = () => this.wsClient.send("unload_graph", { graphId });
      this.element.appendChild(li);
    });
  }
}

/* =================== Global State =================== */
const graphsStore = {}; // { graphId: { serializedGraph, status } }
let currentGraphId = null;

/* =================== Instantiate Components =================== */
const wsClient = new WebSocketClient("ws://localhost:3000", handleWebSocketMessage);
const fileExplorer = new FileExplorer("filesList", (file) =>
  wsClient.send("open_graph", { file })
);
const tabManager = new TabManager("tabs", clearCanvas);
const graphViewer = new GraphViewer("graphCanvas");
const graphControls = new GraphControls("runBtn", "pauseBtn", "toggleBtn");
const consoleLogger = new ConsoleLogger("consoleOutput");
const activeGraphsList = new ActiveGraphsList("graphsList", wsClient);

/* Global function to clear the canvas when no tabs are open */
function clearCanvas() {
  graphViewer.clearCanvas();
}

/* =================== WebSocket Message Handler =================== */
function handleWebSocketMessage(message) {
  switch (message.type) {
    case "active_graphs":
      activeGraphsList.updateGraphs(message.data.graphs);
      break;
    case "graph_opened": {
      const { graphId, serializedGraph } = message.data;
      // Normalize graphId across visualization and execution.
      graphsStore[graphId] = { serializedGraph, status: "paused" };
      tabManager.addTab(graphId, graphId, "paused", () => {
        currentGraphId = graphId;
        graphViewer.loadGraph(serializedGraph);
      });
      tabManager.activateTab(graphId);
      currentGraphId = graphId;
      graphViewer.loadGraph(serializedGraph);
      break;
    }
    case "graph_status": {
      const { graphId, status } = message.data;
      // Update Active Graphs list with execution state.
      if (graphsStore[graphId]) {
        graphsStore[graphId].status = status;
        // The visualization (tab) remains "paused" but execution state is shown in the list.
        tabManager.updateTabState(graphId, "paused");
        consoleLogger.log(`Graph ${graphId} execution status: ${status}`);
      }
      break;
    }
    case "graph_updated":
    case "graph_sync": {
      const { graphId, serializedGraph } = message.data;
      if (currentGraphId === graphId) {
        graphViewer.updateGraph(serializedGraph);
      }
      break;
    }
    case "console": {
      // Display console events with optional graphId filtering.
      let msg = message.data.message;
      if (message.data.graphId) {
        msg = `[${message.data.graphId}] ${msg}`;
      }
      consoleLogger.log(msg);
      break;
    }
    case "error":
      consoleLogger.log("Error: " + message.data.message);
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
}

/* =================== Controls Events =================== */
graphControls.onRun(() => {
  if (!currentGraphId) return;
  wsClient.send("control_graph", { graphId: currentGraphId, action: "start" });
});
graphControls.onPause(() => {
  if (!currentGraphId) return;
  wsClient.send("control_graph", { graphId: currentGraphId, action: "stop" });
});
graphControls.onToggle(() => {
  const mode = graphViewer.toggleReadOnly();
  consoleLogger.log(`Graph canvas is now ${mode}`);
});

/* =================== Additional Control Buttons =================== */
// Stop All button: sends a "stop_all_graphs" command.
document.getElementById("stopAllBtn").onclick = () => {
  wsClient.send("stop_all_graphs", {});
  consoleLogger.log("Sent stop_all_graphs command to server.");
};

// Clear Console button: clears the console output area.
document.getElementById("clearConsoleBtn").onclick = () => {
  consoleLogger.clear();
};

/* Optionally, periodically refresh active graphs */
setInterval(() => {
  wsClient.fetchActiveGraphs();
}, 5000);
