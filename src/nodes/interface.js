import { LiteGraph } from "../litegraph.js";

class WidgetButton {

    static title = "Button";
    static desc = "Triggers an event";

    constructor() {
        this.addOutput("", LiteGraph.EVENT);
        this.addOutput("", "boolean");
        this.addProperty("text", "DO");
        this.addProperty("font_size", 30);
        this.addProperty("message", "");
        this.size = [84, 84];
        this.clicked = false;
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) {
            return;
        }
        var margin = 10;
        ctx.fillStyle = "black";
        ctx.fillRect(
            margin + 1,
            margin + 1,
            this.size[0] - margin * 2,
            this.size[1] - margin * 2,
        );
        ctx.fillStyle = "#AAF";
        ctx.fillRect(
            margin - 1,
            margin - 1,
            this.size[0] - margin * 2,
            this.size[1] - margin * 2,
        );
        ctx.fillStyle = this.clicked ? "white" : this.mouseOver ? "#668" : "#334";
        ctx.fillRect(
            margin,
            margin,
            this.size[0] - margin * 2,
            this.size[1] - margin * 2,
        );

        if (this.properties.text || this.properties.text === 0) {
            var font_size = this.properties.font_size || 30;
            ctx.textAlign = "center";
            ctx.fillStyle = this.clicked ? "black" : "white";
            ctx.font = font_size + "px " + WidgetButton.font;
            ctx.fillText(
                this.properties.text,
                this.size[0] * 0.5,
                this.size[1] * 0.5 + font_size * 0.3,
            );
            ctx.textAlign = "left";
        }
    }

    onMouseDown(e, local_pos) {
        console.warn("DBG","WidgetButton","onMouseDown",this);
        if (
            local_pos[0] > 1 &&
            local_pos[1] > 1 &&
            local_pos[0] < this.size[0] - 2 &&
            local_pos[1] < this.size[1] - 2
        ) {
            LiteGraph.log_info("WidgetButton","clicked inside");
            this.clicked = true;
            // execute instead just reading input (force update)
            this.doExecute();
            this.triggerSlot(0, this.properties.message);
            return true;
        }else{
            LiteGraph.log_info("WidgetButton","clicked outside");
        }
    }

    onExecute() {
        this.setOutputData(1, this.clicked);
    }

    onMouseUp(_e) {
        this.clicked = false;
        LiteGraph.log_info("WidgetButton","mouse up");
    }

    static font = "Arial";
}
LiteGraph.registerNodeType("widget/button", WidgetButton);


class WidgetToggle {

    static title = "Toggle";
    static desc = "Toggles between true or false";

    constructor() {
        this.addInput("", "boolean");
        this.addInput("e", LiteGraph.ACTION);
        this.addOutput("v", "boolean");
        this.addOutput("e", LiteGraph.EVENT);
        this.properties = { font: "", value: false };
        this.size = [160, 44];
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) {
            return;
        }

        var size = this.size[1] * 0.5;
        var margin = 0.25;
        var h = this.size[1] * 0.8;
        ctx.font = this.properties.font || (size * 0.8).toFixed(0) + "px Arial";
        var w = ctx.measureText(this.title).width;
        var x = (this.size[0] - (w + size)) * 0.5;

        ctx.fillStyle = "#AAA";
        ctx.fillRect(x, h - size, size, size);

        ctx.fillStyle = this.properties.value ? "#AEF" : "#000";
        ctx.fillRect(
            x + size * margin,
            h - size + size * margin,
            size * (1 - margin * 2),
            size * (1 - margin * 2),
        );

        ctx.textAlign = "left";
        ctx.fillStyle = "#AAA";
        ctx.fillText(this.title, size * 1.2 + x, h * 0.85);
        ctx.textAlign = "left";
    }

    onAction(_action) {
        this.properties.value = !this.properties.value;
        this.trigger("e", this.properties.value);
    }

    onExecute() {
        var v = this.getInputData(0);
        if (v != null) {
            this.properties.value = v;
        }
        this.setOutputData(0, this.properties.value);
    }

    onMouseDown(e, local_pos) {
        if (
            local_pos[0] > 1 &&
            local_pos[1] > 1 &&
            local_pos[0] < this.size[0] - 2 &&
            local_pos[1] < this.size[1] - 2
        ) {
            this.properties.value = !this.properties.value;
            this.graph._version++;
            this.trigger("e", this.properties.value);
            return true;
        }
    }
}
LiteGraph.registerNodeType("widget/toggle", WidgetToggle);


