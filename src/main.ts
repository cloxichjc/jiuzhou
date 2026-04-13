import Phaser from 'phaser';
import { phaserConfig } from './game/config';
import './styles.css';

const existingGame = document.querySelector('canvas');
if (existingGame) {
  existingGame.remove();
}

new Phaser.Game(phaserConfig);
