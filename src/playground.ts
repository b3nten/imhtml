import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import * as iui from "./mod";
export * as iui from "./mod"

@customElement("test-panel")
export class Panel extends LitElement {
  
  mockData = {
    number: 5,
    string: "Hello",
    boolean: false,
    enum: {
      options: ["Option 1", "Option 2", "Option 3"],
      value: "Option 1",
    },
    vec: [1, 2, 3],
  };

  numberGetterSetter = {
    get: () => this.mockData.number,
    set: (value: number) => {
      console.log("Setting number to", value);
      this.mockData.number = value;
    },
  }

  render() {
    return html`
			<iui-panel>
        <div>
          <iui-number .value=${iui.createObservableProperty(this.mockData, "number")}></iui-input>
        </div>
        <div>
          <iui-number .value=${iui.createObservableProperty(12)}></iui-input>
        </div>
        <div>
          <iui-string .value=${iui.createObservableProperty(this.mockData, "string")}></iui-string>
        </div>
        <div>
          <iui-string .value=${iui.createObservableProperty("LOL")}></iui-string>
        </div>
        <div>
          <iui-boolean .value=${{ get: () => false, set: (val)=> this.mockData.boolean = val }}></iui-boolean> 
        </div>
        <div>
          <iui-button @click="${() => alert("WOO")}">click me</iui-boolean> 
        </div>
        <div>
          <iui-vector></iui-vector>
        </div>
			</iui-panel>
		`;
  }
}

@customElement("bg-image")
export class BGImage extends LitElement {
  static styles = css`
    img {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: -1;
      pointer-events: none;
      object-fit: cover;
    }
  `
  render() {
    return html`
      <img src="https://unsplash.com/photos/axhLuc-JskI/download?ixid=M3wxMjA3fDB8MXx0b3BpY3x8Ym84alFLVGFFMFl8fHx8fDJ8fDE3MjA5OTM3Mjh8&force=true&w=2400">
    `;
  }
}

document.body.style.margin = "0";