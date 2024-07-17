/****************************************************************************************
 * DraggableController
 *****************************************************************************************/
import { ReactiveController, ReactiveControllerHost } from "lit";
import { ref } from "lit/directives/ref.js";

export class DraggableController implements ReactiveController {
	accessor #root: HTMLElement | undefined;
	accessor #handle: HTMLElement | undefined;

	mouseDown = false;
	dragging = false;

	start = { x: 0, y: 0 };
	offset = { x: 0, y: 0 };
	last = { x: 0, y: 0 };

	x = 0;
	y = 0;

	constructor(host: ReactiveControllerHost) {
		host.addController(this);
	}

	#onDragStart = (e: MouseEvent) => {
		this.mouseDown = true;

		this.offset = {
			x: e.clientX - this.x,
			y: e.clientY - this.y,
		};

		this.start = {
			x: e.clientX - this.offset.x,
			y: e.clientY - this.offset.y,
		};

		window.addEventListener("mousemove", this.#onDragMove);
		window.addEventListener("mouseup", this.#onDragEnd);
	};

	#onDragMove = (e: MouseEvent) => {
		if (!this.mouseDown) return;

		if (!this.dragging) {
			this.dragging = true;
		}

		// want to constrain the parent bounds to the window
		const bounds = this.#root!.getBoundingClientRect();

		const x = Math.max(
			0,
			Math.min(e.clientX - this.offset.x, window.innerWidth - bounds.width),
		);
		const y = Math.max(
			0,
			Math.min(e.clientY - this.offset.y, window.innerHeight - bounds.height),
		);

		this.x = x;
		this.y = y;

		this.last = { x, y };

		this.#root!.style.transform = `translate(${this.x}px, ${this.y}px)`;
	};

	#onDragEnd = (e: MouseEvent) => {
		this.dragging = false;
		this.mouseDown = false;

		window.removeEventListener("mousemove", this.#onDragMove);
		window.removeEventListener("mouseup", this.#onDragEnd);
	};

	bindRoot() {
		return ref((root) => {
			if (!(root instanceof HTMLElement)) {
				throw new Error("Root must be an HTMLElement");
			}
			this.#root = root;
		});
	}

	bindHandle() {
		return ref((childContainer) => {
			if (!(childContainer instanceof HTMLElement)) {
				throw new Error("Child container must be an HTMLElement");
			}
			this.#handle = childContainer;
		});
	}

	hostUpdated(): void {
		this.#handle?.addEventListener("mousedown", this.#onDragStart);
	}
}

/****************************************************************************************
 * CollapsableController
 *****************************************************************************************/

export class CollapsableController implements ReactiveController {
	#container: HTMLElement | undefined;
	#trigger: HTMLElement | undefined;

	#startPosition = { x: 0, y: 0 };

	hostConnected(): void {
		if (this.collapsed) {
			this.close();
		}
	}

	constructor(host: ReactiveControllerHost, public collapsed = false) {
		host.addController(this);
	}

	#onMouseDown = (e: MouseEvent) => {
		this.#startPosition = { x: e.clientX, y: e.clientY };
	}

	#onMouseUp = (e: MouseEvent) => {
		if (
      this.#startPosition.x !== e.clientX || this.#startPosition.y !== e.clientY
    ) {
      return;
    }
    this.toggle();
	}

	bindTrigger() {
		return ref((trigger) => {
			if (!(trigger instanceof HTMLElement)) {
				throw new Error("Trigger must be an HTMLElement");
			}
			this.#trigger = trigger;
			this.#trigger.addEventListener("mousedown", this.#onMouseDown);
			this.#trigger.addEventListener("mouseup", this.#onMouseUp);
		});
	}

	bindContainer() {
		return ref((container) => {
			if (!(container instanceof HTMLElement)) {
				throw new Error("Container must be an HTMLElement");
			}
			this.#container = container;
		});
	}

	open() {
		this.#container!.style.display = "block"
		this.collapsed = false;
	}

	close() {
		this.#container!.style.display = "none"
		this.collapsed = true;
	}

	toggle() {
		console.log(this.#container?.clientHeight);
		if (this.collapsed) {
			this.open();
		} else {
			this.close();
		}
	}
}

/****************************************************************************************
 * ResizableController
 *****************************************************************************************/

export class ResizableController implements ReactiveController {

	constructor(host: ReactiveControllerHost){
		host.addController(this);
	}

	

}