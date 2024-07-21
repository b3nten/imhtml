export function createElement<T extends keyof HTMLElementTagNameMap>(tag: T, props: Partial<HTMLElementTagNameMap[T]>){
	const element = document.createElement(tag);
	for(const [key, value] of Object.entries(props)){
		element[key] = value;
	}
	return element;
}