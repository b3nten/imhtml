import { LitElement, TemplateResult, html, css, svg } from "lit";
import { property, query, customElement } from "lit/decorators.js";

/****************************************************************************************
 * Exports
 *****************************************************************************************/

export { 
	property, 
	query, 
	html, 
	html as h,
	css, 
	css as c,
	svg,
	customElement as component,
};

/****************************************************************************************
 * Utils
 *****************************************************************************************/

type Constructor<T = {}> = new (...args: any[]) => T;

const isLitTemplateResult = (value: unknown): value is TemplateResult => {
	return !!value && (typeof value === "object") && ("_$litType$" in value);
}

const isFn = (value: unknown): value is Function => {
	return typeof value === "function";
}

/****************************************************************************************
 * Decorators
 *****************************************************************************************/

export function track() {
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

/****************************************************************************************
 * Scheduler
 *****************************************************************************************/

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

/****************************************************************************************
 * ImHtmlElement
 *****************************************************************************************/

export interface IImHtmlElement extends LitElement {
	trackedProps: Set<string>;
	onMount?(): void;
	onUnmount?(): void;
	onUpdate?(): void;
}

export function ImHtml(SuperClass: Constructor<LitElement>): Constructor<IImHtmlElement> {
	class ClassWithImHTML extends SuperClass {

		trackedProps: Set<string> = new Set();

		#lastTrackedValues: Record<string, any> = {};
		#lastRenderValues: unknown[] = [];

		connectedCallback() {
			super.connectedCallback();
			Scheduler.subscribe(this.#compareTrackedEntities.bind(this));
		}

		#compareRenderOutput(a: unknown[] | TemplateStringsArray, b: unknown[] | TemplateStringsArray): boolean {
			// if the lengths are different, we know the values are different and bail early
			if(a.length !== b.length) {
				return true;
			}

			for(let i = 0; i < a.length; i++) {
				const prev = a[i], next = b[i];

				// functions are compared by name
				if(isFn(prev) && isFn(next)){
					if(prev.name !== next.name) {
						return true;
					} else {
						continue;
					}
				}

				// lit template results are compared by their values
				if(isLitTemplateResult(prev) && isLitTemplateResult(next)) {
					return this.#compareRenderOutput(prev.values, next.values) && this.#compareRenderOutput(prev.strings, next.strings);
				}

				// arrays are deeply compared
				if(Array.isArray(prev) && Array.isArray(next)) {
					return this.#compareRenderOutput(prev, next);
				}

				// strict equality check
				if(a[i] !== b[i]) {
					return true;
				}
			}

			return false;
		}

		#compareTrackedEntities(){
			for(const prop of this.trackedProps) {

				// private properties cannot be watched
				if(prop.startsWith("#")){
					throw new Error("Private properties cannot be watched");
				}

				// if the property is the render method, we need to compare the output
				if(prop === "render") {
					const renderResult = this.render();
					if(isLitTemplateResult(renderResult)) {
						if(this.#compareRenderOutput(renderResult.values, this.#lastRenderValues)) {
							this.requestUpdate();
							this.#lastRenderValues = renderResult.values;
						}
					}
				}

				// if the property is not the render method, we need to compare the value
				// todo: use a deep comparison for objects
				if(this.#lastTrackedValues[prop] !== this[prop as keyof this]) {
					this.#lastTrackedValues[prop] = this[prop as keyof this];
					this.requestUpdate()
				}
			}
		}
	}

	return ClassWithImHTML as Constructor<IImHtmlElement> & typeof SuperClass;
}

export class ImHtmlElement extends ImHtml(LitElement) {}
