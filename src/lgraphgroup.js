import { LiteGraph } from "./litegraph.js";
import { LGraphCanvas } from "./lgraphcanvas.js";
import { LGraphNode } from "./lgraphnode.js";

export class LGraphGroup {

    /**
     * Constructor for the LGraphGroup class.
     * @param {string} [title="Group"] - The title of the group.
     */
    constructor(title = "Group") {

        this.title = title;
        this.font_size = 24;
        this.color = LGraphCanvas.node_colors.pale_blue?.groupcolor ?? "#AAA";
        this._bounding = new Float32Array([10, 10, 140, 80]);
        this._pos = this._bounding.subarray(0, 2);
        this._size = this._bounding.subarray(2, 4);
        this._nodes = [];
        this.graph = null;
    }

    set pos(v) {
        if (!v || v.length < 2) {
            return;
        }
        this._pos[0] = v[0];
        this._pos[1] = v[1];
    }
    get pos() {
        return this._pos;
    }

    set size(v) {
        if (!v || v.length < 2) {
            return;
        }
        this._size[0] = Math.max(140, v[0]);
        this._size[1] = Math.max(80, v[1]);
    }
    get size() {
        return this._size;
    }

    /**
     * Updates the properties of the LGraphGroup instance based on the provided configuration object.
     * @param {Object} o - The configuration object with properties to update.
     * @param {string} o.title - The new title for the group.
     * @param {Float32Array} o.bounding - The new bounding box for the group.
     * @param {string} o.color - The new color for the group.
     * @param {number} o.font_size - The new font size for the group.
     */
    configure(o) {
        this.title = o.title;
        this._bounding.set(o.bounding);
        this.color = o.color;
        this.font_size = o.font_size;
    }

    /**
     * Serializes the LGraphGroup instance into a plain JavaScript object.
     * @returns {Object} - The serialized representation of the LGraphGroup instance.
     * - title: string - The title of the group.
     * - bounding: Array<number> - The bounding box coordinates [x, y, width, height].
     * - color: string - The color of the group.
     * - font_size: number - The font size of the group.
     */
    serialize() {
        var b = this._bounding;
        return {
            title: this.title,
            bounding: [
                Math.round(b[0]),
                Math.round(b[1]),
                Math.round(b[2]),
                Math.round(b[3])
            ],
            color: this.color,
            font_size: this.font_size
        };
    }

    /**
     * Moves the LGraphGroup instance by the specified deltas and optionally updates the positions of contained nodes.
     * @param {number} deltax - The amount to move the group along the x-axis.
     * @param {number} deltay - The amount to move the group along the y-axis.
     * @param {boolean} ignore_nodes - Flag to indicate whether to move contained nodes along with the group.
     */
    move(deltax, deltay, ignore_nodes) {
        this._pos[0] += deltax;
        this._pos[1] += deltay;
        if (ignore_nodes) {
            return;
        }
        for (var i = 0; i < this._nodes.length; ++i) {
            var node = this._nodes[i];
            node.pos[0] += deltax;
            node.pos[1] += deltay;
        }
    }

    /**
     * Recomputes and updates the list of nodes inside the LGraphGroup based on their bounding boxes.
     * This method checks for nodes that overlap with the group's bounding box and updates the internal nodes list accordingly.
     */
    recomputeInsideNodes() {
        this._nodes.length = 0;
        var nodes = this.graph._nodes;
        var node_bounding = new Float32Array(4);

        for (var i = 0; i < nodes.length; ++i) {
            var node = nodes[i];
            node.getBounding(node_bounding);
            if (!LiteGraph.overlapBounding(this._bounding, node_bounding)) {
                continue;
            } //out of the visible area
            this._nodes.push(node);
        }
    }

    isPointInside = LGraphNode.prototype.isPointInside;
    setDirtyCanvas = LGraphNode.prototype.setDirtyCanvas;
}
