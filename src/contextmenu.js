import { LiteGraph } from "./litegraph.js";

export class ContextMenu {

    /**
    * @constructor
    * @param {Array<Object>} values (allows object { title: "Nice text", callback: function ... })
    * @param {Object} options [optional] Some options:\
    * - title: title to show on top of the menu
    * - callback: function to call when an option is clicked, it receives the item information
    * - ignore_item_callbacks: ignores the callback inside the item, it just calls the options.callback
    * - event: you can pass a MouseEvent, this way the ContextMenu appears in that position
    *
    *   Rendering notes: This is only relevant to rendered graphs, and is rendered using HTML+CSS+JS.
    */
    constructor(values, options = {}) {
        this.options = options;
        options.scroll_speed ??= 0.1;

        this.#linkToParent();
        this.#validateEventClass();
        this.#createRoot();
        this.#bindEvents();
        this.setTitle(this.options.title);
        this.addItems(values);
        this.#insertMenu();
        this.#calculateBestPosition();
    }

    #createRoot() {
        const root = this.root = document.createElement("div");
        if (this.options.className) {
            root.className = this.options.className;
        }
        root.classList.add("litegraph","litecontextmenu","litemenubar-panel");
        root.style.minWidth = "80px";
        root.style.minHeight = "10px";
        return root;
    }

    #bindEvents() {
        const root = this.root;

        root.style.pointerEvents = "none";
        setTimeout(() => {
            root.style.pointerEvents = "auto";
        }, 100); // delay so the mouse up event is not caught by this element

        // this prevents the default context browser menu to open in case this menu was created when pressing right button
        root.addEventListener("mouseup", (e) => {
            // console.log("pointerevents: ContextMenu up root prevent");
            e.preventDefault();
            return true;
        });
        root.addEventListener("contextmenu", (e) => {
            if (e.button != 2) {
                // right button
                return false;
            }
            e.preventDefault();
            return false;
        });
        root.addEventListener("mousedown", (e) => {
            // console.log("pointerevents: ContextMenu down");
            if (e.button == 2) {
                this.close();
                e.preventDefault();
                return true;
            }
        });
        root.addEventListener("wheel", (e) => {
            var pos = parseInt(root.style.top);
            root.style.top =
                (pos + e.deltaY * this.options.scroll_speed).toFixed() + "px";
            e.preventDefault();
            return true;
        });
        root.addEventListener("mouseenter", (_event) => {
            // console.log("pointerevents: ContextMenu enter");
            if (root.closing_timer) {
                clearTimeout(root.closing_timer);
            }
        });
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

        // use strings because comparing classes between windows doesnt work
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

    /**
     * Creates a title element if it doesn't have one.
     * Sets the title of the menu.
     * @param {string} title - The title to be set.
     */
    setTitle(title) {
        if (!title)
            return;
        this.titleElement ??= document.createElement("div");
        const element = this.titleElement;
        element.className = "litemenu-title";
        element.innerHTML = title;
        if(!this.root.parentElement)
            this.root.appendChild(element);
    }

    /**
     * Adds a set of values to the menu.
     * @param {Array<string|object>} values - An array of values to be added.
     */
    addItems(values) {

        for (let i = 0; i < values.length; i++) {
            let name = values[i];

            if (typeof name !== 'string') {
                name = name && name.content !== undefined ? String(name.content) : String(name);
            }

            let value = values[i];
            this.addItem(name, value, this.options);
        }
    }

    #insertMenu() {
        const doc = this.options.event?.target.ownerDocument ?? document;
        const parent = doc.fullscreenElement ?? doc.body;
        parent.appendChild(this.root);
    }

    #calculateBestPosition() {
        const options = this.options;
        const root = this.root;

        let left = options.left || 0;
        let top = options.top || 0;
        if (options.event) {
            left = options.event.clientX - 10;
            top = options.event.clientY - 10;

            if (options.title) {
                top -= 20;
            }

            if (options.parentMenu) {
                const rect = options.parentMenu.root.getBoundingClientRect();
                left = rect.left + rect.width;
            }

            const body_rect = document.body.getBoundingClientRect();
            const root_rect = root.getBoundingClientRect();
            if(body_rect.height === 0)
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

    /**
     * Adds an item to the menu.
     * @param {string} name - The name of the item.
     * @param {object | null} value - The value associated with the item.
     * @param {object} [options={}] - Additional options for the item.
     * @returns {HTMLElement} - The created HTML element representing the added item.
     */
    addItem(name, value, options = {}) {

        const element = document.createElement("div");
        element.className = "litemenu-entry submenu";

        let disabled = false;

        if (value === null) {
            element.classList.add("separator");
        } else {
            element.innerHTML = value?.title ?? name;
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
            element.addEventListener("click", handleMenuItemClick);
        }
        if (!disabled && options.autoopen) {
            element.addEventListener("mouseenter",(event) => {
                const value = this.value;
                if (!value || !value.has_submenu) {
                    return;
                }
                // if it is a submenu, autoopen like the item was clicked
                handleMenuItemClick.call(this, event);
            });
        }

        var that = this;

        function handleMenuItemClick(event) {
            const value = this.value;
            let closeParent = true;

            // Close any current submenu
            that.current_submenu?.close(event);

            // Execute global callback
            if (options.callback) {
                const globalCallbackResult = options.callback.call(this, value, options, event, that, options.node);
                if (globalCallbackResult === true) {
                    closeParent = false;
                }
            }

            // Handle special cases
            if (value) {
                if (value.callback && !options.ignore_item_callbacks && value.disabled !== true) {
                    // Execute item callback
                    const itemCallbackResult = value.callback.call(this, value, options, event, that, options.extra);
                    if (itemCallbackResult === true) {
                        closeParent = false;
                    }
                }
                if (value.submenu) {
                    if (!value.submenu.options) {
                        throw new Error("ContextMenu submenu needs options");
                    }
                    // Recursively create submenu
                    new that.constructor(value.submenu.options, {
                        callback: value.submenu.callback,
                        event: event,
                        parentMenu: that,
                        ignore_item_callbacks: value.submenu.ignore_item_callbacks,
                        title: value.submenu.title,
                        extra: value.submenu.extra,
                        autoopen: options.autoopen
                    });
                    closeParent = false;
                }
            }

            // Close parent menu if necessary and not locked
            if (closeParent && !that.lock) {
                that.close();
            }
        }
        return element;
    }

    /**
     * Closes this menu.
     * @param {Event} [e] - The event that triggered the close action.
     * @param {boolean} [ignore_parent_menu=false] - Whether to ignore the parent menu when closing.
     */
    close(e, ignore_parent_menu) {

        this.root.parentNode?.removeChild(this.root);

        if (this.parentMenu && !ignore_parent_menu) {
            this.parentMenu.lock = false;
            this.parentMenu.current_submenu = null;
            if (e === undefined) {
                this.parentMenu.close();
            } else if (
                e &&
                !ContextMenu.isCursorOverElement(e, this.parentMenu.root)
            ) {
                ContextMenu.trigger(this.parentMenu.root, "mouseleave", e);
            }
        }
        this.current_submenu?.close(e, true);

        if (this.root.closing_timer) {
            clearTimeout(this.root.closing_timer);
        }

        // TODO implement : LiteGraph.contextMenuClosed(); :: keep track of opened / closed / current ContextMenu
        // on key press, allow filtering/selecting the context menu elements
    }

    /**
     * Closes all open ContextMenus in the specified window.
     * @param {Window} [ref_window=window] - The window object to search for open menus.
     */
    static closeAll = (ref_window = window) => {
        const elements = ref_window.document.querySelectorAll(".litecontextmenu");
        if (!elements.length)
            return;

        elements.forEach((element) => {
            if (element.close) {
                element.close();
            } else {
                element.parentNode?.removeChild(element);
            }
        });
    };

    /**
     * Triggers an event on the specified element with the given event name and parameters.
     * @param {HTMLElement} element - The element on which to trigger the event.
     * @param {string} event_name - The name of the event to trigger.
     * @param {Object} params - Additional parameters to include in the event.
     * @param {HTMLElement} origin - The origin of the event <currently not supported as CustomEvent can't have a target!>
     * @returns {CustomEvent} - The created CustomEvent instance.
     * @BUG: Probable bug related to params, origin not being configured/populated correctly
     */
    static trigger(element, event_name, params, origin) {
        const event = new CustomEvent(event_name, params );
        if (element.dispatchEvent) {
            element.dispatchEvent(event);
        } else if (element.__events) {
            element.__events.dispatchEvent(event);
        }
        return event;
    }

    // returns the top most menu
    getTopMenu() {
        return this.options.parentMenu?.getTopMenu() ?? this;
    }

    getFirstEvent() {
        return this.options.parentMenu?.getFirstEvent() ?? this.options.event;
    }

    static isCursorOverElement(event, element) {
        return LiteGraph.isInsideRectangle(
            event.clientX, event.clientY, element.left, element.top, element.width, element.height
        );
    }
}
