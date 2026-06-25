import { Injectable } from '@angular/core';
import { Howl } from 'howler';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  static isLocalStorageAvailable = typeof localStorage !== 'undefined';

  volumeLevel: VolumeLevel;
  volume: number;

  private music?: Howl;
  private currentMusicSrc?: string;

  /** Per-play volume randomization so repeated triggers of the same clip (rapid attacks,
   *  DoT ticks, menu clicks) don't sound like a robotic loop — applied universally to
   *  every sound in playSound(), on top of whatever file-variant pool that sound already
   *  has. */
  private static readonly VOLUME_JITTER = 0.06; // ±6% volume

  /** One Howl per variant file, lazily created. Howler plays each Howl through the
   *  Web Audio API by default, so overlapping plays of the same Howl are handled
   *  natively — no manual instance pooling needed (unlike the old HTMLAudioElement impl). */
  private soundPools = new Map<SoundOptions, Howl[]>();

  constructor() {
    const stored = SoundsService.isLocalStorageAvailable
      ? (localStorage.getItem(VOLUME_LEVEL_STORAGE_KEY) as VolumeLevel | null)
      : null;
    this.volumeLevel = stored && VOLUME_LEVELS.includes(stored) ? stored : 'loud';
    this.volume = VOLUME_LEVEL_VALUES[this.volumeLevel];
  }

  get volumeIcon(): string {
    return VOLUME_LEVEL_ICONS[this.volumeLevel];
  }

  /** Advances max → loud → less loud → muted → max, applying and persisting the new level. */
  cycleVolume(): void {
    const nextIndex = (VOLUME_LEVELS.indexOf(this.volumeLevel) + 1) % VOLUME_LEVELS.length;
    this.setVolumeLevel(VOLUME_LEVELS[nextIndex]);
  }

  setVolumeLevel(level: VolumeLevel): void {
    this.volumeLevel = level;
    if (SoundsService.isLocalStorageAvailable) {
      localStorage.setItem(VOLUME_LEVEL_STORAGE_KEY, level);
    }
    this.setVolume(VOLUME_LEVEL_VALUES[level]);
  }

  private getPool(sound: SoundOptions): Howl[] {
    let pool = this.soundPools.get(sound);
    if (!pool) {
      pool = SOUND_FILES[sound].map(
        src =>
          new Howl({
            src: [src],
            volume: this.effectiveVolume(sound),
            mute: this.volume === 0,
          })
      );
      this.soundPools.set(sound, pool);
    }
    return pool;
  }

  /** Some source clips (e.g. the heal chime) are mastered much louder than the rest —
   *  SOUND_GAIN lets each category be balanced independently of the master volume. */
  private effectiveVolume(sound: SoundOptions): number {
    return (this.volume + 0.05) * SOUND_GAIN[sound];
  }

  playMusic(music: MusicOptions) {
    if (this.currentMusicSrc === music && this.music?.playing()) {
      this.music.volume(this.effectiveMusicVolume());
      this.music.mute(this.volume === 0);
      return;
    }
    this.music?.unload();
    this.currentMusicSrc = music;
    this.music = new Howl({
      src: [music],
      loop: true,
      volume: this.effectiveMusicVolume(),
      mute: this.volume === 0,
    });
    if (this.volume > 0) {
      this.music.play();
    }
  }

  /** Music sits behind sound effects in the mix, so it gets its own gain on top of the
   *  master volume — independent of SOUND_GAIN, which only scales individual SFX. */
  private effectiveMusicVolume(): number {
    return this.volume * MUSIC_GAIN;
  }

  private setVolume(volume: number) {
    this.volume = volume;
    const muted = volume === 0;
    if (this.music) {
      this.music.volume(this.effectiveMusicVolume());
      this.music.mute(muted);
      if (muted) {
        this.music.pause();
      } else if (!this.music.playing()) {
        this.music.play();
      }
    }
    this.soundPools.forEach((pool, sound) =>
      pool.forEach(howl => {
        howl.volume(this.effectiveVolume(sound));
        howl.mute(muted);
      })
    );
  }

  stopMusic() {
    this.music?.pause();
  }

  /** Plays a sound. If `sound` has multiple variant files, picks one at random, then
   *  jitters volume a little further so repeated triggers (rapid attacks, DoT ticks, menu
   *  clicks) never sound like an exact robotic repeat — even sounds with only one source
   *  file get some variety this way. Jitter is applied per-instance (via the Howler
   *  playback id) rather than on the Howl's default volume, so it doesn't drift the
   *  baseline that setVolume() relies on for future plays.
   *  (Pitch jitter was tried here too but sounded bad and was reverted.) */
  playSound(sound: SoundOptions) {
    if (this.volume === 0) return;
    const pool = this.getPool(sound);
    const howl = pool[Math.floor(Math.random() * pool.length)];
    const id = howl.play();
    howl.volume(this.effectiveVolume(sound) * (1 + (Math.random() * 2 - 1) * SoundsService.VOLUME_JITTER), id);
  }
}

