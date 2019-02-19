import { utils } from './utils'
import { settings } from './Settings'
import { mediaManager } from './mediaManager'
import * as $ from 'jquery'

/**
 * @class ViewController - Controls visual elements
*/
class ViewController {
  constructor () {
    this.webcamStream = {}
    this.lastTimeSinceOpacity = 0
    utils.extendJqueryEasings($)
    console.manager('Initializing ViewController')
  }

  /** General fade method
   *
   *
   * @param {HTMLElement} el The element to fade
   * @param {string} animation Type of fade (ex: 'fadeIn' will fade in)
   * @param {string | Number} [speed=''] Duration in milis of animation, defaults to whatever is set in css. This sets the classname, so the class must also be presented in css
   * @returns
   * @memberof ViewController
 */
  fade (el, animation, speed = '') {
    return new Promise((resolve, reject) => {
      if (animation === 'fadeIn') {
        el.removeClass('hide')
        el.removeClass('animated')
        el.removeClass('fadeOut')
        el.animateCss('fadeIn', function (e) {
          el.removeClass('hide')
          resolve(e)
        }, speed)
      } else if (animation === 'fadeOut') {
        if (el[0].style.opacity === 0) return
        el.removeClass('animated')
        el.removeClass('fadeIn')
        el.animateCss('fadeOut', function (e) {
          el.addClass('hide')
          resolve(e)
        }, speed)
      } else {
        reject(new Error('animation not known'))
      }
    })
  }
  /** Controls webcam viewing
   * @returns
   * @memberof ViewController
  */
  webcam () {
    /** Loads the webcam stream
     * @memberof ViewController.webcam
    */
    this.loadStream = wbcm => {
      this.webcamStream = wbcm
    }

    /** Shows the webcam still
     * @memberof ViewController.webcam
    */
    this.showFrame = () => {
      const canvas = document.getElementById('webcamFrame')
      const ctx = canvas.getContext('2d')
      const flipHorizontal = true
      canvas.width = settings.media.videoWidth
      canvas.height = settings.media.videoHeight

      ctx.clearRect(0, 0, 960, 540)
      ctx.save()
      ctx.scale(1, 1)
      ctx.translate(0, 0)
      if (flipHorizontal) {
        ctx.scale(-1, 1)
        ctx.translate(-960, 0)
      }
      ctx.drawImage(this.webcamStream, 0, 0, 960, 540)
      ctx.restore()
      this.opacity('frame', 1, 1, 'linear', () => { console.log('now showing frame') })
    }

    /** Hides the current webcam still
     * @memberof ViewController.webcam
    */
    this.hideFrame = () => {
      this.opacity('frame', 0, 1, 'linear', () => { console.log('now hiding frame') })
    }

    /** Shows the webcam stream
     * @memberof ViewController.webcam
    */
    this.showStream = () => {
      this.opacity('stream', 1, 1, 'linear', () => { console.log('now showing stream') })
    }

    /** Hides the webcam stream
     * @memberof ViewController.webcam
    */
    this.hideStream = () => {
      this.opacity('stream', 0, 1, 'linear', () => { console.log('now hiding stream') })
    }

    /** Changes the webcam opacity
     * @param {string} target Define target that you want the opacity to change for. Either webcam or frame.
     * @param {Number} opacity Opacity to change to
     * @param {Number} speed Duration of fade
     * @param {string} [easeString='linear'] Easing of fade
     * @memberof ViewController.webcam
    */
    this.opacity = (target, opacity, speed = 1500, easeString = 'linear') => {
      let el
      return new Promise((resolve, reject) => {
        switch (target) {
          case 'stream':
            el = $('#webcamStream')
            break
          case 'frame':
            el = $('#webcamFrame')
            break
        }
        el.finish()
        el.animate({ 'opacity': opacity }, speed, easeString, () => {
          this.lastTimeSinceOpacity = new Date().getTime() - this.lastTimeSinceOpacity
          resolve()
        })
      })
    }
    return this
  }

