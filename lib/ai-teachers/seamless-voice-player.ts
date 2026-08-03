/**
 * Client-side seamless voice queue for demo endurance tests.
 * Dual-buffer HTMLAudioElement · natural pauses · audio-master clock.
 */

export type VoiceQueueItem = {
  url: string;
  text: string;
  startMs: number;
  endMs: number;
  pauseAfterMs: number;
};

export type SeamlessVoiceCallbacks = {
  onLineStart?: (item: VoiceQueueItem, index: number) => void;
  onTimeUpdate?: (globalMs: number, lineIndex: number) => void;
  onQueueEnded?: () => void;
  onError?: (err: Error) => void;
};

export class SeamlessVoicePlayer {
  private items: VoiceQueueItem[] = [];
  private index = 0;
  private a: HTMLAudioElement | null = null;
  private b: HTMLAudioElement | null = null;
  private usingA = true;
  /** Sum of finished speech durations + finished pauses */
  private completedMs = 0;
  private pauseRemaining = 0;
  private pauseStartedAt = 0;
  private inPause = false;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private raf = 0;
  private stopped = true;
  private cbs: SeamlessVoiceCallbacks = {};

  constructor() {
    if (typeof Audio !== "undefined") {
      this.a = new Audio();
      this.b = new Audio();
      this.a.preload = "auto";
      this.b.preload = "auto";
    }
  }

  configure(items: VoiceQueueItem[], cbs: SeamlessVoiceCallbacks = {}) {
    this.stop();
    this.items = items;
    this.cbs = cbs;
    this.index = 0;
    this.completedMs = 0;
    this.inPause = false;
    this.pauseRemaining = 0;
  }

  async preload(): Promise<void> {
    if (!this.a || !this.b) return;
    if (this.items[0]) {
      this.a.src = this.items[0].url;
      await waitCanPlay(this.a);
    }
    if (this.items[1]) {
      this.b.src = this.items[1].url;
      await waitCanPlay(this.b);
    }
  }

  start() {
    if (!this.a || !this.items.length) return;
    this.stopped = false;
    this.usingA = true;
    this.index = 0;
    this.completedMs = 0;
    this.inPause = false;
    void this.playIndex(0);
    this.tickClock();
  }

  stop() {
    this.stopped = true;
    this.inPause = false;
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = null;
    cancelAnimationFrame(this.raf);
    this.a?.pause();
    this.b?.pause();
    if (this.a) {
      this.a.onended = null;
      this.a.onerror = null;
    }
    if (this.b) {
      this.b.onended = null;
      this.b.onerror = null;
    }
  }

  /** Audio-master global time matching aligned plan windows. */
  getGlobalMs(): number {
    if (this.inPause) {
      const elapsed = performance.now() - this.pauseStartedAt;
      return this.completedMs + Math.min(this.pauseRemaining, elapsed);
    }
    const cur = this.usingA ? this.a : this.b;
    const local = (cur?.currentTime || 0) * 1000;
    return this.completedMs + local;
  }

  getCurrentIndex(): number {
    return this.index;
  }

  private currentEl(): HTMLAudioElement {
    return (this.usingA ? this.a : this.b)!;
  }

  private nextEl(): HTMLAudioElement {
    return (this.usingA ? this.b : this.a)!;
  }

  private async playIndex(i: number) {
    if (this.stopped || !this.a || !this.b) return;
    if (i >= this.items.length) {
      this.cbs.onQueueEnded?.();
      this.stopped = true;
      return;
    }
    this.index = i;
    this.inPause = false;
    const item = this.items[i]!;
    const el = this.currentEl();
    const other = this.nextEl();

    if (!sameSrc(el, item.url)) {
      el.src = item.url;
      await waitCanPlay(el);
    }

    this.cbs.onLineStart?.(item, i);

    const nxt = this.items[i + 1];
    if (nxt && !sameSrc(other, nxt.url)) {
      other.src = nxt.url;
      void waitCanPlay(other);
    }

    el.onended = () => {
      if (this.stopped) return;
      const spoken = Math.max(200, item.endMs - item.startMs);
      this.completedMs += spoken;
      const pause = Math.max(120, item.pauseAfterMs || 300);
      this.inPause = true;
      this.pauseRemaining = pause;
      this.pauseStartedAt = performance.now();
      this.pauseTimer = setTimeout(() => {
        if (this.stopped) return;
        this.completedMs += pause;
        this.inPause = false;
        this.usingA = !this.usingA;
        void this.playIndex(i + 1);
      }, pause);
    };
    el.onerror = () => {
      this.cbs.onError?.(new Error(`audio failed line ${i}`));
      this.completedMs += Math.max(200, item.endMs - item.startMs);
      this.usingA = !this.usingA;
      void this.playIndex(i + 1);
    };

    try {
      el.currentTime = 0;
      await el.play();
    } catch (e) {
      this.cbs.onError?.(e instanceof Error ? e : new Error("play blocked"));
    }
  }

  private tickClock() {
    if (this.stopped) return;
    this.cbs.onTimeUpdate?.(this.getGlobalMs(), this.index);
    this.raf = requestAnimationFrame(() => this.tickClock());
  }
}

function sameSrc(audio: HTMLAudioElement, url: string): boolean {
  if (!audio.src) return false;
  try {
    return (
      audio.src === url ||
      audio.src.endsWith(url) ||
      (typeof window !== "undefined" &&
        audio.src === new URL(url, window.location.origin).href)
    );
  } catch {
    return false;
  }
}

function waitCanPlay(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= 3) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      audio.removeEventListener("canplaythrough", done);
      audio.removeEventListener("loadeddata", done);
      resolve();
    };
    audio.addEventListener("canplaythrough", done);
    audio.addEventListener("loadeddata", done);
    setTimeout(done, 10000);
  });
}
