import { LitElement, TemplateResult, html, css, svg } from "lit";
import { property, query, customElement } from "lit/decorators.js";

export { property, query, html, css, svg };

export const component = customElement;

export function watch() {
	return function (
		value: any, 
		ctx: ClassFieldDecoratorContext | ClassGetterDecoratorContext | ClassMethodDecoratorContext | ClassSetterDecoratorContext | ClassAccessorDecoratorContext
	): any {

		if(ctx.kind === "method"){

			if(ctx.name === "render") {
				ctx.addInitializer(function(){
					this.constructor.WatchRender = true;
				})
				return;
			}

			function replacementMethod(this: any, ...args: any[]) {
				const result = value.call(this, ...args);
				this.requestUpdate();
				return result;
			}
			return replacementMethod;
		}

		if(ctx.kind === "setter"){
			return function replacementSetter(this: any, newValue: any) {
				value.call(this, newValue);
				this.requestUpdate();
			}
		}

		if(ctx.kind === "accessor" || ctx.kind === "field" || ctx.kind === "getter"){
			ctx.addInitializer(function(){
				this.watchedProps = this.watchedProps || new Set();
				this.watchedProps.add(ctx.name);
			})
			return;
		}
	}
}

export function convert(fn: Function){
	return function (
		value: any, 
		ctx: ClassFieldDecoratorContext | ClassGetterDecoratorContext | ClassSetterDecoratorContext | ClassAccessorDecoratorContext
	): any {
		if(ctx.kind === "setter"){
			return function replacementSetter(this: any, newValue: any) {
				value.call(this, fn(newValue));
			}
		}
		if(ctx.kind === "getter"){
			return function replacementGetter(this: any) {
				return fn(value.call(this));
			}
		}
		if(ctx.kind === "accessor"){
			return {
				get(this: any) {
					return fn(value.get.call(this));
				},
				set(this: any, newValue: any) {
					value.set.call(this, fn(newValue));
				}
			}
		}
	}
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

const isLitTemplateResult = (value: unknown): value is TemplateResult => {
	return !!value && (typeof value === "object") && ("_$litType$" in value);
}

const isFn = (value: unknown): value is Function => {
	return typeof value === "function";
}

export class ImHtmlElement extends LitElement {

	static WatchRender = false;

	#lastPropValues: Record<string, any> = {};
	#lastRenderValues: unknown[] = [];

	protected watchedProps: Set<string> = new Set();

	connectedCallback() {
		super.connectedCallback();
		Scheduler.subscribe(this.#update.bind(this));
	}

	onMount?(): void;
	onUnmount?(): void;
	onUpdate?(): void;

	#diff(a: unknown[], b: unknown[]): boolean {

		if(a.length !== b.length) {			
			return true;
		}

		for(let i = 0; i < a.length; i++) {
			const prev = a[i], next = b[i];

			if(isFn(prev) && isFn(next)){
				if(prev.name !== next.name) {
					return true;
				} else {
					continue;
				}
			}

			if(isLitTemplateResult(prev) && isLitTemplateResult(next)) {
				return this.#diff(prev.values, next.values);
			}

			if(Array.isArray(prev) && Array.isArray(next)) {
				return this.#diff(prev, next);
			}

			if(a[i] !== b[i]) {
				return true;
			}
		}

		return false;
	}

	#update(){
		for(const prop of this.watchedProps) {
			if(prop.startsWith("#")){
				throw new Error("Private properties cannot be watched");
			}
			if(this.#lastPropValues[prop] !== this[prop as keyof this]) {
				this.#lastPropValues[prop] = this[prop as keyof this];
				this.requestUpdate()
			}
		}
		if((this.constructor as any).WatchRender) {
			const renderResult = this.render();
			if(isLitTemplateResult(renderResult)) {
				if(this.#diff(renderResult.values, this.#lastRenderValues)) {
					this.requestUpdate();
					this.#lastRenderValues = renderResult.values;
				}
			}
		}
	}
}