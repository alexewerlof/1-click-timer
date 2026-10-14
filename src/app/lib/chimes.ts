/**
 * The alarm chimes, synthesised with the Web Audio API.
 *
 * There are no audio files: each chime is a short motif of oscillators, played
 * on a loop while the timer rings (AGENTS.md "Settings" — choosing a chime,
 * including silent). The volume setting scales the whole motif.
 */

export type ChimeId = 'chime' | 'beep' | 'bell' | 'silent'

export const DEFAULT_CHIME: ChimeId = 'chime'

export interface ChimeOption {
    id: ChimeId
    label: string
}

/** The choices the settings screen offers, in display order. */
export const CHIME_OPTIONS: readonly ChimeOption[] = [
    { id: 'chime', label: 'Chime' },
    { id: 'beep', label: 'Beep' },
    { id: 'bell', label: 'Bell' },
    { id: 'silent', label: 'Silent' },
]

/** One note of a motif, positioned in seconds from the start of the motif. */
interface Note {
    frequency: number
    offset: number
    duration: number
    type: OscillatorType
    gain: number
}

type Motif = readonly Note[]

const SINE: OscillatorType = 'sine'
const SQUARE: OscillatorType = 'square'

/** A motif per audible chime; `silent` has none. */
const MOTIFS: Record<Exclude<ChimeId, 'silent'>, Motif> = {
    beep: [
        { frequency: 880, offset: 0, duration: 0.12, type: SQUARE, gain: 0.25 },
        { frequency: 880, offset: 0.2, duration: 0.12, type: SQUARE, gain: 0.25 },
    ],
    chime: [
        { frequency: 659, offset: 0, duration: 0.9, type: SINE, gain: 0.3 },
        { frequency: 988, offset: 0.12, duration: 0.9, type: SINE, gain: 0.25 },
        { frequency: 1319, offset: 0.24, duration: 1, type: SINE, gain: 0.2 },
    ],
    bell: [
        { frequency: 523, offset: 0, duration: 1.6, type: SINE, gain: 0.35 },
        { frequency: 1047, offset: 0, duration: 1.2, type: SINE, gain: 0.18 },
        { frequency: 1568, offset: 0, duration: 0.9, type: SINE, gain: 0.1 },
    ],
}

/** How long one pass of the motif lasts, plus a beat before it repeats. */
function motifPeriod(motif: Motif): number {
    const end = Math.max(...motif.map((note) => note.offset + note.duration))
    return end + 0.6
}

let audioContext: AudioContext | null = null

/** The shared audio context, created on first use. */
function context(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!audioContext) audioContext = new AudioContext()
    return audioContext
}

/**
 * Resumes the audio context from a user gesture. Browsers start it suspended,
 * so the alarm has to be primed by a real interaction before the timer can ring.
 */
export function primeAudio(): void {
    const ctx = context()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
}

function scheduleNote(ctx: AudioContext, destination: AudioNode, note: Note): void {
    const start = ctx.currentTime + note.offset
    const stop = start + note.duration
    const oscillator = ctx.createOscillator()
    oscillator.type = note.type
    oscillator.frequency.value = note.frequency
    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0, start)
    envelope.gain.linearRampToValueAtTime(note.gain, start + 0.01)
    envelope.gain.exponentialRampToValueAtTime(0.0001, stop)
    oscillator.connect(envelope).connect(destination)
    oscillator.start(start)
    oscillator.stop(stop + 0.05)
}

/** Opens an output for one chime, scaled by `volume`, ready to receive notes. */
function openOutput(ctx: AudioContext, volume: number): GainNode {
    const master = ctx.createGain()
    master.gain.value = Math.min(1, Math.max(0, volume))
    master.connect(ctx.destination)
    return master
}

/**
 * Starts ringing `chime` at `volume` (0..1), repeating until the returned
 * function is called. A silent chime — or zero volume — rings nothing.
 */
export function startChime(chime: ChimeId, volume: number): () => void {
    if (chime === 'silent' || volume <= 0) return () => {}
    const ctx = context()
    if (!ctx) return () => {}
    void ctx.resume()

    const master = openOutput(ctx, volume)
    const motif = MOTIFS[chime]
    const ring = () => {
        for (const note of motif) scheduleNote(ctx, master, note)
    }
    ring()
    const timer = setInterval(ring, motifPeriod(motif) * 1000)

    return () => {
        clearInterval(timer)
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.02)
        setTimeout(() => master.disconnect(), 200)
    }
}

/** Plays a single pass of a chime, for the settings screen's preview button. */
export function previewChime(chime: ChimeId, volume: number): void {
    if (chime === 'silent' || volume <= 0) return
    const ctx = context()
    if (!ctx) return
    void ctx.resume()

    const master = openOutput(ctx, volume)
    for (const note of MOTIFS[chime]) scheduleNote(ctx, master, note)
    setTimeout(() => master.disconnect(), (motifPeriod(MOTIFS[chime]) + 0.5) * 1000)
}
