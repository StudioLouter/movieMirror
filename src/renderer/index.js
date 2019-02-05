// import { emojis } from './assets/js/utils.js' // this inmediatly calls emoji() which sets new console methods.
import { settings } from './assets/js/Settings'
import { utils } from './assets/js/utils'
import { mediaManager } from './assets/js/mediaManager'
import { dbClient } from './assets/js/dbController'
import { poseController } from './assets/js/poseController'
import { viewController } from './assets/js/ViewController'
import { soundManager } from './assets/js/soundManager'

let loop = {}
let noPoseCounter = 0
let noSimilarPosesFound = 0

require('./assets/sass/main.sass')
let webcam

async function initApp () {
  console.sparkles('Initializing app')
  await poseController.loadModel()
  webcam = await mediaManager.loadVideo('camera')
  viewController.webcam().loadStream(webcam)
  viewController.webcam().showStream()
  soundManager.attract.unmute()
  soundManager.engage.mute()
  connectToMongo()
}

async function connectToMongo () {
  await dbClient.connect(true).then(function () {
    setAttractMode()
    document.getElementById('noDatabaseConnection').style.display = 'none'
  }).catch(() => {
    document.getElementById('noDatabaseConnection').style.display = 'block'
    connectToMongo()
  })
}

function setAttractMode () {
  clearInterval(loop)
  viewController.engage().NoPosesFound().hide()
  soundManager.engage.mute()
  viewController.engage().hide()
  viewController.infoText().opacity(0, 1500)
  viewController.attract().texts().show('slower').then(function () {
    viewController.webcam().opacity('stream', '1', 800, 'linear')
    viewController.attract().video().replay()
    soundManager.attract.unmute()
    viewController.attract().scenes().show()
    startAttractLoop()
  })
}
function setEngageMode () {
  clearInterval(loop)
  soundManager.attract.mute()
  soundManager.engage.unmute()
  viewController.infoText().opacity(1, settings.timings.engage.fadeInText)
  viewController.engage().show()
  setTimeout(() => {
    EngageTick('setEngageMode')
  }, settings.timings.engage.waitBeforeCheckingAgain)
  viewController.attract().texts().hide().then(function () {
    viewController.attract().scenes().hide('slower')
  })
}

async function EngageTick (caller, noFramesWhereFound = false) {
  function retry (caller) {
    viewController.poses().fade('out', 'faster')
    viewController.webcam().opacity('stream', 1, 1, 'easeInOutExpo')
    viewController.webcam().opacity('frame', 0, 1, 'easeInOutExpo').then(() => {
      EngageTick(caller, true)
    })
  }

  soundManager.engage.mute()
  viewController.hideAllScenes()
  viewController.hideAllTexts()
  viewController.webcam().opacity('stream', 0.4, 1)
  viewController.webcam().opacity('frame', 0, 1)
  await viewController.webcam().opacity('stream', 1, settings.timings.engage.snapshotTiming)

  viewController.webcam().hideStream()
  viewController.webcam().showFrame()
  poseController.getPoseFromFrame(webcam).then(posesFound => {
    viewController.poses(posesFound).draw()
    viewController.poses(posesFound).fade('in', 'faster')
    dbClient.getCombarablePoses(posesFound, noSimilarPosesFound).then(similarPoses => {
      if (similarPoses === 0) {
        noSimilarPosesFound++
        viewController.engage().NoPosesFound().changeText(posesFound.meta.amountOfPoses)
        viewController.engage().NoPosesFound().show()
        retry('similararposes === 0')
      } else {
        noSimilarPosesFound = 0
        viewController.engage().NoPosesFound().hide()
        soundManager.engage.unmute()
        similarPoses.forEach((pose, poseNumber) => {
          const video = mediaManager.retrieveMovieScene(pose)
          viewController.sceneText(poseNumber).changeText(pose.meta.movie)
          mediaManager.putVideoIntoWindowWithTime(video, poseNumber, pose.meta.timeInScene).then(() => {
            viewController.scene(poseNumber, pose.meta.movie).crop()
            setTimeout(() => {
              mediaManager.play(poseNumber, pose.meta.timeInScene, poseNumber)
              viewController.sceneText(poseNumber).setPosition()
              viewController.sceneText(poseNumber).show()
              if (poseNumber === 0) {
                viewController.webcam().opacity('frame', 0.5, settings.timings.engage.fadeOutFrame, 'easeInOutExpo')
                viewController.poses(posesFound).fade('out', 'slow')
              }
            }, 2000)
            viewController.scene(poseNumber).show()
          })
        })
        setTimeout(() => {
          EngageTick('succesful')
        }, settings.timings.engage.completeLoop)
      }
      for (var i = similarPoses.length; i < 3; i++) {
        viewController.scene(i).hide()
      }
    }).catch(noSimilarPoses => {
      noSimilarPosesFound++
      viewController.engage().NoPosesFound().changeText(posesFound.meta.amountOfPoses)
      viewController.engage().NoPosesFound().show()
      retry(noSimilarPoses)
    })
  }).catch(noPoses => {
    noSimilarPosesFound = 0
    viewController.poses().fade('out', 'faster')
    viewController.webcam().opacity('stream', 0.4, 1, 'easeInOutExpo')
    const check = idleChecker()
    viewController.webcam().opacity('frame', 0, 1, 'easeInOutExpo').then(() => {
      if (check === false) EngageTick(caller, true)
    })
  })
}

