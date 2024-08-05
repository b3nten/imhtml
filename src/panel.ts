import { CollapsableController, DraggableController, ResizeController } from "./controllers";
import { component, css, html, property, track, ImHtmlElement } from "./base";

@component("im-panel")
export class ImPanel extends ImHtmlElement {
	static styles = css`
	.root {
		height: auto;
		border-radius: .5rem;
		overflow: hidden;
		background-color: rgba(128, 128, 128);
		userSelect: "none";
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
	
	.container {
		padding: .5rem;
		overflow: hidden;
		transition: opacity .3s;
	}
`;

	@track() 
	@property({ attribute: true, type: Boolean }) 
	accessor open = false;

	private collapsableController = new CollapsableController(this);
	private draggableController = new DraggableController(this);
	private resizeController = new ResizeController(this);

	render() {
		return html`
			<div
				style=${{ width: "300px", height: "300px" }}
				class="root drag-container"
				${this.resizeController.bindRoot()}
			>
				<div 
					class="header" 
					${this.collapsableController.bindTrigger()}
					${this.draggableController.bindHandle()}
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