class WidgetNumber {

    static title = "Number";
    static desc = "Widget to select number value";

    constructor() {
        this.addOutput("", "number");
        this.size = [80, 60];
        this.properties = { min: -1000, max: 1000, value: 1, step: 1 };
        this.old_y = -1;
        this._remainder = 0;
        this._precision = 0;
        this.mouse_captured = false;
    }

    onDrawForeground(ctx) {
        var x = this.size[0] * 0.5;
        var h = this.size[1];
        if (h > 30) {
            ctx.fillStyle = WidgetNumber.markers_color;
            ctx.beginPath();
            ctx.moveTo(x, h * 0.1);
            ctx.lineTo(x + h * 0.1, h * 0.2);
            ctx.lineTo(x + h * -0.1, h * 0.2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, h * 0.9);
            ctx.lineTo(x + h * 0.1, h * 0.8);
            ctx.lineTo(x + h * -0.1, h * 0.8);
            ctx.fill();
            ctx.font = (h * 0.7).toFixed(1) + "px Arial";
        } else {
            ctx.font = (h * 0.8).toFixed(1) + "px Arial";
        }

        ctx.textAlign = "center";
        ctx.font = (h * 0.7).toFixed(1) + "px Arial";
        ctx.fillStyle = "#EEE";
        ctx.fillText(this.properties.value.toFixed(this._precision), x, h * 0.75);
    }

    onExecute() {
        this.setOutputData(0, this.properties.value);
    }

    onPropertyChanged(_name, _value) {
        var t = (this.properties.step + "").split(".");
        this._precision = t.length > 1 ? t[1].length : 0;
    }

    onMouseDown(e, pos) {
        if (pos[1] < 0) {
            return;
        }

        this.old_y = e.canvasY;
        this.captureInput(true);
        this.mouse_captured = true;

        return true;
    }

    onDblClick(e, pos, canvas){ 
        console.warn("onDblClick", ...arguments);
        // NO, this is for title, etc.: canvas.doShowNodeInfoEditor(this, this.getPropertyInfo("value"), e);
        // NO, this is to open the whole parameter list: doShowMenuNodeProperties
        canvas.showEditPropertyValue(this, "value", { event: e/* position: pos */ });
        this.prevent_up = true;
        e.preventDefault();
        e.stopPropagation();
        return true;
    }

    onMouseMove(e) {
        if (!this.mouse_captured) {
            return;
        }

        var delta = this.old_y - e.canvasY;
        if (e.shiftKey) {
            delta *= 10;
        }
        if (e.metaKey || e.altKey) {
            delta *= 0.1;
        }
        this.old_y = e.canvasY;

        var steps = this._remainder + delta / WidgetNumber.pixels_threshold;
        this._remainder = steps % 1;
        steps = steps | 0;

        var v = LiteGraph.clamp(
            this.properties.value + steps * this.properties.step,
            this.properties.min,
            this.properties.max,
        );
        this.properties.value = v;
        this.graph._version++;
        this.setDirtyCanvas(true);
    }

    onMouseUp(e, pos) {
        if(this.prevent_up){
            this.prevent_up = false;
            return;
        }
        if (e.click_time < 200) {
            var steps = pos[1] > this.size[1] * 0.5 ? -1 : 1;
            // TOOD use setProperty
            this.properties.value = LiteGraph.clamp(
                this.properties.value + steps * this.properties.step,
                this.properties.min,
                this.properties.max,
            );
            this.graph._version++;
            this.setDirtyCanvas(true);
        }

        if (this.mouse_captured) {
            this.mouse_captured = false;
            this.captureInput(false);
        }
    }
    static pixels_threshold = 10;
    static markers_color = "#666";
}
LiteGraph.registerNodeType("widget/number", WidgetNumber);

/* Combo ****************/

class WidgetCombo {

    static title = "Combo";
    static desc = "Widget to select from a list";

