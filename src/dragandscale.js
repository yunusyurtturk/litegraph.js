import { LiteGraph } from "./litegraph.js";

//Scale and Offset
export class DragAndScale {

    constructor(element, skip_events) {

        this.offset = new Float32Array([0, 0]);
        this.scale = 1;
        this.max_scale = 10;
        this.min_scale = 0.1;
        this.onredraw = null;
        this.enabled = true;
        this.last_mouse = [0, 0];
        this.element = null;
        this.visible_area = new Float32Array(4);

        if (element) {
            this.element = element;
            if (!skip_events) {
                this.bindEvents(element);
            }
        }
    }

    /**
     * Binds mouse and wheel events to the specified HTML element.
     *
     * @param {HTMLElement} element - The HTML element to bind the events to.
     */
    bindEvents(element) {
        this.last_mouse = new Float32Array(2);
        element.addEventListener("mousedown", this.onMouseDown);
        element.addEventListener("wheel", this.onWheel);
    }

    onMouseDown = (e) => {
        if (!this.enabled) {
            return;
        }

        const canvas = this.element;
        const rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        e.canvasx = x;
        e.canvasy = y;
        e.dragging = this.dragging;
        
        var is_inside = !this.viewport || ( this.viewport && x >= this.viewport[0] && x < (this.viewport[0] + this.viewport[2]) && y >= this.viewport[1] && y < (this.viewport[1] + this.viewport[3]) );

        if (is_inside) {
            this.dragging = true;
            this.abortController = new AbortController();
            document.addEventListener("mousemove",this.onMouseMove, { signal: this.abortController.signal });
            document.addEventListener("mouseup",this.onMouseUp, { signal: this.abortController.signal });
        } 

        this.last_mouse[0] = x;
        this.last_mouse[1] = y;

    }

    onMouseMove = (e) => {
        if (!this.enabled) {
            return;
        }

        const canvas = this.element;
        const rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        e.canvasx = x;
        e.canvasy = y;
        e.dragging = this.dragging;
        
        var is_inside = !this.viewport || ( this.viewport && x >= this.viewport[0] && x < (this.viewport[0] + this.viewport[2]) && y >= this.viewport[1] && y < (this.viewport[1] + this.viewport[3]) );


        var deltax = x - this.last_mouse[0];
        var deltay = y - this.last_mouse[1];
        if (this.dragging) {
            this.mouseDrag(deltax, deltay);
        }

        this.last_mouse[0] = x;
        this.last_mouse[1] = y;

    }

    onMouseUp = (event) => {
        this.dragging = false;
        this.abortController?.abort();
    }

    onWheel = (event) => {
        event.wheel = -event.deltaY;
            
        //from stack overflow
        event.delta = event.wheelDelta
            ? event.wheelDelta / 40
            : event.deltaY
            ? -event.deltaY / 3
            : 0;
        this.changeDeltaScale(1.0 + event.delta * 0.05);
    }

    /**
     * Computes the visible area of the DragAndScale element based on the viewport.
     * 
     * If the element is not set, the visible area will be reset to zero.
     * 
     * @param {Array<number>} [viewport] - The viewport configuration to calculate the visible area. 
     */
    computeVisibleArea(viewport) {
        if (!this.element) {
            this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0;
            return;
        }
        var width = this.element.width;
        var height = this.element.height;
        var startx = -this.offset[0];
        var starty = -this.offset[1];
        if( viewport )
        {
            startx += viewport[0] / this.scale;
            starty += viewport[1] / this.scale;
            width = viewport[2];
            height = viewport[3];
        }
        var endx = startx + width / this.scale;
        var endy = starty + height / this.scale;
        this.visible_area[0] = startx;
        this.visible_area[1] = starty;
        this.visible_area[2] = endx - startx;
        this.visible_area[3] = endy - starty;
    }

    /**
     * Applies the scale and offset transformations to the given 2D canvas rendering context.
     *
     * @param {CanvasRenderingContext2D} ctx - The 2D canvas rendering context to apply transformations to.
     */
    toCanvasContext(ctx) {
        ctx.scale(this.scale, this.scale);
        ctx.translate(this.offset[0], this.offset[1]);
    }

    /**
     * Converts a position from DragAndScale offset coordinates to canvas coordinates.
     *
     * @param {Array<number>} pos - The position in DragAndScale offset coordinates to convert.
     * @returns {Array<number>} The converted position in canvas coordinates.
     */
    convertOffsetToCanvas(pos) {
        return [
            (pos[0] + this.offset[0]) * this.scale,
            (pos[1] + this.offset[1]) * this.scale
        ];
    }

    /**
     * Converts a position from canvas coordinates to DragAndScale offset coordinates.
     *
     * @param {Array<number>} pos - The position in canvas coordinates to convert.
     * @param {Array<number>} [out=[0, 0]] - The output array to store the converted position in DragAndScale offset coordinates.
     * @returns {Array<number>} The converted position in DragAndScale offset coordinates.
     */
    convertCanvasToOffset(pos, out = [0, 0]) {
        out[0] = pos[0] / this.scale - this.offset[0];
        out[1] = pos[1] / this.scale - this.offset[1];
        return out;
    }

    mouseDrag(x, y) {
        this.offset[0] += x / this.scale;
        this.offset[1] += y / this.scale;

        this.onredraw?.(this);
    }

    /**
     * Changes the scale of the DragAndScale element to the specified value around the zooming center.
     *
     * @param {number} value - The new scale value to set, clamped between min_scale and max_scale.
     * @param {Array<number>} zooming_center - The center point for zooming, defaulting to the middle of the element.
     */
    changeScale(value, zooming_center) {

        value = LiteGraph.clamp(value, this.min_scale, this.max_scale);
        
        if (value == this.scale || !this.element) {
            return;
        }
        const rect = this.element.getBoundingClientRect();
        if (!rect) {
            return;
        }

        zooming_center = zooming_center || [
            rect.width * 0.5,
            rect.height * 0.5
        ];

        var center = this.convertCanvasToOffset(zooming_center);
        this.scale = value;
        if (Math.abs(this.scale - 1) < 0.01) {
            this.scale = 1;
        }

        var new_center = this.convertCanvasToOffset(zooming_center);
        var delta_offset = [
            new_center[0] - center[0],
            new_center[1] - center[1]
        ];

        this.offset[0] += delta_offset[0];
        this.offset[1] += delta_offset[1];

        this.onredraw?.(this);
    }

    /**
     * Changes the scale of the DragAndScale element by a delta value relative to the current scale.
     *
     * @param {number} value - The delta value by which to scale the element.
     * @param {Array<number>} zooming_center - The center point for zooming the element.
     */
    changeDeltaScale(value, zooming_center) {
        this.changeScale(this.scale * value, zooming_center);
    }

    reset() {
        this.scale = 1;
        this.offset[0] = 0;
        this.offset[1] = 0;
    }
}
