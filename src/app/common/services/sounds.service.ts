import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  music?: HTMLAudioElement;
  volume: number = 0.1;

  constructor() {
    if (typeof Audio !== 'undefined') {
      this.music = new Audio();
    }
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
    if (!this.music || this.volume === 0) return;
    const audio = new Audio(sound);
    audio.volume = this.volume + 0.05;
    audio.load();
    audio.play();
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
