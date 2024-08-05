import { component, convert, css, html, ImHtmlElement, property, track } from "./base";
import { debounce } from "perfect-debounce"
import '@spectrum-web-components/number-field/sp-number-field.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/switch/sp-switch.js';
import '@spectrum-web-components/badge/sp-badge.js';
import '@spectrum-web-components/slider/sp-slider.js';
import '@spectrum-web-components/picker/sync/sp-picker.js'
import '@spectrum-web-components/menu/sp-menu-item.js'

type GetterSetterPair<T> = {
	get?: () => T;
	set?: (value: T) => void;
}

const isGetterSetterPair = <T>(value: T | GetterSetterPair<T>): value is GetterSetterPair<T> => {
	return value 
		&& typeof value === "object" 
		&& !Array.isArray(value) 
		&& (
			"get" in value && typeof value.get === "function" 
			|| "set" in value && typeof value.set === "function"
		);
}

const toGetterSetterPair = <T>(value: T | GetterSetterPair<T>): GetterSetterPair<T> => {
	if(isGetterSetterPair(value)){
		return {
			get: typeof value.get === "function" ? value.get : undefined,
			set: typeof value.set === "function" ? value.set : undefined
		}
	}
	return { get: () => value };
}

const hasSetter = <T>(value: unknown): value is { set: (value: T) => void } => {
	return !!value && typeof value === "object" && ("set" in value && typeof value.set === "function");
}

@component("im-fps")
export class ImHtmlFps extends ImHtmlElement {

	public accessor delta: GetterSetterPair<number> = { get: () => 0 };
	public accessor elapsed = { get: () => 0 };

	render(){
		return html`<sp-badge variant="neutral">${1 / (this.delta.get?.() ?? 1)} FPS</sp-badge>`;
	}
}

@component("im-number")
export class ImHtmlNumber extends ImHtmlElement {

	@convert(toGetterSetterPair)
	@property({ type: Number})
	public accessor value: GetterSetterPair<number> = { get: () => 0 };

	@track()
	private get _value(){
		return this.value.get?.() ?? 0;
	}

	#setValue(e: InputEvent){
		const input = e.target as HTMLInputElement;
		this.value.set?.(Number(input.value));
	}

	@convert(toGetterSetterPair)
	@property({ type: String })
	public accessor label: GetterSetterPair<string> = { get: () => "Number Field" };

	@track() 
	get _label(){
		return this.label.get?.() ?? "Unnamed Number Field";
	}

	render(){
		if(!hasSetter(this.value)){
			return html`<sp-badge variant="neutral">${this._value}</sp-badge>`;
		}
		return html`
			<sp-number-field label=${this._label} value=${this._value} @input=${this.#setValue}></sp-number-field>`;
	}
}

@component("im-textfield")
export class ImHtmlTextField extends ImHtmlElement {

	@property({ converter: toGetterSetterPair })
	public accessor value: GetterSetterPair<string> = { get : () => "" };

	@track()
	private get _value(){
		return this.value.get?.() ?? "";
	}

	#setValue(e: InputEvent){
		const input = e.target as HTMLInputElement;
		this.value.set?.(String(input.value));
	}

	@property({ type: String })
	public accessor label: GetterSetterPair<string> = { get: () => "Text Field" };

	@track() get _label(){
		return this.label.get?.() ?? "Unnamed Text Field";
	}

	render(){
		if(!hasSetter(this.value)){
			return html`<sp-badge variant="neutral">${this._value}</sp-badge>`;
		}
		return html`<sp-textfield label=${this._label} value='${this._value}' @input="${this.#setValue}"></sp-textfield>`;
	}

}

@component("im-text")
export class ImHtmlText extends ImHtmlElement {
	render(){
		return html`<p><slot></slot></p>`;
	}
}

@component("im-button")
export class ImHtmlButton extends ImHtmlElement {

	render(){
		return html`<sp-button><slot></slot></sp-button>`;
	}
}

@component("im-boolean")
export class ImHtmlCheckbox extends ImHtmlElement {

	@convert(toGetterSetterPair)
	@property({ type: Boolean })
	public accessor value: GetterSetterPair<boolean> = { get: () => false };

	@track()
	private get _value(){
		return this.value.get?.() ?? false;
	}