    constructor() {
        this.addOutput("", "string");
        this.addOutput("change", LiteGraph.EVENT);
        this.size = [80, 60];
        this.properties = { value: "A", values: "A;B;C" };
        this.old_y = -1;
        this.mouse_captured = false;
        this._values = this.properties.values.split(";");
        var that = this;
        this.widgets_up = true;
        this.widget = this.addWidget(
            "combo",
            "",
            this.properties.value,
            function (v) {
                that.properties.value = v;
                that.triggerSlot(1, v);
            },
            { property: "value", values: this._values },
        );
    }

    onExecute() {
        this.setOutputData(0, this.properties.value);
    }

    onPropertyChanged(name, value) {
        if (name == "values") {
            this._values = value.split(";");
            this.widget.options.values = this._values;
        } else if (name == "value") {
            this.widget.value = value;
        }
    }
}
LiteGraph.registerNodeType("widget/combo", WidgetCombo);


class WidgetKnob {

    static title = "Knob";
    static desc = "Circular controller";
    static size = [80, 100];

    constructor() {
        this.addOutput("", "number");
        this.size = [64, 84];
        this.properties = {
            min: 0,
            max: 1,
            value: 0.5,
            color: "#7AF",
            precision: 2,
        };
        this.value = -1;
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) {
            return;
        }

        if (this.value == -1) {
            this.value =
                (this.properties.value - this.properties.min) /
                (this.properties.max - this.properties.min);
        }

        var center_x = this.size[0] * 0.5;
        var center_y = this.size[1] * 0.5;
        var radius = Math.min(this.size[0], this.size[1]) * 0.5 - 5;
        // var w = Math.floor(radius * 0.05); //@BUG: unused variable, test without

        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(center_x, center_y);
        ctx.rotate(Math.PI * 0.75);

        // bg
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, 0, Math.PI * 1.5);
        ctx.fill();

        // value
        ctx.strokeStyle = "black";
        ctx.fillStyle = this.properties.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 4, 0, Math.PI * 1.5 * Math.max(0.01, this.value));
        ctx.closePath();
        ctx.fill();
        // ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.restore();

        // inner
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(center_x, center_y, radius * 0.75, 0, Math.PI * 2, true);
        ctx.fill();

        // miniball
        ctx.fillStyle = this.mouseOver ? "white" : this.properties.color;
        ctx.beginPath();
        var angle = this.value * Math.PI * 1.5 + Math.PI * 0.75;
        ctx.arc(
            center_x + Math.cos(angle) * radius * 0.65,
            center_y + Math.sin(angle) * radius * 0.65,
            radius * 0.05,
            0,
            Math.PI * 2,
            true,
        );
        ctx.fill();

        // text
        ctx.fillStyle = this.mouseOver ? "white" : "#AAA";
        ctx.font = Math.floor(radius * 0.5) + "px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            this.properties.value.toFixed(this.properties.precision),
            center_x,
            center_y + radius * 0.15,
        );
    }

    onExecute() {
        this.setOutputData(0, this.properties.value);
        this.boxcolor = LiteGraph.colorToString([
            this.value,
            this.value,
            this.value,
        ]);
    }

    onMouseDown(e) {
        this.center = [this.size[0] * 0.5, this.size[1] * 0.5 + 20];
        this.radius = this.size[0] * 0.5;
        if (
            e.canvasY - this.pos[1] < 20 ||
            LiteGraph.distance(
                [e.canvasX, e.canvasY],
                [this.pos[0] + this.center[0], this.pos[1] + this.center[1]],
            ) > this.radius
        ) {
            return false;
        }
        this.oldmouse = [e.canvasX - this.pos[0], e.canvasY - this.pos[1]];
        this.captureInput(true);
        return true;
    }

    onMouseMove(e) {
        if (!this.oldmouse) {
            return;
        }

        var m = [e.canvasX - this.pos[0], e.canvasY - this.pos[1]];

        var v = this.value;
        v -= (m[1] - this.oldmouse[1]) * 0.01;
        if (v > 1.0) {
            v = 1.0;
        } else if (v < 0.0) {
            v = 0.0;
        }
        this.value = v;
        this.properties.value =
            this.properties.min +
            (this.properties.max - this.properties.min) * this.value;
        this.oldmouse = m;
        this.setDirtyCanvas(true);
    }

    onMouseUp(_e) {
        if (this.oldmouse) {
            this.oldmouse = null;
            this.captureInput(false);
        }
    }

    onPropertyChanged(name, value) {
        if (name == "min" || name == "max" || name == "value") {
            this.properties[name] = parseFloat(value);
            return true; // block
        }
    }
}
LiteGraph.registerNodeType("widget/knob", WidgetKnob);


