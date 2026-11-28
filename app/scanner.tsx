import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useFrameProcessor,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import { useResizePlugin } from 'vision-camera-resize-plugin';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LABELS: string[] = require('../assets/labels.json');
const MIN_CONFIDENCE   = 0.02;   // model peaks at 3–7% for correct class
const VOTE_FRAMES      = 3;      // require same winner in 3 consecutive frames
const INPUT_SIZE       = 224;
const SCAN_INTERVAL_MS = 800;

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const [isActive, setIsActive]             = useState(true);
  const [isNavigating, setIsNavigating]     = useState(false);
  const [result, setResult]                 = useState<{ name: string; confidence: number } | null>(null);
  const [livePrediction, setLivePrediction] = useState<string | null>(null);
  const [isManualScanning, setIsManualScanning] = useState(false);

  const model      = useTensorflowModel(require('../assets/model.tflite'));
  const modelReady = model.state === 'loaded';
  const modelError = model.state === 'error';

  const { resize } = useResizePlugin();

  const lastScanTime  = useRef(0);
  const isScanning    = useRef(false);
  const forceNow      = useRef(false);   // manual button overrides throttle
  const voteIdx       = useRef(-1);      // class that is currently on a streak
  const voteStreak    = useRef(0);       // how many consecutive frames it won

  // Animations
  const pokeballAnim = useRef(new Animated.Value(1)).current;
  const scanRingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const flashAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ring = Animated.loop(
      Animated.sequence([
        Animated.timing(scanRingAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanRingAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    );
    ring.start();
    return () => ring.stop();
  }, [scanRingAnim]);

  useEffect(() => {
    if (!result) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [result, pulseAnim]);

  // ── JS-thread callbacks ────────────────────────────────────────────────────
  const onPrediction = useRunOnJS(
    (topIdx: number, confidence: number) => {
      const label = LABELS[topIdx] ?? 'unknown';
      setResult({ name: label, confidence: Math.round(confidence * 100) });
      setIsManualScanning(false);
      // Flash effect
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 80,  useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    },
    []
  );

  const onLiveUpdate = useRunOnJS(
    (topIdx: number) => {
      setLivePrediction(LABELS[topIdx] ?? null);
    },
    []
  );

  // ── Frame processor ────────────────────────────────────────────────────────
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!modelReady || !model.model) return;

      const now = Date.now();
      const skipThrottle = forceNow.current;
      if (!skipThrottle && now - lastScanTime.current < SCAN_INTERVAL_MS) return;
      if (isScanning.current) return;

      if (skipThrottle) {
        // Manual scan: reset vote so we get fresh streak from scratch
        voteIdx.current    = -1;
        voteStreak.current = 0;
        forceNow.current   = false;
      }

      isScanning.current   = true;
      lastScanTime.current = now;

      try {
        const raw = resize(frame, {
          scale:       { width: INPUT_SIZE, height: INPUT_SIZE },
          pixelFormat: 'rgb',
          dataType:    'uint8',
        });

        const tensorSize  = INPUT_SIZE * INPUT_SIZE * 3;
        const inputTensor = new Float32Array(tensorSize);
        // EfficientNetV2 expects float32 in [0, 255] range
        for (let i = 0; i < tensorSize; i++) {
          inputTensor[i] = raw[i];
        }

        const outputs = model.model.runSync([inputTensor]);
        const scores  = outputs[0] as Float32Array;

        // 4. Find top class in this single frame
        let topIdx   = 0;
        let topScore = scores[0];
        for (let i = 1; i < scores.length; i++) {
          if (scores[i] > topScore) {
            topScore = scores[i];
            topIdx   = i;
          }
        }

        // 5. Consec-frame voting: same class must win VOTE_FRAMES in a row
        if (topIdx === voteIdx.current) {
          voteStreak.current += 1;
        } else {
          voteIdx.current    = topIdx;
          voteStreak.current = 1;
        }

        onLiveUpdate(topIdx);

        if (voteStreak.current >= VOTE_FRAMES) {
          voteIdx.current    = -1;
          voteStreak.current = 0;

          // top-5 for debug
          const indexed = Array.from(scores).map((s, i) => ({ s, i }));
          indexed.sort((a, b) => b.s - a.s);
          const top5 = indexed.slice(0, 5)
            .map(x => `${LABELS[x.i] ?? x.i}:${x.s.toFixed(4)}`).join('  ');
          console.log(
            `[Scanner] winner:${LABELS[topIdx] ?? topIdx} score:${topScore.toFixed(4)}` +
            `\n  top5: ${top5}`
          );

          if (topScore >= MIN_CONFIDENCE) {
            onPrediction(topIdx, topScore);
          }
        }
      } finally {
        isScanning.current = false;
      }
    },
    [modelReady, model.model, resize, onPrediction, onLiveUpdate,
     lastScanTime, isScanning, voteIdx, voteStreak, forceNow]
  );

  // ── Auto-navigate 1.5s after result locked ─────────────────────────────────
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => handleNavigate(), 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // ── Navigate ───────────────────────────────────────────────────────────────
  const handleNavigate = useCallback(async () => {
    if (!result) return;
    setIsNavigating(true);
    setIsActive(false);
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${result.name.toLowerCase()}`
      );
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      router.push({ pathname: '/pokemon/[id]', params: { id: data.id } });
    } catch {
      Alert.alert('Not Found', `"${result.name}" was not found in the Pokédex.`);
      setResult(null);
      setIsActive(true);
    } finally {
      setIsNavigating(false);
    }
  }, [result, router]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setLivePrediction(null);
    setIsActive(true);
    setIsManualScanning(false);
    voteIdx.current    = -1;
    voteStreak.current = 0;
  }, []);

  // Manual scan: press pokéball to force immediate scan
  const handleManualScan = useCallback(() => {
    if (!modelReady || result) return;
    setIsManualScanning(true);
    setLivePrediction(null);
    // Animate pokéball press
    Animated.sequence([
      Animated.timing(pokeballAnim, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.timing(pokeballAnim, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();
    forceNow.current = true;
  }, [modelReady, result, pokeballAnim]);

  // ── Permission / device screens ────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={styles.centeredContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="camera-outline" size={64} color="#888" />
        <Text style={styles.centeredTitle}>Camera Access Needed</Text>
        <Text style={styles.centeredSubtitle}>Grant camera permission to use the Pokéscanner.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centeredContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="camera-outline" size={64} color="#888" />
        <Text style={styles.centeredTitle}>No Camera Found</Text>
      </View>
    );
  }

  const ringScale   = scanRingAnim.interpolate({ inputRange: [0, 1],      outputRange: [1, 1.4] });
  const ringOpacity = scanRingAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.7, 0.2, 0] });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Camera feed */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && !result}
        frameProcessor={result ? undefined : frameProcessor}
        pixelFormat="yuv"
      />

      {/* White flash on detection */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.flashOverlay, { opacity: flashAnim }]}
        pointerEvents="none"
      />

      {/* Dark vignette edges */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Pokéscanner</Text>
        <View style={[styles.statusBadge, modelError && styles.statusBadgeError]}>
          <View style={[
            styles.statusDot,
            modelReady && styles.statusDotReady,
            modelError && styles.statusDotError,
          ]} />
          <Text style={styles.statusText}>
            {modelError ? 'Error' : modelReady ? 'On-device AI' : 'Loading…'}
          </Text>
        </View>
      </View>

      {/* ── Viewfinder (center) ── */}
      <View style={styles.viewfinderArea} pointerEvents="none">
        {/* Pulsing ring behind corners */}
        {!result && modelReady && (
          <Animated.View style={[
            styles.scanRing,
            { transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]} />
        )}
        {/* Corner brackets */}
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Live guess label */}
        {!result && livePrediction ? (
          <View style={styles.liveTag}>
            <Text style={styles.liveTagText}>
              {livePrediction.charAt(0).toUpperCase() + livePrediction.slice(1)}?
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Result overlay ── */}
      {result && (
        <Animated.View style={[styles.resultOverlay, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.resultLabel}>Detected</Text>
          <Text style={styles.resultName}>
            {result.name.charAt(0).toUpperCase() + result.name.slice(1)}
          </Text>
          <Text style={styles.resultConfidence}>{result.confidence}% match</Text>
          {isNavigating && <ActivityIndicator color="#fff" style={{ marginTop: 6 }} />}
        </Animated.View>
      )}

      {/* ── Bottom bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
        {/* Retry (left) */}
        <Pressable
          style={[styles.sideButton, !result && styles.sideButtonHidden]}
          onPress={handleRetry}
          disabled={!result}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </Pressable>

        {/* ── Pokéball button (center) ── */}
        <Animated.View style={{ transform: [{ scale: pokeballAnim }] }}>
          <Pressable
            style={[styles.pokeballBtn, (!modelReady || !!result) && styles.pokeballBtnDisabled]}
            onPress={handleManualScan}
            disabled={!modelReady || !!result}
          >
            {/* Top half – red */}
            <View style={styles.pokeballTop} />
            {/* Bottom half – white */}
            <View style={styles.pokeballBottom} />
            {/* Horizontal band */}
            <View style={styles.pokeballBand} />
            {/* Center button */}
            <View style={styles.pokeballCenterRing}>
              <View style={[
                styles.pokeballCenterDot,
                isManualScanning && styles.pokeballCenterDotActive,
              ]} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Open Pokédex (right, only when result) */}
        <Pressable
          style={[styles.sideButton, !result && styles.sideButtonHidden]}
          onPress={handleNavigate}
          disabled={!result || isNavigating}
        >
          <Ionicons name="book-outline" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Status text bottom */}
      <View style={styles.statusFooter} pointerEvents="none">
        <Text style={styles.statusFooterText}>
          {modelError
            ? '⚠️ Model failed to load'
            : !modelReady
            ? '⏳ Loading AI model…'
            : result
            ? `✨ Opening Pokédex…`
            : isManualScanning
            ? '📡 Scanning…'
            : '🔍 Tap the Pokéball or wait to auto-scan'}
        </Text>
      </View>
    </View>
  );
}

const PB = 80; // Pokéball diameter
const CORNER_SIZE      = 30;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#000' },
  centeredContainer: {
    flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center',
    alignItems: 'center', padding: 32, gap: 16,
  },
  centeredTitle:    { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  centeredSubtitle: { color: '#888', fontSize: 15, textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#6890F0', paddingVertical: 14,
    paddingHorizontal: 32, borderRadius: 16, marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  flashOverlay: { backgroundColor: '#fff' },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 70,
    borderColor: 'rgba(0,0,0,0.45)',
  },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10, gap: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, color: '#fff', fontSize: 20, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusBadgeError: { backgroundColor: 'rgba(239,68,68,0.35)' },
  statusDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#888' },
  statusDotReady:   { backgroundColor: '#4ade80' },
  statusDotError:   { backgroundColor: '#ef4444' },
  statusText:       { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Viewfinder
  viewfinderArea: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 160,
    justifyContent: 'center', alignItems: 'center',
  },
  scanRing: {
    position: 'absolute',
    width: 270, height: 270, borderRadius: 16,
    borderWidth: 2, borderColor: 'rgba(255,50,50,0.6)',
  },
  viewfinder: { width: 250, height: 250 },
  corner:     { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  cornerTL:   { top: 0,    left: 0,  borderTopWidth: CORNER_THICKNESS,    borderLeftWidth: CORNER_THICKNESS,  borderTopLeftRadius: 6 },
  cornerTR:   { top: 0,    right: 0, borderTopWidth: CORNER_THICKNESS,    borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 6 },
  cornerBL:   { bottom: 0, left: 0,  borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,  borderBottomLeftRadius: 6 },
  cornerBR:   { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 6 },

  liveTag: {
    position: 'absolute', bottom: -40,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  liveTagText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Result overlay (center of screen)
  resultOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    backgroundColor: 'rgba(15,15,30,0.92)',
    borderRadius: 24, paddingHorizontal: 32, paddingVertical: 20,
    alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,50,50,0.5)',
    zIndex: 20,
  },
  resultLabel:      { color: '#aaa', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  resultName:       { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: 0.5 },
  resultConfidence: { color: '#4ade80', fontSize: 14, fontWeight: '600' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 48, zIndex: 10,
  },
  sideButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  sideButtonHidden: { opacity: 0 },

  // Pokéball
  pokeballBtn: {
    width: PB, height: PB, borderRadius: PB / 2,
    backgroundColor: '#fff',
    borderWidth: 3, borderColor: '#111',
    overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8,
  },
  pokeballBtnDisabled: { opacity: 0.45 },
  pokeballTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: PB / 2, backgroundColor: '#e3000b',
  },
  pokeballBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: PB / 2, backgroundColor: '#fff',
  },
  pokeballBand: {
    position: 'absolute',
    width: PB, height: 6,
    backgroundColor: '#111',
    top: (PB - 6) / 2,
  },
  pokeballCenterRing: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#111',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2,
  },
  pokeballCenterDot: {
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#fff',
  },
  pokeballCenterDotActive: {
    backgroundColor: '#4ade80',
  },

  // Status footer
  statusFooter: {
    position: 'absolute', bottom: 150, left: 0, right: 0,
    alignItems: 'center', zIndex: 5,
  },
  statusFooterText: {
    color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
  },
});
