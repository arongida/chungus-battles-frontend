import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }


    preload ()
    {
        this.load.setPath('assets');
        this.load.spritesheet('player-idle','sprites/warrior/Idle.png', {frameWidth: 72, frameHeight: 86})
        this.load.spritesheet('player','sprites/warrior/Attack 1.png', {frameWidth: 85, frameHeight: 86})

    }

    create ()
    {

        const player = this.add.sprite(200, 500, 'player');
        player.anims.create({key: 'player-attack', frames: 'player', duration: 500, repeat: -1});
        player.setScale(4);
        player.play('player-attack');
        EventBus.emit('current-scene-ready', this);

    }
}
