import { LiteGraph } from "./litegraph.js";

// @class ContextMenu
export class ContextMenu {
    
    /**
    * @constructor
    * @param {Array} values (allows object { title: "Nice text", callback: function ... })
    * @param {Object} options [optional] Some options:\
    * - title: title to show on top of the menu
    * - callback: function to call when an option is clicked, it receives the item information
    * - ignore_item_callbacks: ignores the callback inside the item, it just calls the options.callback
    * - event: you can pass a MouseEvent, this way the ContextMenu appears in that position
    */
    constructor(values, options = {}) {
        this.options = options;
        options.scroll_speed ??= 0.1;

        this.#linkToParent();
        this.#validateEventClass();


        var root = document.createElement("div");
        root.className = "litegraph litecontextmenu litemenubar-panel";
        if (options.className) {
            root.className += " " + options.className;
        }
        root.style.minWidth = 100;
        root.style.minHeight = 100;


        root.style.pointerEvents = "none";
        setTimeout(() => {
            root.style.pointerEvents = "auto";
        }, 100); //delay so the mouse up event is not caught by this element

        //this prevents the default context browser menu to open in case this menu was created when pressing right button
        root.addEventListener("mouseup", e => {
            //console.log("pointerevents: ContextMenu up root prevent");
            e.preventDefault();
            return true;
        });
        root.addEventListener("contextmenu", e => {
            if (e.button != 2) {
                //right button
                return false;
            }
            e.preventDefault();
            return false;
        });
        root.addEventListener("mousedown", e => {
            //console.log("pointerevents: ContextMenu down");
            if (e.button == 2) {
                this.close();
                e.preventDefault();
                return true;
            }
        });
        root.addEventListener("wheel", e => {
            var pos = parseInt(root.style.top);
            root.style.top =
                (pos + e.deltaY * options.scroll_speed).toFixed() + "px";
            e.preventDefault();
            return true;
        });
        root.addEventListener("mouseenter", e => {
            //console.log("pointerevents: ContextMenu enter");
            if (root.closing_timer) {
                clearTimeout(root.closing_timer);
            }
        });

        this.root = root;

        this.#addTitle();
        this.#addItems(values);
        this.#insertMenu();

        //compute best position
        var left = options.left || 0;
        var top = options.top || 0;
        if (options.event) {
            left = options.event.clientX - 10;
            top = options.event.clientY - 10;
            if (options.title) {
                top -= 20;
            }

            if (options.parentMenu) {
                var rect = options.parentMenu.root.getBoundingClientRect();
                left = rect.left + rect.width;
            }

            var body_rect = document.body.getBoundingClientRect();
            var root_rect = root.getBoundingClientRect();
            if(body_rect.height == 0)
                console.error("document.body height is 0. That is dangerous, set html,body { height: 100%; }");

            if (body_rect.width && left > body_rect.width - root_rect.width - 10) {
                left = body_rect.width - root_rect.width - 10;
            }
            if (body_rect.height && top > body_rect.height - root_rect.height - 10) {
                top = body_rect.height - root_rect.height - 10;
            }
        }

        root.style.left = `${left}px`;
        root.style.top = `${top}px`;

        if (options.scale) {
            root.style.transform = `scale(${options.scale})`;
        }
    }

