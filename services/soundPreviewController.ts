import { Asset } from 'expo-asset';
import { setAudioModeAsync, type AudioSource } from 'expo-audio';
import { AudioController } from './audioController';
export type PreviewState = { key: string | null; status: 'idle' | 'loading' | 'playing' | 'paused' };

export class SoundPreviewController {
  private audio = new AudioController();
  private generation = 0;
  private state: PreviewState = {key: null, status: 'idle'};
  private prepared: AudioSource | null = null;
  private started = false;
  constructor(private changed: (state: PreviewState) => void, private failed: (error: unknown) => void) {}
  setErrorHandler(handler: (error: unknown) => void) { this.failed = handler; }
  private update(status: PreviewState['status'], key = this.state.key) {
    this.state = {key, status}; this.changed(this.state);
  }
  async stop() {
    this.generation++; this.prepared = null; this.started = false;
    this.update('idle', null);
    await this.audio.stop();
  }
  pause() {
    if (this.state.key === null || this.state.status === 'paused') return;
    this.update('paused'); this.audio.pause();
  }
  async play(key: string, source: AudioSource) {
    if (this.state.key === key) {
      if (this.state.status !== 'paused') return;
      if (this.started) { this.audio.resume(); this.update('playing'); }
      else { this.update('loading'); if (this.prepared !== null) await this.start(this.generation); }
      return;
    }
    const generation = ++this.generation;
    this.prepared = null; this.started = false;
    this.update('loading', key);
    try {
      await this.audio.stop();
      await setAudioModeAsync({playsInSilentMode: true, interruptionMode: 'doNotMix'});
      let resolved = source;
      if (typeof source === 'number') {
        const asset = await Asset.fromModule(source).downloadAsync();
        resolved = {uri: asset.localUri ?? asset.uri};
      }
      if (generation !== this.generation) return;
      this.prepared = resolved;
      if (this.state.status !== 'paused') await this.start(generation);
    } catch (error) { this.handleError(generation, error); }
  }
  private async start(generation: number) {
    if (this.prepared === null || this.started) return;
    this.started = true;
    try {
      const playing = await this.audio.play(this.prepared, () => {
        if (generation === this.generation) { this.started = false; this.prepared = null; this.update('idle', null); }
      });
      if (playing && generation === this.generation && this.state.status !== 'paused') this.update('playing');
    } catch (error) { this.handleError(generation, error); }
  }
  private handleError(generation: number, error: unknown) {
    if (generation !== this.generation) return;
    this.started = false; this.prepared = null; this.update('idle', null); this.failed(error);
  }
}
