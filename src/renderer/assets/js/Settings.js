class Settings {
  constructor () {
    this.database = {
      name: 'zzw',
      host: 'mongodb://localhost:27017',
      collectionName: 'houdingen'
    }
    this.debug = {
      verbose: true,
      logQuery: false,
      logTimings: false,
      screenLogger: false,
      showScenePoses: false,
      showSceneTitle: false
    }
    this.media = {
      videoWidth: 960,
      videoHeight: 540
    }
    this.pose = {
      imageScaleFactor: 0.4,
      outputStride: 16,
      minPartConfidence: 0.4,
      insecureRatios: {
        '1': {
          nose: 25,
          leftEye: 15,
          rightEye: 15,
          leftWrist: 50,
          rightWrist: 50,
          leftShoulder: 50,
          rightShoulder: 50
        },
        '2': {
          medianPosition: 30,
          nose: 20
        },
        '3': {
          medianPosition: 30
        },
        '4': {
          medianPosition: 30
        },
        '5': {
          medianPosition: 30
        }
      }
    }
    this.timings = {
      engage: {
        checkIfPoses: 3000,
        waitBeforeCheckingAgain: 6000,
        fadeInText: 1500,
        snapshotTiming: 2000,
        fadeOutFrame: 2500,
        completeLoop: 6000,
        waitBeforeVideoPlay: 2000
      },
      attract: {
        initialDelay: 3000,
        tryFindPose: 800
      }
    }
    console.log('👷 Settings are loaded')
  }
}

export let settings = new Settings()