    #linkToParent() {
        const parentMenu = this.options.parentMenu;
        if (!parentMenu)
            return;
        if (parentMenu.constructor !== this.constructor) {
            console.error("parentMenu must be of class ContextMenu, ignoring it");
            this.options.parentMenu = null;
            return;
        }
        this.parentMenu = parentMenu;
        this.parentMenu.lock = true;
        this.parentMenu.current_submenu = this;
    }

    #validateEventClass() {
        if(!this.options.event)
            return;

        //use strings because comparing classes between windows doesnt work
        const eventClass = this.options.event.constructor.name;
        if ( eventClass !== "MouseEvent" &&
            eventClass !== "CustomEvent" &&
            eventClass !== "PointerEvent"
        ) {
            console.error(
                `Event passed to ContextMenu is not of type MouseEvent or CustomEvent. Ignoring it. (${eventClass})`
            );
            this.options.event = null;
        }
    }

    #addTitle() {
        if (!this.options.title)
            return;
        const element = document.createElement("div");
        element.className = "litemenu-title";
        element.innerHTML = this.options.title;
        this.root.appendChild(element);
    }

    #addItems(values) {
        let num = 0;
    
        for (let i = 0; i < values.length; i++) {
            let name = Array.isArray(values) ? values[i] : i;
    
            if (name && typeof name !== 'string') {
                name = name.content === undefined ? String(name) : name.content;
            }
    
            let value = values[i];
            this.addItem(name, value, this.options);
            num++;
        }
    }

    #insertMenu() {
        const doc = this.options.event?.target.ownerDocument ?? document;
        const parent = doc.fullscreenElement ?? doc.body;
        parent.appendChild(this.root);
    }

    addItem(name, value, options = {}) {
        var that = this;

        var element = document.createElement("div");
        element.className = "litemenu-entry submenu";

        var disabled = false;

        if (value === null) {
            element.classList.add("separator");
            //element.innerHTML = "<hr/>"
            //continue;
        } else {
            element.innerHTML = value && value.title ? value.title : name;
            element.value = value;

            if (value) {
                if (value.disabled) {
                    disabled = true;
                    element.classList.add("disabled");
                }
                if (value.submenu || value.has_submenu) {
                    element.classList.add("has_submenu");
                }
            }

            if (typeof value == "function") {
                element.dataset["value"] = name;
                element.onclick_callback = value;
            } else {
                element.dataset["value"] = value;
            }

            if (value.className) {
                element.className += " " + value.className;
            }
        }

        this.root.appendChild(element);
        if (!disabled) {
            element.addEventListener("click", inner_onclick);
        }
        if (!disabled && options.autoopen) {
            LiteGraph.pointerListenerAdd(element,"enter",inner_over);
        }

        function inner_over(e) {
            var value = this.value;
            if (!value || !value.has_submenu) {
                return;
            }
            //if it is a submenu, autoopen like the item was clicked
            inner_onclick.call(this, e);
        }

        //menu option clicked
        function inner_onclick(e) {
            var value = this.value;
            var close_parent = true;

            if (that.current_submenu) {
                that.current_submenu.close(e);
            }

            //global callback
            if (options.callback) {
                var r = options.callback.call(
                    this,
                    value,
                    options,
                    e,
                    that,
                    options.node
                );
                if (r === true) {
                    close_parent = false;
                }
            }

            //special cases
            if (value) {
                if (
                    value.callback &&
                    !options.ignore_item_callbacks &&
                    value.disabled !== true
                ) {
                    //item callback
                    var r = value.callback.call(
                        this,
                        value,
                        options,
                        e,
                        that,
                        options.extra
                    );
                    if (r === true) {
                        close_parent = false;
                    }
                }
                if (value.submenu) {
                    if (!value.submenu.options) {
                        throw "ContextMenu submenu needs options";
                    }
                    new that.constructor(value.submenu.options, {
                        callback: value.submenu.callback,
                        event: e,
                        parentMenu: that,
                        ignore_item_callbacks:
                            value.submenu.ignore_item_callbacks,
                        title: value.submenu.title,
                        extra: value.submenu.extra,
                        autoopen: options.autoopen
                    });
                    close_parent = false;
                }
            }

            if (close_parent && !that.lock) {
                that.close();
            }
        }

        return element;
    }

    close(e, ignore_parent_menu) {
        if (this.root.parentNode) {
            this.root.parentNode.removeChild(this.root);
        }
        if (this.parentMenu && !ignore_parent_menu) {
            this.parentMenu.lock = false;
            this.parentMenu.current_submenu = null;
            if (e === undefined) {
                this.parentMenu.close();
            } else if (
                e &&
                !ContextMenu.isCursorOverElement(e, this.parentMenu.root)
            ) {
                ContextMenu.trigger(this.parentMenu.root, LiteGraph.pointerevents_method+"leave", e);
            }
        }
        if (this.current_submenu) {
            this.current_submenu.close(e, true);
        }

        if (this.root.closing_timer) {
            clearTimeout(this.root.closing_timer);
        }
        
        // TODO implement : LiteGraph.contextMenuClosed(); :: keep track of opened / closed / current ContextMenu
        // on key press, allow filtering/selecting the context menu elements
    }

    //this code is used to trigger events easily (used in the context menu mouseleave
    static trigger(element, event_name, params, origin) {
        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(event_name, true, true, params); //canBubble, cancelable, detail
        evt.srcElement = origin;
        if (element.dispatchEvent) {
            element.dispatchEvent(evt);
        } else if (element.__events) {
            element.__events.dispatchEvent(evt);
        }
        //else nothing seems binded here so nothing to do
        return evt;
    }

    //returns the top most menu
    getTopMenu() {
        if (this.options.parentMenu) {
            return this.options.parentMenu.getTopMenu();
        }
        return this;
    }

    getFirstEvent() {
        if (this.options.parentMenu) {
            return this.options.parentMenu.getFirstEvent();
        }
        return this.options.event;
    }

    static isCursorOverElement(event, element) {
        var left = event.clientX;
        var top = event.clientY;
        var rect = element.getBoundingClientRect();
        if (!rect) {
            return false;
        }
        if (
            top > rect.top &&
            top < rect.top + rect.height &&
            left > rect.left &&
            left < rect.left + rect.width
        ) {
            return true;
        }
        return false;
    }
}
