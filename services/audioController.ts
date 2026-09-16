import { createAudioPlayer, type AudioSource } from 'expo-audio';

/** Owns one player; stopping also cancels any pending load. */
export class AudioController {
  private cancel: (() => void) | null = null;

  private player: ReturnType<typeof createAudioPlayer> | null = null;
  private paused = false;

  pause() {
    this.paused = true;
    this.player?.pause();
  }

  resume() {
    this.paused = false;
    if (this.player?.isLoaded) this.player.play();
  }

  async stop() {
    this.cancel?.();
  }

  play(source: AudioSource, onFinish: () => void = () => {}): Promise<boolean> {
    this.cancel?.();
    return new Promise((resolve, reject) => {
      const player = createAudioPlayer(source);
      this.player = player;
      this.paused = false;
      let disposed = false;
      let started = false;
      let subscription: { remove(): void } | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const dispose = () => {
        if (disposed) return;
        disposed = true;
        clearTimeout(timeout);
        subscription?.remove();
        if (this.cancel === cancel) this.cancel = null;
        if (this.player === player) this.player = null;
        player.pause();
        player.remove();
      };
      const cancel = () => { dispose(); resolve(false); };
      const fail = (error: unknown) => {
        dispose();
        if (started) onFinish();
        else reject(error);
      };
      const start = () => {
        if (disposed || started) return;
        try {
          if (!this.paused) player.play();
          started = true;
          clearTimeout(timeout);
          resolve(true);
        } catch (error) { fail(error); }
      };
      this.cancel = cancel;
      try {
        subscription = player.addListener('playbackStatusUpdate', status => {
          if (disposed) return;
          if (status.error) { fail(new Error(status.error)); return; }
          if (status.didJustFinish) { dispose(); onFinish(); return; }
          if (status.isLoaded) start();
        });
        timeout = setTimeout(() => fail(new Error('Audio loading timed out')), 30000);
        if (player.isLoaded) start();
      } catch (error) { fail(error); }
    });
  }
}
