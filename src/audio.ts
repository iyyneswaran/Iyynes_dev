// Original synthesized chiptune effects. No remote audio assets or autoplay.
class VillageAudio {
  enabled = false;
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  setEnabled(value: boolean) {
    this.enabled = value;
    if (value) {
      this.context ??= new AudioContext();
      void this.context.resume();
      this.play("open");
      this.timer = setInterval(() => this.bird(), 9000);
    } else {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
  }
  private tone(
    frequency: number,
    time: number,
    duration: number,
    volume = 0.035,
    type: OscillatorType = "square",
  ) {
    if (!this.enabled || !this.context) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.setValueAtTime(0, c.currentTime + time);
    g.gain.linearRampToValueAtTime(volume, c.currentTime + time + 0.01);
    g.gain.exponentialRampToValueAtTime(
      0.0001,
      c.currentTime + time + duration,
    );
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + time);
    o.stop(c.currentTime + time + duration);
  }
  play(type: "open" | "close" | "step" | "discover" | "click") {
    if (type === "step") this.tone(90, 0, 0.035, 0.008, "triangle");
    if (type === "click") this.tone(440, 0, 0.08, 0.015);
    if (type === "close") {
      this.tone(440, 0, 0.09);
      this.tone(330, 0.07, 0.1);
    }
    if (type === "open" || type === "discover") {
      [523, 659, 784, ...(type === "discover" ? [1047] : [])].forEach((f, i) =>
        this.tone(f, i * 0.075, 0.15, 0.025, "triangle"),
      );
    }
  }
  bird() {
    this.tone(1760, 0, 0.12, 0.012, "sine");
    this.tone(2093, 0.15, 0.12, 0.009, "sine");
    this.tone(1568, 0.3, 0.18, 0.009, "sine");
  }
  destroy() {
    if (this.timer) clearInterval(this.timer);
    void this.context?.close();
  }
}
export const audio = new VillageAudio();
