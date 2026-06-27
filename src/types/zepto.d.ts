// Minimal type declarations for the zepto subset used by this extension.
// zepto is loaded as a classic <script> and sets window.$.

interface ZeptoCollection {
  on(event: string, handler: (...args: any[]) => void): ZeptoCollection;
  css(prop: string, value: string): ZeptoCollection;
  show(): ZeptoCollection;
  hide(): ZeptoCollection;
  text(): string;
  text(content: string): ZeptoCollection;
  toggle(state: boolean): ZeptoCollection;
  width(): number;
}

interface ZeptoStatic {
  (selector: string): ZeptoCollection;
}

declare var $: ZeptoStatic;
