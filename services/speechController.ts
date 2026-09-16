import * as Speech from 'expo-speech';

type Part = { text: string; language: string };
export class SpeechController {
  private generation = 0;
  private queue: Promise<void> = Promise.resolve();
  private parts: Part[] = [];
  private index = 0;
  private offset = 0;
  private active = false;
  private finish: () => void = () => {};

  private clearNativeQueue() {
    this.queue = this.queue.catch(() => {}).then(() => Speech.stop());
    return this.queue;
  }

  async stop() {
    this.generation++;
    this.active = false;
    this.parts = [];
    await this.clearNativeQueue();
  }

  async pause() {
    this.generation++;
    this.active = false;
    await this.clearNativeQueue();
  }

  play(parts: Part[], onFinish: () => void) {
    this.parts = parts;
    this.index = 0;
    this.offset = 0;
    this.finish = onFinish;
    return this.resume();
  }

  async resume() {
    const generation = ++this.generation;
    this.active = true;
    try {
      await this.clearNativeQueue();
      if (generation !== this.generation || !this.active) return;
      this.speak(generation);
    } catch {
      if (generation === this.generation) { this.active = false; this.finish(); }
    }
  }

  private speak(generation: number) {
    if (generation !== this.generation || !this.active) return;
    const part = this.parts[this.index];
    if (!part) { this.active = false; this.finish(); return; }
    const base = this.offset;
    const valid = () => generation === this.generation && this.active;
    const fail = () => { if (valid()) { this.active = false; this.finish(); } };
    try {
      Speech.speak(part.text.slice(base), {
        language: part.language,
        // Android has no native pause: retain the latest word boundary when stopping.
        onBoundary: (event: { charIndex: number }) => { if (valid()) this.offset = base + event.charIndex; },
        onDone: () => { if (valid()) { this.index++; this.offset = 0; this.speak(generation); } },
        onStopped: fail,
        onError: fail,
      });
    } catch { fail(); }
  }
}
