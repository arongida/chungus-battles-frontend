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
      this.music.volume(this.volume);
      this.music.mute(this.volume === 0);
      return;
    }
    this.music?.unload();
    this.currentMusicSrc = music;
    this.music = new Howl({
      src: [music],
      loop: true,
      volume: this.volume,
      mute: this.volume === 0,
    });
    if (this.volume > 0) {
      this.music.play();
    }
  }

  private setVolume(volume: number) {
    this.volume = volume;
    const muted = volume === 0;
    if (this.music) {
      this.music.volume(volume);
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

  /** Plays a sound. If `sound` has multiple variant files, picks one at random so
   *  repeated triggers (e.g. rapid attacks, DoT ticks) don't sound identical every time. */
  playSound(sound: SoundOptions) {
    if (this.volume === 0) return;
    const pool = this.getPool(sound);
    const howl = pool[Math.floor(Math.random() * pool.length)];
    howl.play();
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
};

/** Variant file pools per sound. Multiple entries are randomized on each `playSound`. */
const SOUND_FILES: Record<SoundOptions, string[]> = {
  [SoundOptions.ATTACK]: ['assets/sound/sword-attack.mp3'],
  [SoundOptions.CLICK]: ['assets/sound/click-old.mp3'],
  [SoundOptions.BUY]: ['assets/sound/coin-cling.mp3'],
  [SoundOptions.HIT]: [
    'assets/sound/hit-impact-1.mp3',
    'assets/sound/hit-impact-2.mp3',
    'assets/sound/hit-impact-3.mp3',
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
  [SoundOptions.HEAL]: ['assets/sound/heal-chime.mp3'],
  [SoundOptions.ACTIVATE]: [
    'assets/sound/activate-1.mp3',
    'assets/sound/activate-2.mp3',
  ],
  [SoundOptions.FIREWORK]: ['assets/sound/firework-sparkle.mp3'],
};
