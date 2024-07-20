import { component, html, ImHtmlElement, property, watch } from "./base";
import '@spectrum-web-components/number-field/sp-number-field.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/switch/sp-switch.js';


type GetterSetterPair<T> = {
	get?: () => T;
	set?: (value: T) => void;
}

const isGetterSetterPair = <T>(value: T | GetterSetterPair<T>): value is GetterSetterPair<T> => {
	return value && typeof value === "object" && ("get" in value || "set" in value);
}

const toGetterSetterPair = <T>(value: T | GetterSetterPair<T>): GetterSetterPair<T> => {
	if(isGetterSetterPair(value)){
		return {
			get: value?.get ,
			set: value?.set
		}
	}
	return { get: () => value };
}

const hasSetter = <T>(value: unknown): value is { set: (value: T) => void } => {
	return !!value && typeof value === "object" && ("set" in value);
}

@component("im-number")
export class ImHtmlNumber extends ImHtmlElement {

	@property({ converter: toGetterSetterPair })
	public accessor value: GetterSetterPair<number> = {};

	@watch()
	private get _value(){
		return this.value.get?.() ?? 0;
	}

	#setValue(e: InputEvent){
		const input = e.target as HTMLInputElement;
		this.value.set?.(Number(input.value));
		input.value = String(this._value);
	}

	@property({ type: String })
	public accessor label: GetterSetterPair<string> = {};

	@watch() get _label(){
		return this.label.get?.() ?? "Unnamed Number Field";
	}

	render(){
		return html`
			<sp-number-field label=${this._label} value=${this._value} @input=${this.#setValue}></sp-number-field>`;
	}
}

@component("im-text")
export class ImHtmlText extends ImHtmlElement {

	@property({ converter: toGetterSetterPair })
	public accessor value: GetterSetterPair<string> = {};

	@watch()
	private get _value(){
		return this.value.get?.() ?? "";
	}

	#setValue(e: InputEvent){
		const input = e.target as HTMLInputElement;
		this.value.set?.(String(input.value));
		input.value = String(this._value);
	}

	@property({ type: String })
	public accessor label: GetterSetterPair<string> = {};

	@watch() get _label(){
		return this.label.get?.() ?? "Unnamed Text Field";
	}

	render(){
		return html`<sp-textfield label=${this._label} value='${this._value}' @input="${this.#setValue}"></sp-textfield>`;
	}

}

@component("im-button")
export class ImHtmlButton extends ImHtmlElement {

	@property({ converter: toGetterSetterPair })
	public accessor value: GetterSetterPair<string> = {};

	@watch()
	private get _value(){
		return this.value.get?.() ?? "";
	}

	render(){
		return html`<sp-button><slot></slot>${this._value}</sp-button>`;
	}
}

@component("im-boolean")
export class ImHtmlCheckbox extends ImHtmlElement {

	@property({ converter: toGetterSetterPair })
	public accessor value: GetterSetterPair<boolean> = {};

	@watch()
	private get _value(){
		return this.value.get?.() ?? false;
	}

	#setValue(e: InputEvent){
		const input = e.target as HTMLInputElement;
		this.value.set?.(input.checked);
		input.checked = this._value;
	}

	@property({ type: String })
	public accessor label: GetterSetterPair<string> = {};

	@watch() get _label(){
		return this.label.get?.() ?? "";
	}

	render(){
		return html`<sp-switch ?checked=${this._value} @change=${this.#setValue}>${this._label}</sp-switch>`;
	}

}

@component("imhtml-enum")
export class ImHtmlSelect extends ImHtmlElement {}

@component("imhtml-color")
export class ImHtmlColor extends ImHtmlElement {}

@component("imhtml-range")
export class ImHtmlRange extends ImHtmlElement {}

@component("imhtml-textarea")
export class ImHtmlTextarea extends ImHtmlElement {}

@component("imhtml-vector")
export class ImHtmlVector extends ImHtmlElement {}