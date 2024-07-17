import { css, CSSResultGroup, html } from "lit";
import { customElement } from "lit/decorators.js";
export * as iui from "./mod"
import { autoWatch, component, ImHtmlElement, watch } from "./base";

@component("imhtml-test")
class TestComponent extends ImHtmlElement {

  static styles = css`
    .root {
      max-width: 500px;
      background-color: white;
      padding: 1rem;
    }
  `

  @watch() get width(){
    return window.innerWidth;
  }

  render() {
    return html`
      <div class='root'>
        <h1>Width: ${this.width}</h1>
      </div>
    `;
  }
}

@customElement("test-panel")
export class Panel extends ImHtmlElement {

  static styles = css`
    .center {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  `

  render() {
    return html`
      <div class='center'>
        <imhtml-test></imhtml-test>
      </div>
		`;
  }
}

@customElement("bg-image")
export class BGImage extends ImHtmlElement {
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