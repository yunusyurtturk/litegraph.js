// Load the LiteGraph library for Node.js
require("../../build_node/litegraph_nodejs.full.cjs");

LiteGraph.debug_level = 2;

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create a new LiteGraph instance
const graph = new LiteGraph.LGraph();

// Define directories for workflows and logs
const workflowsDir = path.join(__dirname, 'workflows');
const logsDir = path.join(__dirname, 'logs');

// Ensure the logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Utility: create a logger that writes to both console and a log file
function createLogger(logFilePath) {
    return function log(message) {
        const timeStampedMessage = `${new Date().toISOString()} - ${message}`;
        console.log(timeStampedMessage);
        fs.appendFile(logFilePath, timeStampedMessage + "\n", (err) => {
            if (err) console.error("Error writing to log file:", err);
        });
    };
}

// Utility: list JSON files in a given directory (case-insensitive)
function listJSONFiles(directory) {
    try {
        const files = fs.readdirSync(directory);
        return files.filter(file => file.match(/\.json$/i));
    } catch (err) {
        console.error("Error reading workflows directory:", err);
        return [];
    }
}

// Create a readline interface for interactive console input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Main function: select workflow, configure graph, and start interactive commands
function main() {
    const jsonFiles = listJSONFiles(workflowsDir);
    if (jsonFiles.length === 0) {
        console.log("No JSON workflow files found in", workflowsDir);
        process.exit(1);
    }

    console.log("Available JSON workflow files:");
    jsonFiles.forEach((file, index) => {
        console.log(`${index + 1}: ${file}`);
    });

    rl.question("Select a file by number: ", (answer) => {
        const choice = parseInt(answer, 10);
        if (isNaN(choice) || choice < 1 || choice > jsonFiles.length) {
            console.log("Invalid choice. Exiting.");
            rl.close();
            process.exit(1);
        }

        const selectedFile = jsonFiles[choice - 1];
        const selectedFilePath = path.join(workflowsDir, selectedFile);
        const workflowName = path.parse(selectedFile).name;
        const logFilePath = path.join(logsDir, `${workflowName}.log`);
        const log = createLogger(logFilePath);
        log(`Selected workflow: ${selectedFilePath}`);

        // Read and parse the JSON file to configure the graph
        fs.readFile(selectedFilePath, 'utf8', (err, data) => {
            if (err) {
                log(`Error reading the file: ${err}`);
                rl.close();
                process.exit(1);
            }
            try {
                const graphJSON = JSON.parse(data);
                graph.configure(graphJSON);
                log("Graph configured successfully.");
            } catch (parseErr) {
                log(`Error parsing JSON: ${parseErr}`);
                rl.close();
                process.exit(1);
            }

            // Enter the interactive command loop
            interactiveLoop(log);
        });
    });
}

// Interactive loop for starting, pausing, stopping, and exiting the graph
function interactiveLoop(log) {
    console.log("\nCommands available: start, pause, stop, exit");
    rl.on('line', (input) => {
        const command = input.trim().toLowerCase();
        switch (command) {
            case 'start':
                log("Starting workflow...");
                graph.start();
                break;
            case 'pause':
                // LiteGraph does not include an explicit pause method.
                // We simulate a pause by stopping the graph.
                log("Pausing workflow (stopping graph)...");
                graph.stop();
                break;
            case 'stop':
                log("Stopping workflow...");
                graph.stop();
                break;
            case 'exit':
                log("Exiting interactive runner...");
                rl.close();
                process.exit(0);
                break;
            default:
                console.log("Unknown command. Please use: start, pause, stop, exit");
        }
    });
}

// Start the interactive runner
main();
