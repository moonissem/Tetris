export default class SoundPlayer {
  static soundOn = true;

  static playingSounds = new Set();

  // plays a sound with optional loop and volume settings
  static async playSound(sound, doLoop = false, volumeLevel = 0.5) {
    try {
      if (this.soundOn) {
        sound.volume = volumeLevel;
        sound.loop = doLoop;
        this.playingSounds.add(sound);
        await sound.play();
      }
    } catch (error) { /* empty */ }
  }

  // pauses a sound
  static pauseSound(sound) {
    try {
      if (this.soundOn) {
        sound.pause();
        this.playingSounds.delete(sound);
      }
    } catch (error) { /* empty */ }
  }

  // pauses all sounds that are currently playing
  static pauseAllSounds() {
    this.playingSounds.forEach((sound) => this.pauseSound(sound));
  }

  // fades out a sound
  static fadeSoundOut(sound) {
    try {
      if (this.soundOn && !sound.paused) {
        const volumeChange = 0.02;
        const targetVolume = 0.0;
        let currentVolume = sound.volume;
        const fadeAudio = setInterval(() => {
          currentVolume -= volumeChange;
          sound.volume = currentVolume.toFixed(1);
          if (sound.volume <= targetVolume) {
            this.playingSounds.delete(sound);
            this.pauseSound(sound);
            clearInterval(fadeAudio);
          }
        }, 25);
      }
    } catch (error) { /* empty */ }
  }

  // plays a sound effect with varying volume and speed based on stack height
  static playOnEdgeSoundFX(sound, stackHeight) {
    try {
      if (this.soundOn) {
        this.playingSounds.add(sound);
        const heightThreshold = 7;
        const startVolume = 0.1;
        const maxVolume = 1.0;
        const startRate = 0.5;
        const maxRate = 1.4;
        sound.volume = (startVolume + ((maxVolume - startVolume) * ((heightThreshold - stackHeight) / heightThreshold))).toFixed(1);
        sound.playbackRate = (startRate + ((maxRate - startRate) * ((heightThreshold - stackHeight) / heightThreshold))).toFixed(1);
        sound.loop = true;
        sound.play();
      }
    } catch (error) { /* empty */ }
  }
}
