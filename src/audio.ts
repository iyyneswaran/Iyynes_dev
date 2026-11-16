import type { Season } from "./seasons";
// Original synthesized chiptune effects and weather ambience; no remote assets or autoplay.
class VillageAudio {
  enabled = false;
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private season: Season = "summer";
  private night = false;
  private noise: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  setEnvironment(season: Season, night: boolean) {
    const changed = this.season !== season;
    this.season = season;
    this.night = night;
    if (changed) this.updateWeather();
  }
  private updateWeather() {
    this.noise?.stop();
    this.noise?.disconnect();
    this.noise = null;
    this.noiseGain?.disconnect();
    this.noiseGain = null;
    if (
      !this.enabled ||
      !this.context ||
      (this.season !== "rainy" && this.season !== "winter")
    )
      return;
    const c = this.context,
      buffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate),
      samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = this.season === "rainy" ? 1600 : 430;
    gain.gain.value = this.season === "rainy" ? 0.022 : 0.012;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    noise.start();
    this.noise = noise;
    this.noiseGain = gain;
  }
  private ambience() {
    if (this.night) {
      this.tone(3100, 0, 0.08, 0.004, "sine");
      this.tone(3200, 0.14, 0.07, 0.004, "sine");
      if (this.season === "winter") this.tone(330, 0.6, 0.4, 0.008, "sine");
    } else if (this.season === "rainy") {
      this.tone(180, 0, 0.1, 0.006, "triangle");
      this.tone(210, 0.15, 0.12, 0.006, "triangle");
    } else if (this.season !== "winter") this.bird();
    else {
      this.tone(1568, 0, 0.09, 0.006, "sine");
      this.tone(1397, 0.16, 0.13, 0.006, "sine");
    }
  }
  setEnabled(value: boolean) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.enabled = value;
    if (value) {
      this.context ??= new AudioContext();
      void this.context.resume();
      this.play("open");
      this.timer = setInterval(() => this.ambience(), 9000);
    } else {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
    this.updateWeather();
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
    this.noise?.stop();
    this.noise?.disconnect();
    void this.context?.close();
  }
}
export const audio = new VillageAudio();
