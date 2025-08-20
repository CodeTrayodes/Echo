export async function playTTS(text, { rate = 0.9, onStart, onEnd } = {}) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const arrayBuffer = await res.arrayBuffer();

    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(arrayBuffer);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    src.connect(ctx.destination);
    onStart?.();
    src.onended = () => { onEnd?.(); };
    src.start(0);
  } catch (e) {
    console.error("TTS error", e);
    onEnd?.();
  }
}