export type VolumeLevel = 'max' | 'loud' | 'lessLoud' | 'muted';

const VOLUME_LEVELS: VolumeLevel[] = ['max', 'loud', 'lessLoud', 'muted'];

const VOLUME_LEVEL_VALUES: Record<VolumeLevel, number> = {
  max: 0.15,
  loud: 0.1,
  lessLoud: 0.05,
  muted: 0,
};

const VOLUME_LEVEL_ICONS: Record<VolumeLevel, string> = {
  max: 'volume_up',
  loud: 'volume_down',
  lessLoud: 'volume_mute',
  muted: 'volume_off',
};

const VOLUME_LEVEL_STORAGE_KEY = 'soundVolumeLevel';

/** Music is mixed quieter than sound effects so SFX stay legible over it — independent of
 *  the master volume slider. Tune this directly if the music still feels too loud/quiet. */
const MUSIC_GAIN = 0.6;

export enum MusicOptions {
  BATTLE = 'assets/music/battle-music.mp3',
  DRAFT = 'assets/music/shop-music.mp3',
}

export enum SoundOptions {
  ATTACK = 'ATTACK',
  CLICK = 'CLICK',
  BUY = 'BUY',
  HIT = 'HIT',
  BURN = 'BURN',
  POISON = 'POISON',
  HEAL = 'HEAL',
  ACTIVATE = 'ACTIVATE',
  FIREWORK = 'FIREWORK',
  GOLD = 'GOLD',
}

/** Per-category volume multiplier on top of the master volume, to balance clips that
 *  were mastered louder/quieter than the rest (e.g. the heal chime rings hot). */
const SOUND_GAIN: Record<SoundOptions, number> = {
  [SoundOptions.ATTACK]: 1,
  [SoundOptions.CLICK]: 1,
  [SoundOptions.BUY]: 1,
  [SoundOptions.HIT]: 1,
  [SoundOptions.BURN]: 1,
  [SoundOptions.POISON]: 1,
  [SoundOptions.HEAL]: 0.4,
  [SoundOptions.ACTIVATE]: 1,
  [SoundOptions.FIREWORK]: 1,
  [SoundOptions.GOLD]: 0.6,
};

/** Variant file pools per sound. Multiple entries are randomized on each `playSound`. */
const SOUND_FILES: Record<SoundOptions, string[]> = {
  [SoundOptions.ATTACK]: ['assets/sound/sword-attack.mp3'],
  [SoundOptions.CLICK]: [
    'assets/sound/click-1.mp3',
    'assets/sound/click-2.mp3',
    'assets/sound/click-3.mp3',
  ],
  [SoundOptions.BUY]: [
    'assets/sound/coin-handle-1.mp3',
    'assets/sound/coin-handle-2.mp3',
  ],
  [SoundOptions.HIT]: [
    'assets/sound/sword-slash-1.mp3',
    'assets/sound/sword-slash-2.mp3',
    'assets/sound/sword-slash-3.mp3',
  ],
  [SoundOptions.BURN]: [
    'assets/sound/burn-crackle-1.mp3',
    'assets/sound/burn-crackle-2.mp3',
    'assets/sound/burn-crackle-3.mp3',
  ],
  [SoundOptions.POISON]: [
    'assets/sound/poison-bubble-1.mp3',
    'assets/sound/poison-bubble-2.mp3',
    'assets/sound/poison-bubble-3.mp3',
  ],
  [SoundOptions.HEAL]: ['assets/sound/heal-harp.mp3'],
  [SoundOptions.ACTIVATE]: [
    'assets/sound/activate-1.mp3',
    'assets/sound/activate-2.mp3',
  ],
  [SoundOptions.FIREWORK]: ['assets/sound/firework-sparkle.mp3'],
  [SoundOptions.GOLD]: [
    'assets/sound/coin-handle-1.mp3',
    'assets/sound/coin-handle-2.mp3',
  ],
};
