import { CollapsableController, DraggableController } from "./controllers";
import { component, css, html, property, watch, ImHtmlElement } from "./base";

@component("iui-panel")
export class IUIPanel extends ImHtmlElement {

	static styles = css`
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
	
	.container {
		padding: .5rem;
		overflow: hidden;
		transition: opacity .3s;
	}
`;

	@watch() 
	@property({ attribute: true, type: Boolean }) 
	accessor open = true;

	private draggableController = new DraggableController(this);

	private collapsableController = new CollapsableController(this);

	constructor() {
		super();
		this.collapsableController.collapsed = !this.open;
	}

	render() {
		return html`
			<div 
				${this.draggableController.bindRoot()} 
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

export class ResizableController {

	bindRoot(element: HTMLElement) {
		const resizersWrapper = document.createElement("div");
		const resizerTopLeft = document.createElement("div");
		const resizerTopRight = document.createElement("div");
		const resizerBottomLeft = document.createElement("div");
		const resizerBottomRight = document.createElement("div");
	}
	
	onMouseDown(e: MouseEvent) {
		window.addEventListener("mousemove", this.onMouseMove);
	}

	onMouseMove(e: MouseEvent){
		// resize logic here
	}

	onMouseUp(e: MouseEvent) {
		window.removeEventListener("mousemove", this.onMouseMove);
	}

	styles = `
		<style>
			.resizers {

			}

			.resizer {
				
			}
		</style>
	`
}

export class ResizeWrapper extends HTMLElement {	

	static get observedAttributes(){
		return ["min-width", "max-width", "min-height", "max-height"];
	}

	controller = new ResizableController();

	connectedCallback() {
		this.innerHTML = `${this.controller.styles}${this.innerHTML}`
		const root = this.firstChild
		if(!(root instanceof HTMLElement)){
			console.error("Root must be an HTMLElement");
			return;
		}
		this.controller.bindRoot(root);
	}
}

customElements.define("resize-wrapper", ResizeWrapper);