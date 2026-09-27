declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module 'plyr' {
  export default class Plyr {
    constructor(target: HTMLElement | string, options?: any);
    destroy(): void;
    play(): Promise<void> | void;
    pause(): void;
    playing: boolean;
    on(event: string, callback: (...args: any[]) => void): void;
    current: number;
    duration: number;
    volume: number;
    muted: boolean;
    speed: number;
    quality: any;
  }
}