  /** Controls a scene video
   * @param {Number} sceneNumber Which scene to control
   * @param {string} movieName Name of the video to control
   * @memberof ViewController
  */
  scene (sceneNumber, movieName = null) {
    /** Hides the scene
     * @memberof ViewController.scene
    */
    this.hide = () => {
      if (sceneNumber === 'all') {
        let allFrames = []
        for (let i = 0; i < 3; i++) {
          allFrames.push(
            new Promise((resolve, reject) => {
              let sceneOutput = $('#sceneOutput' + sceneNumber)
              let noFrame = $('#noFrameFound')
              this.animateOut('fadeOut', function (e) {
                sceneOutput.addClass('hide')
                noFrame.removeClass('hide')
                resolve(e)
              })
            })
          )
          return Promise.all(allFrames)
        }
      } else {
        return new Promise((resolve, reject) => {
          let sceneOutput = $('#sceneOutput' + sceneNumber)
          let noFrame = $('#noFrameFound')
          this.animateOut('fadeOut', function (e) {
            sceneOutput.addClass('hide')
            noFrame.removeClass('hide')
            resolve(e)
          })
        })
      }
    }

    /** Shows the scene
     * @memberof ViewController.scene
    */
    this.show = () => {
      let promise = new Promise((resolve, reject) => {
        let sceneOutput = $('#sceneOutput' + sceneNumber)
        let noFrame = $('#noFrameFound')
        sceneOutput.removeClass('hide')
        noFrame.addClass('hide')
        this.animateIn('fadeIn', function (e) {
          resolve(e)
        })
      })
      return promise
    }

    /** Fades in the scene
     * @memberof ViewController.scene
     * @param {string} animation The animation to execute (ex: 'fadeIn')
     * @param {function} callback Callback to execute after animation has finished
    */
    this.animateIn = (animation, callback) => {
      let sceneOutput = $('#container' + sceneNumber)
      sceneOutput.animateCss(animation, function () {
        sceneOutput.css('opacity', 1)
        callback()
      })
    }

    /** Fades in the scene
     * @memberof ViewController.scene
     * @param {string} animation The animation to execute (ex: 'fadeOut')
     * @param {function} callback Callback to execute after animation has finished
    */
    this.animateOut = (animation, callback) => {
      let sceneOutput = $('#container' + sceneNumber)
      sceneOutput.animateCss(animation, function () {
        sceneOutput.css('opacity', 0)
        callback()
      })
    }

    /** Crops in the scene into a rectangle
     * @memberof ViewController.scene
    */
    this.crop = () => {
      return new Promise(resolve => {
        let thisSceneOutput = $('#sceneOutput' + sceneNumber)
        let thisSceneContainer = $('#container' + sceneNumber)
        let dimensionWidth = mediaManager.movieDimensions[movieName]

        thisSceneOutput.css('width', dimensionWidth / 3)
        thisSceneContainer.css('width', (dimensionWidth / 3))
        resolve()
      })
    }
    return this
  }

  /** Container for the scene text methods
   * @memberof ViewController.scene
   * @param {Number} sceneNumber The scene to set the text for
  */
  sceneText (sceneNumber) {
    let el = $('#text' + sceneNumber)

    /** Changes the text under the stream
     * @memberof ViewController.scene.sceneText
    */
    this.changeText = (text) => {
      el.text(deUrlify(text))
      function deUrlify (text) {
        text = text.split('_').join(' ')
        return text
      }
    }

    /** Sets the position of the scene HTMLElement
     * @memberof ViewController.scene.sceneText
    */
    this.setPosition = () => {
      let scene = $('#container' + sceneNumber)
      el.css('left', scene.offset().left)
    }

    /** Showsthe text
     * @memberof ViewController.scene.sceneText
    */
    this.show = () => {
      return new Promise((resolve) => {
        this.animateIn('fadeIn', function () {
          el.css('opacity', 1)
        })
      })
    }

    /** Hides the text
     * @memberof ViewController.scene.sceneText
    */
    this.hide = () => {
      return new Promise((resolve) => {
        if (el.css('opacity') === 0 || el.css('opacity') === '0') {
          resolve()
        } else {
          this.animateOut('fadeOut', function () {
            el.css('opacity', 0)
          })
        }
      })
    }

    /** Fades in the text
     * @param {string}
     * @memberof ViewController.scene.sceneText
     * * @param {string} animation The animation to execute (ex: 'fadeIn')
     * @param {function} callback Callback to execute after animation has finished
    */
    this.animateIn = (animation, callback) => {
      el.animateCss(animation, function () {
        callback()
      })
    }

    /** Fades out the text
     * @memberof ViewController.scene.sceneText
     * @param {string} animation The animation to execute (ex: 'fadeOut')
     * @param {function} callback Callback to execute after animation has finished
    */
    this.animateOut = (animation, callback) => {
      el.animateCss(animation, function () {
        callback()
      })
    }
    return this
  }