function posesAreFound (similarPoses) {
  viewController.engage().NoPosesFound().hide()
  viewController.webcam().hideStream()
  viewController.webcam().showFrame()
  viewController.engage().show()
  viewController.attract().texts().hide().then(function () {
    viewController.attract().scenes().hide('slower')
    clearInterval(loop)
    similarPoses.forEach((pose, poseNumber) => {
      const video = mediaManager.retrieveMovieScene(pose)
      viewController.sceneText(poseNumber).changeText(pose.meta.movie)
      mediaManager.putVideoIntoWindowWithTime(video, poseNumber, pose.meta.timeInScene).then(() => {
        viewController.scene(poseNumber, pose.meta.movie).crop()
        mediaManager.pause(poseNumber, settings.timings.engage.waitBeforeVideoPlay)
        setTimeout(() => {
          viewController.webcam().opacity('frame', 0.5, settings.timings.engage.fadeOutFrame, 'easeInOutExpo')
          viewController.poses(similarPoses).fade('out', 'slow')
          mediaManager.play(poseNumber, pose.meta.timeInScene, poseNumber)
          viewController.sceneText(poseNumber).setPosition(pose.meta.movie)
          viewController.sceneText(poseNumber).show()
        }, settings.timings.engage.snapshotTiming)
        viewController.scene(poseNumber).show()
      })
    })
  })
}

function idleChecker () {
  noPoseCounter++
  if (noPoseCounter > 3) {
    noPoseCounter = 0
    setAttractMode()
    return true
  } else {
    return false
  }
}

async function startAttractLoop () {
  clearInterval(loop)
  poseController.getPoseFromFrame(webcam).then(posesFound => {
    dbClient.getCombarablePoses(posesFound, 1).then(similarPoses => {
      if (similarPoses !== 0) {
        viewController.poses(posesFound).draw()
        viewController.poses().fade('in', 'fast')
        posesAreFound(similarPoses)
        clearInterval(loop)
        setTimeout(() => {
          setEngageMode()
        }, settings.timings.attract.initialDelay)
      } else {
        setTimeout(() => {
          startAttractLoop()
        }, settings.timings.attract.tryFindPose)
      }
    }).catch(noSimilarPoses => {
      setTimeout(() => {
        startAttractLoop()
      }, settings.timings.attract.tryFindPose)
      console.reject(noSimilarPoses)
    })
  }).catch(noPoses => {
    setTimeout(() => {
      startAttractLoop()
    }, settings.timings.attract.tryFindPose)
    console.reject(noPoses)
  })
}

initApp()