	#setValue(){
		const input = this.renderRoot.querySelector("sp-switch") as any;
		this.value.set?.(input.checked);
	}

	@convert(toGetterSetterPair)
	@property({ type: String })
	public accessor label: GetterSetterPair<string> = { get: () => "Boolean" };

	@track() 
	get _label(){
		return this.label.get?.() ? "on" : "off";
	}

	render(){
		if(!hasSetter(this.value)){
			return html`<sp-badge variant="neutral">${this._value ? "True" : "False"}</sp-badge>`;
		}
		return html`<sp-switch value=${this._value} @change=${this.#setValue}></sp-switch>`;
	}

}

@component("im-range")
export class ImHtmlRange extends ImHtmlElement {

	@convert(toGetterSetterPair)
	@property({ type: Number })
	public accessor value: GetterSetterPair<number> = { get: () => 0 };

	@track()
	private get _value(){
		return String(this.value.get?.() ?? 0);
	}

	#setValue(){
		const component = this.renderRoot.querySelector("sp-slider") as any;
		this.value.set?.(Number(component.value));
		component.value = this._value;
	}

	@convert(toGetterSetterPair)
	@property({ type: String })
	public accessor label: GetterSetterPair<string> = { get: () => "Range" };

	@track() 
	get _label(){
		return this.label.get?.() ?? "Range";
	}

	render(){
		if(!hasSetter(this.value)){
			return html`<sp-badge variant="neutral">${this._value}</sp-badge>`;
		}
		return html`<sp-slider label=${this._label} value=${this._value} @input=${debounce(this.#setValue)}></sp-slider>`;
	}

}

@component("im-textarea")
export class ImHtmlTextarea extends ImHtmlElement {

	static styles = css`
		[interactive="false"]{
			pointer-events: none;
		}
	`;

	@convert(toGetterSetterPair)
	@property({ type: String })
	public accessor value: GetterSetterPair<string> = { get: () => "" };

	@track()
	private get _value(){
		return this.value.get?.() ?? "";
	}

	#setValue(){
		const component = this.renderRoot.querySelector("textarea") as any;
		this.value.set?.(component.value);
		component.value = this._value;
	}

	@convert(toGetterSetterPair)
	@property({ type: String })
	public accessor label: GetterSetterPair<string> = { get: () => "Text Field" };

	@track() get _label(){
		return this.label.get?.() ?? "Unnamed Text Field";
	}

	render(){
		return html`<textarea 
			interactive=${hasSetter(this.value)}
			multiline 
			@input=${this.#setValue}
			.value=${this._value}
			>
			</textarea>`;
	}

}

@component("im-vector")
export class ImHtmlVector extends ImHtmlElement {

	@convert(toGetterSetterPair)
	@property()
	public accessor value: GetterSetterPair<number[]> = { get: () => [] };

	@track()
	private get _value(){
		return this.value.get?.() ?? [];
	}

	#setValue(){
		const component = this.renderRoot.querySelector("textarea") as any;
		this.value.set?.(component.value.split(",").map(Number));
		component.value = this._value.join(",");
	}

	@property({ type: String })
	public accessor label: GetterSetterPair<string> = { get: () => "Vector Field" };

	@track() get _label(){
		return this.label.get?.() ?? "Unnamed Vector Field";
	}

	render(){
		return html`
			${this._value.map((value, index) => html`
				<im-number .value=${{ get: () => value, set: (v: number) => this._value[index] = v }}></im-number>
			`)}
		`;
	}

}

@component("im-enum")
export class ImHtmlSelect extends ImHtmlElement {

	@property({ converter: toGetterSetterPair })
	public accessor value: GetterSetterPair<string> = { get: () => "" };

	@track()
	private get _value(){
		return this.value.get?.() ?? "";
	}

	@convert(toGetterSetterPair)
	@property({ type: String })
	public accessor label: GetterSetterPair<string> = { get: () => "Enum Field" };

	@track() get _label(){
		return this.label.get?.() ?? "Unnamed Enum Field";
	}

	@convert(toGetterSetterPair)
	@property()
	public accessor options: GetterSetterPair<string[]> = { get: () => [] };

	@track() get _options(){
		return this.options.get?.() ?? [];
	}

	private setValue(){
		const component = this.renderRoot.querySelector("sp-picker") as any;
		this.value.set?.(component.value);
		component.value = this._value;
	}

	render(){
		if(!hasSetter(this.value)){
			return html`<sp-badge variant="neutral">${this._value}</sp-badge>`;
		}
		return html`
			<sp-picker value=${this._value} @change=${this.setValue}>
				${this._options.map(option => html`<sp-menu-item>${option}</sp-menu-item>`)}
			</sp-picker>
		`;
	}

}

@component("im-color")
export class ImHtmlColor extends ImHtmlElement {}
