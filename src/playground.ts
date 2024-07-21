import { css, html } from "lit";
import { component, ImHtmlElement } from "./base";
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import "./components";
import "./panel"

@component("playground-app")
export class PlaygroundApp extends ImHtmlElement {
  static styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  `

  number = 5;
  text = "Hello";
  boolean = true;

  enum = {
    value: "Orange",
    options: [
      "Red",
      "Orange",
      "Yellow",
      "Green",
      "Blue",
      "Indigo",
      "Violet"
    ]
  }
  

  render() {
    return html`
      <sp-theme     
        system="spectrum"
        color="dark"
        scale="small"
      >
        <im-panel>
          hello
        </im-panel>
      </sp-theme>
    `;
  }
}

@component("bg-image")
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