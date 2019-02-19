import { utils } from './utils'
import { settings } from './Settings'
import * as yaml from 'js-yaml'

const fs = require('fs')
const path = require('path')

export let currentScene = ''
export let currentMovie = ''

let videoWillPlay = true
/**
 * @class MediaManager - Control media file management and playback
 */
class MediaManager {
  constructor () {
    this.videoWidth = settings.media.videoWidth
    this.videoHeight = settings.media.videoHeight
    this.movieDimensions = yaml.safeLoad(fs.readFileSync(path.join(path.resolve('./static'), 'data', 'MovieDimensions.yaml')))

    console.manager('Initializing MediaManager')
  }

  /**
 *
 * @description Loads a video or a webcam
 * @param {string} type String describing what kind of media is being used as the input. Is either webcam or video.
 * @param {object} [fileinfo=null] Object describing the video to load.
 * @param {string} fileinfo.movieName Name of the video
 * @param {string} fileinfo.sceneCounter The scene to load.
 * @returns {Video} video
 * @memberof MediaManager
 */
  async loadVideo (type, fileinfo = null) {
    let video
    switch (type) {
      case 'video':
        await this.loadVideoFile(fileinfo.movieName + '/' + fileinfo.movieName + '-' + utils.pad(fileinfo.sceneCounter, 3)).then(function (vid) {
          if (vid === false) return false
          video = vid
          currentScene = fileinfo.sceneCounter
          currentMovie = fileinfo.movieName
        })
        break
      case 'camera':
        video = await this.setupCamera()
        break
      default:
        console.error('Video type is niet herkent, typo?')
        break
    }

    video.play()
    return video
  }

  /**
   * @description Sets up the webcam for input
   * @returns {Video} Video HTML element
   * @memberof MediaManager
   */
  async setupCamera () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { throw new Error('Browser API navigator.mediaDevices.getUserMedia not available') }
    const video = document.getElementById('webcamStream')
    video.width = this.videoWidth
    video.height = this.videoHeight

    const stream = await navigator.mediaDevices.getUserMedia({ 'audio': false, 'video': { facingMode: 'user', width: this.videoWidth, height: this.videoHeight } })
    video.srcObject = stream

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve(video)
      }
    })
  }
  /**
   *
   * @description Retreives path of video
   * @param {Object} pose Pose object containing meta information about the movie to look for
   * @returns {string | boolean} Either false if path can not be found, or string of the path if it has.
   * @memberof MediaManager
  */
  retrieveMovieScene (pose) {
    let video = this.getVideoPath(pose.meta.movie, pose.meta.sceneCount)
    return video
  }

  /**
   *
   * @description Pause a scene
   * @param {Number} sceneNumber Scene to pause
   * @param {Number} waitTime Amount of milis to play before pause
   * @memberof MediaManager
  */
  pause (sceneNumber, waitTime) {
    document.getElementById('sceneOutput' + sceneNumber).pause()
  }

  /**
   * @description Plays a video DOM element
   * @param {Number} sceneNumber Scene to pause
   * @param {Number} untilTime Plays until milis has been elapsed
   * @param {Number} [delay=0] Amount of milis to wait before playback
   * @memberof MediaManager
  */
  play (sceneNumber, untilTime, delay = 0) {
    if (videoWillPlay) {
      document.getElementById('sceneOutput' + sceneNumber).play()
    }
  }
  /**
   * @description Places a video inside a DOM element with a specified time as its startpoint.
   * @param {string} pathToFile Path to the video file
   * @param {Number} sceneNumber The scene number that will be played
   * @param {Number} time Amount of milis to set as the astartpoint of the video
   * @returns {Video} return the video DOM element
   * @memberof MediaManager
  */

  putVideoIntoWindowWithTime (pathToFile, sceneNumber, time) {
    return new Promise((resolve, reject) => {
      let video = document.getElementById('sceneOutput' + sceneNumber)
      video.setAttribute('src', pathToFile)
      video.currentTime = time
      video.oncanplaythrough = () => {
        resolve(video)
      }
    })
  }

  /**
   *
   * @description Actual path finder.
   * @param {string} filename name of the file to search for
   * @param {Number} sceneCount the scene id to look for
   * @returns {boolean | string} either false if path is not found, or the path stringified if it has been found.
   * @memberof MediaManager
  */
  getVideoPath (filename, sceneCount) {
    const __static = path.resolve('./static')
    const pathToFile = path.join(__static, 'video', 'scenes', filename, filename + '-' + utils.pad(sceneCount, 3) + '.webm')
    if (path.resolve(pathToFile) === false) {
      return false
    } else {
      return pathToFile
    }
  }
}

export let mediaManager = new MediaManager()
