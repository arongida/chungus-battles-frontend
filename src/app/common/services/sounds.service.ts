import { Injectable } from '@angular/core';

const POOL_SIZE = 5;

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  music?: HTMLAudioElement;
  volume: number = 0.1;

  private soundPools = new Map<SoundOptions, HTMLAudioElement[]>();
  private poolIndices = new Map<SoundOptions, number>();

  constructor() {
    if (typeof Audio !== 'undefined') {
      this.music = new Audio();
    }
  }

  private getPool(sound: SoundOptions): HTMLAudioElement[] {
    if (!this.soundPools.has(sound)) {
      const pool = Array.from({ length: POOL_SIZE }, () => {
        const audio = new Audio(sound);
        audio.volume = this.volume + 0.05;
        audio.load();
        return audio;
      });
      this.soundPools.set(sound, pool);
      this.poolIndices.set(sound, 0);
    }
    return this.soundPools.get(sound)!;
  }

  playMusic(music: MusicOptions) {
    if (!this.music || (this.music.src === music && this.music.played)) return;
    this.music.volume = this.volume;
    this.music.src = music;
    this.music.loop = true;
    this.music.load();
    this.music.play();
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (!this.music) return;
    this.music.volume = this.volume;
    this.soundPools.forEach(pool =>
      pool.forEach(audio => (audio.volume = this.volume + 0.05))
    );
    if (volume === 0) {
      this.music.pause();
    } else if (this.music.src && this.music.paused) {
      this.music.play();
    }
  }

  stopMusic() {
    if (!this.music) return;
    this.music.pause();
  }

  playSound(sound: SoundOptions) {
    if (typeof Audio === 'undefined' || this.volume === 0) return;
    const pool = this.getPool(sound);
    const index = this.poolIndices.get(sound)!;
    const audio = pool[index];
    audio.currentTime = 0;
    audio.play().catch(() => {});
    this.poolIndices.set(sound, (index + 1) % POOL_SIZE);
  }
}

export enum MusicOptions {
  BATTLE = 'assets/music/battle-music.mp3',
  DRAFT = 'assets/music/shop-music.mp3',
}

export enum SoundOptions {
  ATTACK = 'assets/sound/sword-attack.mp3',
  CLICK = 'assets/sound/click-old.mp3',
  BUY = 'assets/sound/coin-cling.mp3',
}
