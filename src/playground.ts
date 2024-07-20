import { css, html } from "lit";
import { component, ImHtmlElement } from "./base";
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import "./components";

@component("playground-app")
export class PlaygroundApp extends ImHtmlElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
    v-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `

  number = 5;
  text = "Hello";
  boolean = true;

  render() {
    return html`
      <sp-theme     
        system="spectrum"
        color="dark"
        scale="small"
      >
        <v-stack>
          <im-number value="38"></im-number>
          <im-number .value=${{ get: () => this.number, set: (v: number) => this.number = v }}></im-number>
          <im-text value="Hello World"></im-text>
          <im-text .value=${{ get: () => this.text, set: (v: string) => this.text = v }}></im-text>
          <im-button @click=${() => this.text = "Hello World"}>Change Text</im-button>
          <im-boolean value="true"></im-boolean>
          <im-boolean .value=${{ get: () => this.boolean, set: (v: boolean) => this.boolean = v }}></im-boolean>
        </v-stack>
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

  onMount(): void {
    document.body.style.margin = "0";
  }

  render() {
    return html`
      <img src="https://unsplash.com/photos/axhLuc-JskI/download?ixid=M3wxMjA3fDB8MXx0b3BpY3x8Ym84alFLVGFFMFl8fHx8fDJ8fDE3MjA5OTM3Mjh8&force=true&w=2400">
    `;
  }
}