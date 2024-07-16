import {
	css,
	CSSResult,
	html,
	LitElement,
	PropertyValues,
	type ReactiveController,
	type ReactiveControllerHost,
	type TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators.js";
import { ref } from "lit/directives/ref.js";

const baseStyles: CSSResult = css``

/****************************************************************************************
 * Utils
 *****************************************************************************************/

const linear = (t: number): number => t;
const smoothstep = (t: number): number => t * t * (3 - 2 * t);

function animate(
  duration: number,
  callback: (t: number, u: number) => void,
  options: { onComplete?: () => void; ease?: (t: number) => number } = {},
): void {
  let killed = false;

  const start = performance.now();

  const ease = options.ease || linear;

  const loop = (time: number) => {
    const elapsed = time - start;
    const t = ease(Math.min(elapsed / duration, 1));
    callback(t, Math.abs(1 - t));
    if (t < 1) {
      if (!killed) {
        requestAnimationFrame(loop);
      }
    } else {
      if (!killed) {
        options.onComplete?.();
      }
    }
  };

  requestAnimationFrame(loop);

  return {
    kill: () => {
      killed = true;
    },
  };
}

const remap = (value: number, from: [number, number], to: [number, number]): number => {
  const [fromMin, fromMax] = from;
  const [toMin, toMax] = to;
  return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
};

const IMHTMLKey = Symbol("IMHTMLKey");

function keyed<T>(input: object, key: string): T {
	// @ts-ignore
	if(input){
		input[IMHTMLKey] = key;
	}
	return input as T;
}
 
class Scheduler {

	static components: Set<() => void> = new Set();

	static subscribe(updateFunction: () => void) {
		Scheduler.components.add(updateFunction);
	}

	static unsubscribe(updateFunction: () => void) {
		Scheduler.components.delete(updateFunction);
	}

	static update() {
		requestAnimationFrame(Scheduler.update);
		Scheduler.components.forEach(component => component());
	}

	static {
		if(typeof document !== "undefined") {
			requestAnimationFrame(Scheduler.update);
		}
	}
}

export class ImHtmlElement extends LitElement {

	#previousValues: Array<unknown> = [];

	#diff(){
		const recursiveDiff = (a: unknown[], b: unknown[]): boolean => {
			if(a.length !== b.length) {			
				console.log("A")
				return true;
			}

			for(let i = 0; i < a.length; i++) {
				if(a[i] && typeof a[i] === "object" && "_$litType$" in a[i]) {
					if(!b[i] || typeof b[i] !== "object" || !("_$litType$" in b[i])) {
						return true;
					}
					const nestedValues = (a[i] as TemplateResult).values;
					const nestedPreviousValues = (b[i] as TemplateResult).values;
					if(nestedValues.length !== nestedPreviousValues.length) {
						return true;
					}
					if(recursiveDiff(nestedValues, nestedPreviousValues)) {
						return true;
					}
					return false;
				}



				if(Array.isArray(a[i]) && Array.isArray(b[i])) {
					if(IMHTMLKey in a[i] && IMHTMLKey in b[i]) {
						if(a[i][IMHTMLKey] === b[i][IMHTMLKey]) {
							return false;
						}
					}
					return recursiveDiff(a[i], b[i]);
				}

				if(typeof a[i] === "object" && typeof b[i] === "object") {
					if(IMHTMLKey in a?.[i] && IMHTMLKey in b?.[i]) {
						if(a[i][IMHTMLKey] === b[i][IMHTMLKey]) {
							return false;
						}
					}
				}

				if(a[i] !== b[i]) {
					return true;
				}
			}

			return false;
		}

		const output = this.render() as TemplateResult;

		if(recursiveDiff(output.values, this.#previousValues)) {
			this.#previousValues = output.values;
			this.requestUpdate();
		}
	}

	connectedCallback(): void {
		super.connectedCallback();
		Scheduler.subscribe(this.#diff.bind(this));
		this.onMount?.();
	}

	protected updated(_changedProperties: PropertyValues): void {
		super.updated(_changedProperties);
		this.onUpdate?.();
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		Scheduler.unsubscribe(this.#diff.bind(this));
		this.onUnmount?.();
	}

	protected onMount?(): void;
	protected onUpdate?(): void;
	protected onUnmount?(): void;
}

type ObservableProperty<T> = {
	get: () => T;
	set?: (value: T) => void;
}

export function createObservableProperty<T>(object: T): ObservableProperty<T>
export function createObservableProperty<T>(object: Record<string, any>, key?: string): ObservableProperty<T> {
	if(!key) {
		return {
			get: () => object as unknown as T
		}
	}
	return {
		get: () => object[key],
		set: (value: T) => object[key] = value
	}
}

/***************************************************************************************
 * Components
 *****************************************************************************************/

@customElement("iui-number")
export class IUINumber extends ImHtmlElement {

	static styles = css`
		input { 
			width: 100%;
			max-width: 48px;
		}
	`

	value?: ObservableProperty<number>;

	private read(){
		return this.value?.get() || 0;
	}

	private write(value: Event){
		this.value?.set?.(Number((value.target as HTMLInputElement).value));
		this.shadowRoot!.querySelector("input")!.value = String(this.read())
	}

	render(){
		return html`
			<input type="number" value="${this.read()}" @input="${this.write}">
		`;
	}
}

@customElement("iui-string")
export class IUIString extends ImHtmlElement {
	static styles = css``

	value?: ObservableProperty<string>;

	private read(){
		return this.value?.get() || "";
	}

	private write(value: Event){
		this.value?.set?.((value.target as HTMLInputElement).value);
		this.shadowRoot!.querySelector("input")!.value = this.read()
	}

	render(){
		return html`
			<input type="text" value="${this.read()}" @input="${this.write}">
		`;
	}
}

@customElement("iui-boolean")
export class IUIBoolean extends ImHtmlElement {
	static styles = css`
		.disabled {
			pointer-events: none;
			opacity: .5;
		}
	`

	value?: ObservableProperty<boolean>;

	private read(){
		return this.value?.get() || false;
	}

	private write(value: Event){
		this.value?.set?.((value.target as HTMLInputElement).checked);
		this.shadowRoot!.querySelector("input")!.checked = this.read()
	}

	render(){
		if(this.value?.set === undefined){ 
			return html`
				<span>${this.read() ? "True" : "False"}</span>
			`;
		}
		return html`
			<input type="checkbox" ?checked="${this.read()}" @input="${this.write}">
		`;
	}
}

@customElement("iui-range")
export class IUIRange extends ImHtmlElement {
	
	start?: ObservableProperty<number>;
	end?: ObservableProperty<number>;
	value?: ObservableProperty<number>;

	private read(){
		return this.value?.get() || 0;
	}

	private write(value: Event){
		this.value?.set?.(Number((value.target as HTMLInputElement).value));
		this.shadowRoot!.querySelector("input")!.value = String(this.read())
	}

	render(){
		return html`
			<input type="range" min="${this.start}" max="${this.end}" value="${this.read()}" @input="${this.write}">
		`;
	}
}

@customElement("iui-enum")
export class IUIEnum extends ImHtmlElement {
	
}

@customElement("iui-vector")
export class IUIVector extends ImHtmlElement {
	
	value = [0, 0, 0];

	valueObserver(i: number){
		return keyed({
			get: () => this.value[i],
			set: (v: number) => this.value[i] = v
		}, `iui-vector-${i}`);
	}

	protected onUpdate(): void {
		console.log("updated")
	}

	render(){
		return html`
			<div>
				${this.value.map((_, i) => html`
					<iui-number .value="${this.valueObserver(i)}"></iui-number>
				`)}
			</div>
		`;
	}
}

@customElement("iui-button")
export class IUIButton extends ImHtmlElement {
	render(){
		return html`<button><slot></slot></button>`;
	}
}

@customElement("iui-color")
export class IUIColor extends ImHtmlElement {

}

/****************************************************************************************
 * Panel
 *****************************************************************************************/

@customElement("iui-panel")
export class IUIPanel extends LitElement {

	@property({ attribute: true, type: Boolean }) accessor open = true;


	private draggableController = new DraggableController(this);
	private collapsableController = new CollapsableController(this);

	constructor() {
		super();
	
		this.collapsableController.collapsed = !this.open;
	}

	static styles = css`
				${baseStyles}

				.root {
					position: fixed;
					height: auto;
					border-radius: .5rem;
					overflow: hidden;
					background-color: rgba(128, 128, 128);
					min-width: 300px;
					max-width: 600px;
					userSelect: "none";
					transition: "height .3s";
				}

				.header {
					display: flex;
					justify-content: space-between;
					background-color: rgb(100, 100, 100);
					align-items: center;
					gap: .5rem;
					padding: .5rem;
					cursor: pointer;
					user-select: none;
					color: white;
				}

				.container {
					padding: .5rem;
					overflow: hidden;
					transition: opacity .3s;
				}
	`;

	render() {
		return html`
			<div 
				${this.draggableController.bindRoot()} 
				${this.collapsableController.bindRoot()}
				class="root"
			>
				<div 
					class="header" 
					${this.draggableController.bindHandle()}
					${this.collapsableController.bindTrigger()}
				>
					Title
				</div>
				<div
					class="container"
					${this.collapsableController.bindContainer()}
				>
					<slot></slot>
				</div>
			</div>
		`;
	}
}

/****************************************************************************************
 * DraggableController
 *****************************************************************************************/

class DraggableController implements ReactiveController {
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

class CollapsableController implements ReactiveController {
	#container: HTMLElement | undefined;
	#trigger: HTMLElement | undefined;
	#root: HTMLElement | undefined;

	#startPosition = { x: 0, y: 0 };

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

	hostConnected(): void {
		console.log("host connected");
	}

	bindRoot() {
		return ref((root) => {
			if (!(root instanceof HTMLElement)) {
				throw new Error("Root must be an HTMLElement");
			}
			this.#root = root;
		});
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
		const currentHeightStyle = this.#root!.style.height;
    const currentHeight =
		this.#root!.getBoundingClientRect().height;
    this.#root!.style.height = "auto";
    this.#container!.style.display = "block";
    const nextHeight = this.#root!.getBoundingClientRect().height;
    this.#root!.style.height = currentHeightStyle;
    animate(100, (t) => {
      this.#root!.style.height = `${
        remap(t, [0, 1], [currentHeight, nextHeight])
      }px`;
      this.#container!.style.opacity = `${t}`;
    }, { ease: smoothstep });
		this.collapsed = false;
	}

	close() {
		const currentHeight =
		this.#root!.getBoundingClientRect().height;
	const childDisplay = this.#container!.style.display;
	this.#container!.style.display = "none";
	this.#root!.style.height = `auto`;
	const nextHeight = this.#root!!.getBoundingClientRect().height;
	this.#container!.style.display = childDisplay;
	animate(100, (t) => {
		this.#root!.style.height = `${
			remap(t, [0, 1], [currentHeight, nextHeight])
		}px`;
		this.#container!.style.opacity = `${1 - t}`;
	}, { ease: smoothstep });

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