  infoText () {
    class InfoText {
      constructor () {
        this.containerEl = $('#engageInfoTextContainer')
      }

      opacity (opacity, speed = 1000, easeString = 'linear') {
        return new Promise((resolve, reject) => {
          this.containerEl.finish()
          this.containerEl.animate({ 'opacity': opacity }, speed, easeString, () => {
            resolve()
          })
        })
      }
    }
    return new InfoText()
  }
  hideAllScenes () {
    return new Promise((resolve, reject) => {
      Promise.all(
        [
          this.scene(0).hide(),
          this.scene(1).hide(),
          this.scene(2).hide()
        ]
      ).then(function () {
        resolve('all are resolved')
      })
    })
  }

  hideAllTexts () {
    return new Promise((resolve, reject) => {
      Promise.all(
        [
          this.sceneText(0).hide(),
          this.sceneText(1).hide(),
          this.sceneText(2).hide()
        ]
      ).then(function () {
        resolve('all are resolved')
      })
    })
  }

  poses (poses = null) {
    class Poses {
      constructor (poses) {
        this.poses = poses
        this.scaleFactor = 0.3
      };

      fade (fadeDirection, speed = '', delay = 0) {
        return new Promise((resolve, reject) => {
          let el = $('#canvascas')

          setTimeout(() => {
            if (fadeDirection === 'rein') {
              speed = 'fast'
              fadeDirection = 'in'
            }
            el.addClass(speed)
            if (fadeDirection === 'in') {
              if (el.hasClass('show')) resolve('already faded in')
              el.removeClass('hide')
              el.addClass('show')
              el.removeClass('fadeOut')
            } else if (fadeDirection === 'out') {
              el.removeClass('fadeIn')
            }
            el.animateCss('fade' + utils.capFirst(fadeDirection), function () {
              el.removeClass(speed)
              if (fadeDirection === 'out') {
                el.addClass('hide')
                el.removeClass('show')
              } else if (fadeDirection === 'in') {
                el.removeClass('easeIn')
              }
              resolve()
            })
          }, delay)
        })
      }
      getCoords (point, pose) {
        if (point === 'median') {
          return {
            x: pose.medianPosition.x * this.scaleFactor,
            y: pose.medianPosition.y * this.scaleFactor
          }
        } else {
          return {
            x: pose.keypoints[point].position.x * this.scaleFactor,
            y: pose.keypoints[point].position.y * this.scaleFactor
          }
        }
      }

      drawSingle (ctx, pose) {
        const medianPos = this.getCoords('median', pose)
        const nosePos = this.getCoords('nose', pose)
        const leftEyePos = this.getCoords('leftEye', pose)
        const rightEyePos = this.getCoords('rightEye', pose)
        const leftShoulderPos = this.getCoords('leftShoulder', pose)
        const rightShoulderPos = this.getCoords('rightShoulder', pose)
        const leftElbowPos = this.getCoords('leftElbow', pose)
        const rightElbowPos = this.getCoords('rightElbow', pose)
        const leftWristPos = this.getCoords('leftWrist', pose)
        const rightWristPos = this.getCoords('rightWrist', pose)
        const leftHipPos = this.getCoords('leftHip', pose)
        const rightHipPos = this.getCoords('rightHip', pose)
        const leftKneePos = this.getCoords('leftKnee', pose)
        const rightKneePos = this.getCoords('rightKnee', pose)
        const notActiveFadeValue = 0.3
        const notActiveFadeValueForArcs = 0

        ctx.globalAlpha = notActiveFadeValue
        ctx.beginPath()
        ctx.moveTo(nosePos.x, nosePos.y)
        ctx.lineTo(
          (leftEyePos.x + rightEyePos.x) / 2,
          (leftEyePos.y + rightEyePos.y) / 2
        )
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(leftEyePos.x, leftEyePos.y)
        ctx.lineTo(rightEyePos.x, rightEyePos.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(leftWristPos.x, leftWristPos.y)
        ctx.lineTo(leftElbowPos.x, leftElbowPos.y)
        ctx.lineTo(leftShoulderPos.x, leftShoulderPos.y)
        ctx.lineTo(rightShoulderPos.x, rightShoulderPos.y)
        ctx.lineTo(rightElbowPos.x, rightElbowPos.y)
        ctx.lineTo(rightWristPos.x, rightWristPos.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(
          (leftShoulderPos.x + rightShoulderPos.x) / 2,
          (leftShoulderPos.y + rightShoulderPos.y) / 2
        )
        ctx.lineTo(
          (leftHipPos.x + rightHipPos.x) / 2,
          (leftHipPos.y + rightHipPos.y) / 2
        )
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(leftKneePos.x, leftKneePos.y)
        ctx.lineTo(leftHipPos.x, leftHipPos.y)
        ctx.lineTo(
          (leftHipPos.x + rightHipPos.x) / 2,
          (leftHipPos.y + rightHipPos.y) / 2
        )
        ctx.lineTo(rightHipPos.x, rightHipPos.y)
        ctx.lineTo(rightKneePos.x, rightKneePos.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.globalAlpha = 1
        ctx.arc(medianPos.x, medianPos.y, 4, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = 1
        ctx.arc(nosePos.x, nosePos.y, 4, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = 1
        ctx.arc(leftEyePos.x, leftEyePos.y, 4, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = 1
        ctx.arc(rightEyePos.x, rightEyePos.y, 4, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = 1
        ctx.arc(leftWristPos.x, leftWristPos.y, 4, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = 1
        ctx.arc(rightWristPos.x, rightWristPos.y, 4, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = notActiveFadeValueForArcs
        ctx.arc(leftShoulderPos.x, leftShoulderPos.y, 3, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = notActiveFadeValueForArcs
        ctx.arc(rightShoulderPos.x, rightShoulderPos.y, 3, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = notActiveFadeValueForArcs
        ctx.arc(rightHipPos.x, rightHipPos.y, 3, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = notActiveFadeValueForArcs
        ctx.arc(leftHipPos.x, leftHipPos.y, 3, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = notActiveFadeValueForArcs
        ctx.arc(leftKneePos.x, leftKneePos.y, 3, 0, Math.PI * 2, true)
        ctx.fill()
        ctx.beginPath()
        ctx.globalAlpha = notActiveFadeValueForArcs
        ctx.arc(rightKneePos.x, rightKneePos.y, 3, 0, Math.PI * 2, true)
        ctx.fill()
      }

      drawMultiple (ctx) {
        poses.poses.forEach(pose => {
          const medianPos = this.getCoords('median', pose)
          const nosePos = this.getCoords('nose', pose)
          const leftEyePos = this.getCoords('leftEye', pose)
          const rightEyePos = this.getCoords('rightEye', pose)
          const leftShoulderPos = this.getCoords('leftShoulder', pose)
          const rightShoulderPos = this.getCoords('rightShoulder', pose)
          const leftElbowPos = this.getCoords('leftElbow', pose)
          const rightElbowPos = this.getCoords('rightElbow', pose)
          const leftWristPos = this.getCoords('leftWrist', pose)
          const rightWristPos = this.getCoords('rightWrist', pose)
          const leftHipPos = this.getCoords('leftHip', pose)
          const rightHipPos = this.getCoords('rightHip', pose)
          const leftKneePos = this.getCoords('leftKnee', pose)
          const rightKneePos = this.getCoords('rightKnee', pose)

          const notActiveFadeValue = 0.3
          const notActiveFadeValueForArcs = 0

          ctx.globalAlpha = notActiveFadeValue
          ctx.beginPath()
          ctx.moveTo(nosePos.x, nosePos.y)
          ctx.lineTo(
            (leftEyePos.x + rightEyePos.x) / 2,
            (leftEyePos.y + rightEyePos.y) / 2
          )
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(leftEyePos.x, leftEyePos.y)
          ctx.lineTo(rightEyePos.x, rightEyePos.y)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(leftWristPos.x, leftWristPos.y)
          ctx.lineTo(leftElbowPos.x, leftElbowPos.y)
          ctx.lineTo(leftShoulderPos.x, leftShoulderPos.y)
          ctx.lineTo(rightShoulderPos.x, rightShoulderPos.y)
          ctx.lineTo(rightElbowPos.x, rightElbowPos.y)
          ctx.lineTo(rightWristPos.x, rightWristPos.y)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(
            (leftShoulderPos.x + rightShoulderPos.x) / 2,
            (leftShoulderPos.y + rightShoulderPos.y) / 2
          )
          ctx.lineTo(
            (leftHipPos.x + rightHipPos.x) / 2,
            (leftHipPos.y + rightHipPos.y) / 2
          )
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(leftKneePos.x, leftKneePos.y)
          ctx.lineTo(leftHipPos.x, leftHipPos.y)
          ctx.lineTo(
            (leftHipPos.x + rightHipPos.x) / 2,
            (leftHipPos.y + rightHipPos.y) / 2
          )
          ctx.lineTo(rightHipPos.x, rightHipPos.y)
          ctx.lineTo(rightKneePos.x, rightKneePos.y)
          ctx.stroke()

          ctx.beginPath()
          ctx.globalAlpha = 1
          ctx.arc(medianPos.x, medianPos.y, 4, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          if (poses.poses.length === 2) {
            ctx.globalAlpha = 1
            ctx.arc(nosePos.x, nosePos.y, 4, 0, Math.PI * 2, true)
          } else {
            ctx.globalAlpha = notActiveFadeValueForArcs
            ctx.arc(nosePos.x, nosePos.y, 4, 0, Math.PI * 2, true)
          }
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(leftEyePos.x, leftEyePos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(rightEyePos.x, rightEyePos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(leftWristPos.x, leftWristPos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(rightWristPos.x, rightWristPos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(leftShoulderPos.x, leftShoulderPos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(rightShoulderPos.x, rightShoulderPos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(rightHipPos.x, rightHipPos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(leftHipPos.x, leftHipPos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(leftKneePos.x, leftKneePos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
          ctx.beginPath()
          ctx.globalAlpha = notActiveFadeValueForArcs
          ctx.arc(rightKneePos.x, rightKneePos.y, 3, 0, Math.PI * 2, true)
          ctx.fill()
        })
      }

      draw () {
        let canvas = document.getElementById('canvascas')
        let ctx = canvas.getContext('2d')
        canvas.width = 1920 / 2
        canvas.height = 1080 / 2
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = 'rgb(244,244,244)'
        ctx.fillStyle = 'rgb(244,244,244)'
        ctx.lineWidth = 2

        if (poses.poses.length === 1) {
          this.drawSingle(ctx, poses.poses[0])
        } else {
          this.drawMultiple(ctx)
        }

        //  💄 how to do gradients
        //  var grad = ctx.createLinearGradient(50, 50, 150, 150);
        //  grad.addColorStop(0, "white");
        //  grad.addColorStop(1, "black");

        //  ctx.strokeStyle = grad;
      }
    }
    return new Poses(poses)
  }

  attract () {
    this.scenes = function () {
      const el = $('#attractVideo')

      this.show = (speed = '') => {
        el.removeClass('animated')
        el.removeClass('fadeOut')
        console.log(el)
        return viewController.fade(el, 'fadeIn', speed)
      }

      this.hide = (speed = '') => {
        return viewController.fade(el, 'fadeOut', speed)
      }

      return this
    }

    this.texts = function () {
      const el = $('#attractTextContainers')

      this.show = (speed = '') => {
        $('#attract').removeClass('hide')
        el.removeClass('animated')
        el.removeClass('fadeIn')
        return viewController.fade(el, 'fadeIn', speed)
      }
      this.hide = (speed = '') => {
        return viewController.fade(el, 'fadeOut', speed)
      }
      return this
    }

    const el = $('#attract')

    this.show = () => {
      el.removeClass('hide')
      el.removeClass('fadeOut')
      let texts = viewController.attract().texts().show()
      let scenes = viewController.attract().scenes().show()
      return Promise.all([texts, scenes], function () {
        return 'all are shown'
      })
    }

    this.hide = () => {
      let texts = viewController.attract().texts().hide()
      let scenes = viewController.attract().scenes().hide()
      return Promise.all([texts, scenes], function () {
        return 'all are shown'
      })
    }

    this.video = function () {
      let videoEl = $('#attractVideo')
      this.replay = () => {
        videoEl[0].currentTime = 0
      }
      return this
    }
    return this
  }

  engage () {
    let els = $('.engageToDissapear')
    this.show = () => {
      return new Promise((resolve) => {
        els.each((i, el) => {
          $(el).animateCss('fadeIn', function () {
            $(el).removeClass('hide')
          })
        })
        resolve()
      })
    }

    this.hide = () => {
      return new Promise((resolve) => {
        els.each((i, el) => {
          if ($(el).hasClass('fadeIn')) {
            $(el).removeClass('fadeIn')
          }
          $(el).removeClass('animated')
          $(el).animateCss('fadeOut', function () {
            els.addClass('hide')
          })
        })
        resolve()
      })
    }
    this.NoPosesFound = function () {
      const el = $('#noSimilarPoses')
      this.changeText = (posesQuantity) => {
        if (posesQuantity === 1) {
          el.html('<b>Try another pose or composition.</b><br>This prototype only contains a fraction of Eye’s film collection, in which no matching shot could be found. ')
        } else if (posesQuantity > 1) {
          el.html('<b>Try another pose or composition.</b><br>This prototype only contains a fraction of Eye’s film collection, in which no matching shot could be found. ')
        }
      }
      this.show = () => {
        return new Promise(resolve => {
          if (el.css('opacity') === 1 || el.css('opacity') === '1') {
            resolve()
            return
          }
          el.css('opacity', 0)
          if (el.hasClass('fadeOut')) {
            el.removeClass('fadeIn')
          } else if (el.hasClass('fadeIn')) {
            resolve()
          }
          el.animateCss('fadeIn', () => {
            el.css('opacity', 1)
            resolve()
          })
        })
      }

      this.hide = () => {
        return new Promise(resolve => {
          if (el.css('opacity') === 0) {
            resolve()
            return
          }
          el.css('opacity', 1)
          if (el.hasClass('fadeIn')) {
            el.removeClass('fadeIn')
          } else if (el.hasClass('fadeOut')) {
            resolve()
          }
          el.animateCss('fadeOut', () => {
            el.css('opacity', 0)
            resolve()
          })
        })
      }
      return this
    }
    return this
  }
}

$.fn.extend({
  animateCss: function (animationName, callback, speed = '') {
    // console.log(new Date().getTime(), "animateCss is called by", this);
    var animationEnd = (function (el) {
      var animations = {
        animation: 'animationend',
        OAnimation: 'oAnimationEnd',
        MozAnimation: 'mozAnimationEnd',
        WebkitAnimation: 'webkitAnimationEnd'
      }

      for (var t in animations) {
        if (el.style[t] !== undefined) {
          return animations[t]
        }
      }
    })(document.createElement('div'))

    this.addClass('animated ' + speed + ' ' + animationName).one(animationEnd, function () {
      $(this).removeClass('animated ' + speed + ' ' + animationName)

      if (typeof callback === 'function') callback()
    })

    return this
  }
})

export let viewController = new ViewController()
