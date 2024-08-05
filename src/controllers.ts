import { LitElement, ReactiveController, ReactiveControllerHost } from "lit";
import { ref } from "lit/directives/ref.js";

/****************************************************************************************
 * DraggableController
 *****************************************************************************************/

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

/****************************************************************************************
 * ResizeController
 *****************************************************************************************/

export class ResizeController implements ReactiveController {

	public minimumWidth = 20;
	public minimumHeight = 20;

	public maximumWidth?: number;
	public maximumHeight?: number;

	private leftHandle = document.createElement("div");
	private rightHandle = document.createElement("div");
	private topHandle = document.createElement("div");
	private bottomHandle = document.createElement("div");

	private isCurrentlyResizing = false;
	private resizeDirection: "left" | "right" | "top" | "bottom" | "none" = "none";

	private positions = {
		width: 0,
		height: 0,
		x: 0,
		y: 0,
		mouseX: 0,
		mouseY: 0
	}

	constructor(private host: LitElement){
		host.addController(this);
		this.leftHandle.classList.add("imhtml-resizable-handle-left");
		this.leftHandle.dataset.direction = "left";

		this.rightHandle.classList.add("imhtml-resizable-handle-right");
		this.rightHandle.dataset.direction = "right";

		this.topHandle.classList.add("imhtml-resizable-handle-top");
		this.topHandle.dataset.direction = "top";

		this.bottomHandle.classList.add("imhtml-resizable-handle-bottom");
		this.bottomHandle.dataset.direction = "bottom";
	}

	hostConnected(){
		const style = document.createElement("style");
		style.innerHTML = this.styleSheet;
		this.host.renderRoot.appendChild(style);
	}

	hostDisconnected(){
		for(const handle of [this.leftHandle, this.rightHandle, this.topHandle, this.bottomHandle]){
			handle.removeEventListener("mousedown", this.onMouseDown);
		}
		window.removeEventListener("mousemove", this.onMouseMove);
		window.removeEventListener("mouseup", this.onMouseUp);
	}

	public bindRoot(){
		return ref((element) => {
			this.updateRoot(element);
		});
	}

	private styleSheet = `
		.imhtml-resizable-handle-left {
			background-color: rgba(0, 255, 0, 0.5);
			position: absolute;
			top: 0;
			left: -3px;
			width: 6px;
			height: 100%;
			cursor: ew-resize;
		}

		.imhtml-resizable-handle-right {
			background-color: rgba(0, 255, 0, 0.5);
			position: absolute;
			top: 0;
			right: -3px;
			width: 6px;
			height: 100%;
			cursor: ew-resize;
		}

		.imhtml-resizable-handle-top {
			background-color: rgba(0, 255, 0, 0.5);
			position: absolute;
			top: -3px;
			left: 0;
			width: 100%;
			height: 6px;
			cursor: ns-resize;
		}

		.imhtml-resizable-handle-bottom {
			background-color: rgba(0, 255, 0, 0.5);
			position: absolute;
			bottom: -3px;
			left: 0;
			width: 100%;
			height: 6px;
			cursor: ns-resize;
	`

	private updateRoot(element?: Element){
		if(!element) return;
		for(const handle of [this.leftHandle, this.rightHandle, this.topHandle, this.bottomHandle]){
			if(!element.contains(handle)){
				handle.addEventListener("mousedown", this.onMouseDown as EventListener);
				element.appendChild(handle);
			}
		}
	}

	private onMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		this.isCurrentlyResizing = true;

		this.resizeDirection = (e.target as HTMLElement).dataset.direction as "left" | "right" | "top" | "bottom";

		this.positions.width = parseFloat(getComputedStyle(this, null).getPropertyValue('width').replace('px', ''));
		this.positions.height = parseFloat(getComputedStyle(this, null).getPropertyValue('height').replace('px', ''));

		this.positions.x = this.getBoundingClientRect().left;
		this.positions.y = this.getBoundingClientRect().top;

		this.positions.mouseX = e.pageX;
		this.positions.mouseY = e.pageY;

		window.addEventListener("mousemove", this.onMouseMove);
	}

	private onMouseMove = (e: MouseEvent) => {
		window.addEventListener("mouseup", this.onMouseUp);

		if(!this.isCurrentlyResizing) return;

		switch(this.resizeDirection){
			case "left": {
				/*
				new_width = element_original_width - (mouseX - original_mouseX)
  			new_x = element_original_x - (mouseX - original_mouseX)
				*/

				const newWidth = this.positions.width - (e.pageX - this.positions.mouseX);
				const newX = this.positions.x - (e.pageX - this.positions.mouseX);

				if(this.maximumWidth && newWidth > this.maximumWidth) return;
				if(newWidth < this.minimumWidth) return;

				this.style.width = `${newWidth}px`;
				this.style.left = `${newX}px`;

				break;
			}
			case "right": {

				break;
			}
			case "top":{

				break;
			}
			case "bottom": {
				
				break;
			}
		}
	}

	private onMouseUp = () => {
		this.isCurrentlyResizing = false;
		this.resizeDirection = "none";
		window.removeEventListener("mousemove", this.onMouseMove);
		window.removeEventListener("mouseup", this.onMouseUp);
	}
}