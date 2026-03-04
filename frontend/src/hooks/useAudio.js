import { useEffect, useRef, useState, useCallback } from 'react';

export function useAudio() {
  const audioContextRef = useRef(null);
  const analysersRef = useRef({});
  const streamsRef = useRef({});
  const animFrameRef = useRef(null);
  const buffersRef = useRef({});

  const [audioLevels, setAudioLevels] = useState({});
  const [availableDevices, setAvailableDevices] = useState([]);

  const enumerateDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.warn('[Audio] Microphone permission denied');
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((d) => d.kind === 'audioinput');
    setAvailableDevices(inputs);
    return inputs;
  }, []);

  const startCapture = useCallback(async (deviceId) => {
    if (streamsRef.current[deviceId]) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    });

    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);

    analysersRef.current[deviceId] = analyser;
    streamsRef.current[deviceId] = stream;
  }, []);

  const stopCapture = useCallback((deviceId) => {
    if (streamsRef.current[deviceId]) {
      streamsRef.current[deviceId].getTracks().forEach((t) => t.stop());
      delete streamsRef.current[deviceId];
      delete analysersRef.current[deviceId];
      delete buffersRef.current[deviceId];
    }
  }, []);

  useEffect(() => {
    function tick() {
      const levels = {};

      for (const [deviceId, analyser] of Object.entries(analysersRef.current)) {
        if (!buffersRef.current[deviceId]) {
          buffersRef.current[deviceId] = new Float32Array(analyser.fftSize);
        }

        analyser.getFloatTimeDomainData(buffersRef.current[deviceId]);

        let sum = 0;
        for (const sample of buffersRef.current[deviceId]) {
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / buffersRef.current[deviceId].length);
        const dBFS = rms > 0 ? 20 * Math.log10(rms) : -100;
        levels[deviceId] = Math.max(-100, dBFS);
      }

      setAudioLevels(levels);
      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(streamsRef.current).forEach((stream) =>
        stream.getTracks().forEach((t) => t.stop())
      );
      audioContextRef.current?.close();
    };
  }, []);

  return { audioLevels, availableDevices, enumerateDevices, startCapture, stopCapture };
}
