import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  music: HTMLAudioElement = new Audio();
  volume: number = 0.5;

  constructor() {}

  playMusic(music: MusicOptions) {
    this.music.volume = this.volume;
    this.music.src = music;
    this.music.loop = true;
    this.music.load();
    this.music.play();
  }

  setVolume(volume: number) {
    this.volume = volume;
    this.music.volume = this.volume;
  }

  stopMusic() {
    this.music.pause();
  }

  playSound(sound: SoundOptions) {
    const audio = new Audio(sound);
    audio.volume = this.volume === 0 ? 0 : this.volume + 0.3;
    audio.load();
    audio.play();
  }
}

export enum MusicOptions {
  BATTLE = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/music/battle-music.mp3',
  DRAFT = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/music/shop-music.mp3',
}

export enum SoundOptions {
  ATTACK = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/sound/sword-attack.mp3',
  CLICK = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/sound/click-old.mp3',
  BUY = 'https://chungus-battles.b-cdn.net/chungus-battles-assets/sound/coin-cling.mp3',
}