// Show value inside the debug console
class WidgetSliderGUI {

    static title = "Inner Slider";

    constructor() {
        this.addOutput("", "number");
        this.properties = {
            value: 0.5,
            min: 0,
            max: 1,
            text: "V",
        };
        var that = this;
        this.size = [140, 40];
        this.slider = this.addWidget(
            "slider",
            "V",
            this.properties.value,
            function (v) {
                that.properties.value = v;
            },
            this.properties,
        );
        this.widgets_up = true;
    }

    onPropertyChanged(name, value) {
        if (name == "value") {
            this.slider.value = value;
        }
    }

    onExecute() {
        this.setOutputData(0, this.properties.value);
    }
}
LiteGraph.registerNodeType("widget/internal_slider", WidgetSliderGUI);


// Widget H SLIDER
class WidgetHSlider {

    static title = "H.Slider";
    static desc = "Linear slider controller";

    constructor() {
        this.size = [160, 26];
        this.addOutput("", "number");
        this.properties = { color: "#7AF", min: 0, max: 1}; //, value: 0.5 };
        this.addProperty("value", 0.5, "number", {prevent_input_bind: true}); // readonly: false, 
        this.value = -1;
    }

    onDrawForeground(ctx) {
        if (this.value == -1) {
            this.value =
                (this.properties.value - this.properties.min) /
                (this.properties.max - this.properties.min);
        }

        // border
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.fillStyle = "#000";
        ctx.fillRect(2, 2, this.size[0] - 4, this.size[1] - 4);

        ctx.fillStyle = this.properties.color;
        ctx.beginPath();
        ctx.rect(4, 4, (this.size[0] - 8) * this.value, this.size[1] - 8);
        ctx.fill();
    }

    onExecute() {
        this.properties.value =
            this.properties.min +
            (this.properties.max - this.properties.min) * this.value;
        this.setOutputData(0, this.properties.value);
        this.boxcolor = LiteGraph.colorToString([
            this.value,
            this.value,
            this.value,
        ]);
    }

    onMouseDown(e) {
        if (e.canvasY - this.pos[1] < 0) {
            return false;
        }

        this.oldmouse = [e.canvasX - this.pos[0], e.canvasY - this.pos[1]];
        this.captureInput(true);
        return true;
    }

    onMouseMove(e) {
        if (!this.oldmouse) {
            return;
        }

        var m = [e.canvasX - this.pos[0], e.canvasY - this.pos[1]];

        var v = this.value;
        var delta = m[0] - this.oldmouse[0];
        v += delta / this.size[0];
        if (v > 1.0) {
            v = 1.0;
        } else if (v < 0.0) {
            v = 0.0;
        }

        this.value = v;

        this.oldmouse = m;
        this.setDirtyCanvas(true);
    }

    onMouseUp(_e) {
        this.oldmouse = null;
        this.captureInput(false);
    }
}
LiteGraph.registerNodeType("widget/hslider", WidgetHSlider);


class WidgetProgress {

    static title = "Progress";
    static desc = "Shows data in linear progress";

    constructor() {
        this.size = [160, 26];
        this.addInput("", "number");
        this.properties = { min: 0, max: 1, value: 0, color: "#AAF" };
    }

    onExecute() {
        var v = this.getInputData(0);
        if (v != undefined) {
            this.properties["value"] = v;
        }
    }

    onDrawForeground(ctx) {
        // border
        ctx.lineWidth = 1;
        ctx.fillStyle = this.properties.color;
        var v =
            (this.properties.value - this.properties.min) /
            (this.properties.max - this.properties.min);
        v = Math.min(1, v);
        v = Math.max(0, v);
        ctx.fillRect(2, 2, (this.size[0] - 4) * v, this.size[1] - 4);
    }
}
LiteGraph.registerNodeType("widget/progress", WidgetProgress);


class WidgetText {

    static title = "Text";
    static desc = "Shows the input value";
    // @BUG: Will draw text straight off the node with no wrapping

