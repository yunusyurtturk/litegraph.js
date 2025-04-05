(function(global) {
    var LiteGraph = global.LiteGraph;

    // -------------------------------
    // MySQL Connection Node
    // -------------------------------
    function MySQLConnectionNode() {
        this.addOutput("connection", "MySQLConnection");
        // Define default connection parameters
        this.properties = {
            host: "localhost",
            user: "root",
            password: "",
            database: "test"
        };
        this.connection = null;
    }
    MySQLConnectionNode.title = "MySQL Connection";
    MySQLConnectionNode.desc = "Establish a connection to a MySQL database";

    MySQLConnectionNode.prototype.onExecute = function() {
        // Create connection if it does not exist
        if (!this.connection) {
            var mysql = require("mysql");
            this.connection = mysql.createConnection({
                host: this.properties.host,
                user: this.properties.user,
                password: this.properties.password,
                database: this.properties.database
            });
            this.connection.connect(function(err) {
                if (err)
                    console.error("MySQL Connection Error: ", err);
            });
        }
        // Output the connection for downstream nodes
        this.setOutputData(0, this.connection);
    };

    LiteGraph.registerNodeType("mysql/connection", MySQLConnectionNode);

    // -------------------------------
    // MySQL Query Node
    // -------------------------------
    function MySQLQueryNode() {
        this.addInput("trigger", LiteGraph.ACTION);
        this.addInput("connection", "MySQLConnection");
        this.addInput("query", "string");
        this.addOutput("result", "object");
        this.addOutput("error", "object");
    }
    MySQLQueryNode.title = "MySQL Query";
    MySQLQueryNode.desc = "Execute a SQL query on a MySQL database";

    MySQLQueryNode.prototype.onAction = function(action, param) {
        if (action === "trigger") {
            var conn = this.getInputData(1);
            var query = this.getInputData(2);
            if (!conn || !query) return;
            var node = this;
            conn.query(query, function(err, results) {
                if (err) {
                    node.setOutputData(1, err);
                    node.triggerSlot(1);
                } else {
                    node.setOutputData(0, results);
                    node.triggerSlot(0);
                }
            });
        }
    };

    LiteGraph.registerNodeType("mysql/query", MySQLQueryNode);

    // -------------------------------
    // MySQL Insert Node
    // -------------------------------
    function MySQLInsertNode() {
        this.addInput("trigger", LiteGraph.ACTION);
        this.addInput("connection", "MySQLConnection");
        this.addInput("table", "string");
        this.addInput("data", "object");
        this.addOutput("result", "object");
        this.addOutput("error", "object");
    }
    MySQLInsertNode.title = "MySQL Insert";
    MySQLInsertNode.desc = "Insert a record into a MySQL table";

    MySQLInsertNode.prototype.onAction = function(action, param) {
        if (action === "trigger") {
            var conn = this.getInputData(1);
            var table = this.getInputData(2);
            var data = this.getInputData(3);
            if (!conn || !table || !data) return;
            var node = this;
            var sql = "INSERT INTO ?? SET ?";
            conn.query(sql, [table, data], function(err, results) {
                if (err) {
                    node.setOutputData(1, err);
                    node.triggerSlot(1);
                } else {
                    node.setOutputData(0, results);
                    node.triggerSlot(0);
                }
            });
        }
    };

    LiteGraph.registerNodeType("mysql/insert", MySQLInsertNode);

    // -------------------------------
    // MySQL Update Node
    // -------------------------------
    function MySQLUpdateNode() {
        this.addInput("trigger", LiteGraph.ACTION);
        this.addInput("connection", "MySQLConnection");
        this.addInput("table", "string");
        this.addInput("data", "object");
        this.addInput("where", "object");
        this.addOutput("result", "object");
        this.addOutput("error", "object");
    }
    MySQLUpdateNode.title = "MySQL Update";
    MySQLUpdateNode.desc = "Update records in a MySQL table";

    MySQLUpdateNode.prototype.onAction = function(action, param) {
        if (action === "trigger") {
            var conn = this.getInputData(1);
            var table = this.getInputData(2);
            var data = this.getInputData(3);
            var where = this.getInputData(4);
            if (!conn || !table || !data || !where) return;
            var node = this;
            var sql = "UPDATE ?? SET ? WHERE ?";
            conn.query(sql, [table, data, where], function(err, results) {
                if (err) {
                    node.setOutputData(1, err);
                    node.triggerSlot(1);
                } else {
                    node.setOutputData(0, results);
                    node.triggerSlot(0);
                }
            });
        }
    };

    LiteGraph.registerNodeType("mysql/update", MySQLUpdateNode);

    // -------------------------------
    // MySQL Delete Node
    // -------------------------------
    function MySQLDeleteNode() {
        this.addInput("trigger", LiteGraph.ACTION);
        this.addInput("connection", "MySQLConnection");
        this.addInput("table", "string");
        this.addInput("where", "object");
        this.addOutput("result", "object");
        this.addOutput("error", "object");
    }
    MySQLDeleteNode.title = "MySQL Delete";
    MySQLDeleteNode.desc = "Delete records from a MySQL table";

    MySQLDeleteNode.prototype.onAction = function(action, param) {
        if (action === "trigger") {
            var conn = this.getInputData(1);
            var table = this.getInputData(2);
            var where = this.getInputData(3);
            if (!conn || !table || !where) return;
            var node = this;
            var sql = "DELETE FROM ?? WHERE ?";
            conn.query(sql, [table, where], function(err, results) {
                if (err) {
                    node.setOutputData(1, err);
                    node.triggerSlot(1);
                } else {
                    node.setOutputData(0, results);
                    node.triggerSlot(0);
                }
            });
        }
    };

    LiteGraph.registerNodeType("mysql/delete", MySQLDeleteNode);

    // -------------------------------
    // MySQL Transaction Node
    // -------------------------------
    function MySQLTransactionNode() {
        this.addInput("trigger", LiteGraph.ACTION);
        this.addInput("connection", "MySQLConnection");
        // The "command" input can be a SQL command such as "BEGIN", "COMMIT", or "ROLLBACK"
        this.addInput("command", "string");
        this.addOutput("result", "object");
        this.addOutput("error", "object");
    }
    MySQLTransactionNode.title = "MySQL Transaction";
    MySQLTransactionNode.desc = "Manage transactions: BEGIN, COMMIT, or ROLLBACK";

    MySQLTransactionNode.prototype.onAction = function(action, param) {
        if (action === "trigger") {
            var conn = this.getInputData(1);
            var command = this.getInputData(2);
            if (!conn || !command) return;
            var node = this;
            conn.query(command, function(err, results) {
                if (err) {
                    node.setOutputData(1, err);
                    node.triggerSlot(1);
                } else {
                    node.setOutputData(0, results);
                    node.triggerSlot(0);
                }
            });
        }
    };

    LiteGraph.registerNodeType("mysql/transaction", MySQLTransactionNode);

})(this);
