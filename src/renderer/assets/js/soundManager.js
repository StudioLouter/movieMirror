import * as $ from 'jquery'
/**
 * @class SoundManager - Controls all sounds
*/
class SoundManager {
  constructor () {
    console.manager('Initializing SoundManager')
    this.attract = this.Attract()
    this.engage = this.Engage()
  }
  /** Controls Attract sound
   * @returns Returns methods for adjusting sound on Attract
   * @memberof SoundManager
  */
  Attract () {
    let el = $('#attractVideo')
    return {
      /** Mute attract video
       * @memberof SoundManager.Attract
      */
      mute: () => {
        el.animate({ volume: 0 }, 1000)
      },
      /** Unmute attract video
       * @memberof SoundManager.Attract
      */
      unmute: () => {
        el.animate({ volume: 1 }, 1000)
      }
    }
  }

  /** Controls Engage sound
   * @returns Returns methods for adjusting sound on Engage
   * @memberof SoundManager
  */
  Engage () {
    let els = $('.videoWindow')
    return {
      /** Unmute engage videos
       * @memberof SoundManager.Engage
      */
      mute: () => {
        els.each((i, el) => {
          $(el).animate({ volume: 0 }, 1000)
        })
      },
      /** Unmute engage videos
       * @memberof SoundManager.Engage
      */
      unmute: () => {
        els.each((i, el) => {
          $(el).animate({ volume: 1 }, 1000)
        })
      }
    }
  }
}
export let soundManager = new SoundManager()
