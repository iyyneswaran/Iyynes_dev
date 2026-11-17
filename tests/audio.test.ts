import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { VillageAudio } from "../src/audio";

const gain = () => ({
  value: 1,
  setTargetAtTime: vi.fn(),
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
});
class AudioStub {
  currentTime = 0;
  sampleRate = 100;
  destination = {};
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
  gains: ReturnType<typeof gain>[] = [];
  sources: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }[] = [];
  oscillatorStarts = 0;
  createGain() {
    const param = gain();
    this.gains.push(param);
    return { gain: param, connect: vi.fn(), disconnect: vi.fn() };
  }
  createOscillator() {
    return {
      frequency: { value: 0 },
      type: "square",
      connect: vi.fn(),
      start: () => {
        this.oscillatorStarts++;
      },
      stop: vi.fn(),
    };
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    const source = {
      buffer: null,
      loop: false,
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    this.sources.push(source);
    return source;
  }
  createBiquadFilter() {
    return { frequency: { value: 0 }, type: "lowpass", connect: vi.fn() };
  }
}
let sound: VillageAudio, contexts: AudioStub[];
beforeEach(() => {
  vi.useFakeTimers();
  contexts = [];
  vi.stubGlobal(
    "AudioContext",
    class extends AudioStub {
      constructor() {
        super();
        contexts.push(this);
      }
    },
  );
  sound = new VillageAudio();
});
afterEach(() => {
  sound.destroy();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("default-on sound without blocked autoplay", () => {
  it("is enabled before the first gesture but creates no audio context until unlocked", () => {
    sound.arm();
    expect(sound.enabled).toBe(true);
    sound.setEnvironment("rainy", false);
    expect(contexts).toHaveLength(0);
    sound.unlock();
    expect(contexts).toHaveLength(1);
    expect(contexts[0].resume).toHaveBeenCalled();
    expect(contexts[0].sources).toHaveLength(1);
  });
  it("keeps a single context and ambient timer across repeated input gestures", () => {
    sound.unlock();
    sound.unlock();
    sound.unlock();
    expect(contexts).toHaveLength(1);
    const before = contexts[0].oscillatorStarts;
    vi.advanceTimersByTime(9000);
    expect(contexts[0].oscillatorStarts - before).toBe(3);
  });
  it("mutes scheduled effects and weather together, and prevents gestures from unmuting", () => {
    sound.setEnvironment("rainy", false);
    sound.unlock();
    const ctx = contexts[0];
    sound.setEnabled(false);
    expect(ctx.gains[0].setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.01);
    expect(ctx.sources[0].stop).toHaveBeenCalledOnce();
    const count = ctx.oscillatorStarts;
    sound.unlock();
    sound.play("click");
    vi.advanceTimersByTime(18000);
    expect(ctx.oscillatorStarts).toBe(count);
    expect(sound.enabled).toBe(false);
  });
  it("replaces seasonal ambient sources instead of accumulating loops", () => {
    sound.unlock();
    sound.setEnvironment("rainy", false);
    sound.setEnvironment("winter", true);
    expect(contexts[0].sources).toHaveLength(2);
    expect(contexts[0].sources[0].stop).toHaveBeenCalledOnce();
    sound.setEnvironment("summer", true);
    expect(contexts[0].sources[1].stop).toHaveBeenCalledOnce();
  });
});
