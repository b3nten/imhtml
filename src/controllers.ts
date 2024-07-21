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

	#onDragEnd = () => {
		this.dragging = false;
		this.mouseDown = false;

		window.removeEventListener("mousemove", this.#onDragMove);
		window.removeEventListener("mouseup", this.#onDragEnd);
	};

	#onWindowResize = () => {
		const bounds = this.#root!.getBoundingClientRect();

		const x = Math.max(
			0,
			Math.min(this.last.x, window.innerWidth - bounds.width),
		);
		const y = Math.max(
			0,
			Math.min(this.last.y, window.innerHeight - bounds.height),
		);

		this.x = x;
		this.y = y;

		this.#root!.style.transform = `translate(${this.x}px, ${this.y}px)`;
	}

	bindRoot() {
		return ref((root) => {
			if (!root) return;
			this.#root = root as HTMLElement;
		});
	}

	bindHandle() {
		return ref((childContainer) => {
			if (!childContainer) return;
			this.#handle = childContainer as HTMLElement;
		});
	}

	hostConnected(): void {
		window.addEventListener("resize", this.#onWindowResize);
	}

	hostDisconnected(): void {
		window.removeEventListener("resize", this.#onWindowResize);
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

	#root: HTMLElement | undefined;

	#startPosition = { x: 0, y: 0 };

	isOpen = true;

	constructor(host: ReactiveControllerHost) {
		host.addController(this);
	}

	hostConnected(): void {
	
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
			if(!trigger) return;
			this.#trigger = trigger as HTMLElement;
			this.#trigger.addEventListener("mousedown", this.#onMouseDown);
			this.#trigger.addEventListener("mouseup", this.#onMouseUp);
		});
	}

	bindContainer() {
		return ref((container) => {
			if(!container) return;
			this.#container = container as HTMLElement;
		});
	}

	bindRoot() {
		return ref((root) => {
			if(!root) return;
			this.#root = root as HTMLElement;
		});
	}

	open({immediate = false} = {}) {
		if(this.isOpen) return;

		const oldRootHeight = this.#root!.getBoundingClientRect().height;
		this.#root!.style.height = `auto`;
		const newRootHeight = this.#root!.getBoundingClientRect().height;

		const anim = this.#root!.animate(
			{ height: [`${oldRootHeight}px`,`${newRootHeight}px`] },
			{
				duration: immediate ? 0 : (newRootHeight - oldRootHeight),
				easing: "ease-in-out",
				fill: "forwards",
			},
		);

		anim.finished.then(() => {
			anim.commitStyles();
			anim.cancel();
			this.isOpen = true;
		})
	}

	close({immediate = false} = {}) {
		if(!this.isOpen) return;

		const oldRootHeight = this.#root!.getBoundingClientRect().height;
		const containerDisplay = this.#container!.style.display;
		this.#container!.style.display = "none";
		this.#root!.style.height = 'auto';
		const newRootHeight = this.#root!.getBoundingClientRect().height;
		this.#container!.style.display = containerDisplay;
		
		const anim = this.#root!.animate(
			{ height: [`${oldRootHeight}px`,`${newRootHeight}px`] },
			{
				duration: immediate ? 0 : (oldRootHeight - newRootHeight),
				easing: "ease-in-out",
				fill: "forwards",
			},
		);

		anim.finished.then(() => {
			anim.commitStyles();
			anim.cancel();
			this.isOpen = false;
		})

	}

	toggle({immediate = false} = {}) {
		if(this.isOpen){
			this.close({ immediate });
		} else {
			this.open({ immediate });
		}
	}
}