    constructor() {
        this.addInputs("", 0);
        this.properties = {
            value: "...",
            font: "Arial",
            fontsize: 18,
            color: "#AAA",
            align: "left",
            glowSize: 0,
            decimals: 1,
        };
    }

    onDrawForeground(ctx) {
        // ctx.fillStyle="#000";
        // ctx.fillRect(0,0,100,60);
        ctx.fillStyle = this.properties["color"];
        var v = this.properties["value"];

        if (this.properties["glowSize"]) {
            ctx.shadowColor = this.properties.color;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = this.properties["glowSize"];
        } else {
            ctx.shadowColor = "transparent";
        }

        var fontsize = this.properties["fontsize"];

        ctx.textAlign = this.properties["align"];
        ctx.font = fontsize.toString() + "px " + this.properties["font"];
        this.str =
            typeof v == "number" ? v.toFixed(this.properties["decimals"]) : v;

        if (typeof this.str == "string") {
            var lines = this.str.replace(/[\r\n]/g, "\\n").split("\\n");
            for (var i = 0; i < lines.length; i++) {
                ctx.fillText(
                    lines[i],
                    this.properties["align"] == "left" ? 15 : this.size[0] - 15,
                    fontsize * -0.15 + fontsize * (parseInt(i) + 1),
                );
            }
        }

        ctx.shadowColor = "transparent";
        this.last_ctx = ctx;
        ctx.textAlign = "left";
    }

    onExecute() {
        var v = this.getInputData(0);
        if (v != null) {
            this.properties["value"] = v;
        }
        // this.setDirtyCanvas(true);
    }

    resize() {
        if (!this.last_ctx) {
            return;
        }

        var lines = this.str.split("\\n");
        this.last_ctx.font =
            this.properties["fontsize"] + "px " + this.properties["font"];
        var max = 0;
        for (var i = 0; i < lines.length; i++) {
            var w = this.last_ctx.measureText(lines[i]).width;
            if (max < w) {
                max = w;
            }
        }
        this.size[0] = max + 20;
        this.size[1] = 4 + lines.length * this.properties["fontsize"];

        this.setDirtyCanvas(true);
    }

    onPropertyChanged(name, value) {
        this.properties[name] = value;
        this.str = typeof value == "number" ? value.toFixed(3) : value;
        // this.resize();
        return true;
    }

    static widgets = [
        { name: "resize", text: "Resize box", type: "button" },
        { name: "led_text", text: "LED", type: "minibutton" },
        { name: "normal_text", text: "Normal", type: "minibutton" },
    ];
}
LiteGraph.registerNodeType("widget/text", WidgetText);


class WidgetPanel {

    static title = "Panel";
    static desc = "Non interactive panel";

    constructor() {
        this.size = [200, 100];
        this.properties = {
            borderColor: "#ffffff",
            bgcolorTop: "#f0f0f0",
            bgcolorBottom: "#e0e0e0",
            shadowSize: 2,
            borderRadius: 3,
        };
    }

    createGradient(ctx) {
        if (
            this.properties["bgcolorTop"] == "" ||
            this.properties["bgcolorBottom"] == ""
        ) {
            this.lineargradient = 0;
            return;
        }

        this.lineargradient = ctx.createLinearGradient(0, 0, 0, this.size[1]);
        this.lineargradient.addColorStop(0, this.properties["bgcolorTop"]);
        this.lineargradient.addColorStop(1, this.properties["bgcolorBottom"]);
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) {
            return;
        }

        if (this.lineargradient == null) {
            this.createGradient(ctx);
        }

        if (!this.lineargradient) {
            return;
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = this.properties["borderColor"];
        // ctx.fillStyle = "#ebebeb";
        ctx.fillStyle = this.lineargradient;

        if (this.properties["shadowSize"]) {
            ctx.shadowColor = "#000";
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = this.properties["shadowSize"];
        } else {
            ctx.shadowColor = "transparent";
        }

        ctx.roundRect(
            0,
            0,
            this.size[0] - 1,
            this.size[1] - 1,
            this.properties["shadowSize"],
        );
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.stroke();
    }
    widgets = [{ name: "update", text: "Update", type: "button" }];
}
LiteGraph.registerNodeType("widget/panel", WidgetPanel);
