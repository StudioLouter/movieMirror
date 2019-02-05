import * as posenet from '@tensorflow-models/posenet'
import { settings } from './Settings'
import { mediaManager } from './mediaManager'
import { dbClient } from './dbController'

export let sceneCounter = 1

let net
/**
 *
 * @class PoseController - Finds poses by utilizing PoseNet and controls found poses, comparisons etc.
 */
class PoseController {
  constructor () {
    console.manager('Initializing PoseController')
  }
  /**
   * @async
   * @description Load posenet model
   * @memberof PoseController
  */
  async loadModel () {
    net = await posenet.load()
  }
  /**
   * @async
   * @description Connect to MongoDB
   * @memberof PoseController
  */
  async connectToDb () {
    await dbClient.connect(true)
  }
  /**
   * @description Increments sceneCounter
   * @memberof PoseController
  */
  incrSceneCounter () {
    sceneCounter++
  }
  /**
   *
   * @description Uses PoseNet to analyse a video for poses
   * @param {HTMLElement} video The video HTMLelement to analyse
   * @returns {Object} Return an collection (if applicable) of poses that were found
   * @memberof PoseController
  */
  getPoseFromFrame (video) {
    return new Promise(async (resolve, reject) => {
      const poses = await net.estimateMultiplePoses(video, settings.pose.imageScaleFactor, true, settings.pose.outputStride, 5, settings.pose.minPartConfidence, 0.5)
      let currentPoses = []
      poses.forEach((pose, index) => {
        pose.medianPosition = this.getMedianPosition(pose)
        let poseIsUniquePerson = true
        if (currentPoses.length !== 0) {
          currentPoses.forEach(function (currentPose) {
            if (Math.hypot(currentPose.medianPosition.x - pose.medianPosition.x, currentPose.medianPosition.y - pose.medianPosition.y) < 30) {
              poseIsUniquePerson = false
            }
          })
          if (poseIsUniquePerson === true) currentPoses.push(pose)
        } else {
          currentPoses.push(pose)
        }
      })
      if (currentPoses.length === 0) {
        reject(new Error('no poses found in frame'))
      } else {
        resolve(this.createExporetableData(currentPoses))
      }
    })
  }

  end () {
  }

  /**
   * @typedef {Object} Coordinates
   * @description Simple object holding an x and y value
   * @property {Number} x - The x coordinate of the median position
   * @property {Number} y - The y coordinate of the median position
  */
  /**
   *
   * @description Calculates a median of all induvidual points found in a point for more performant queries later on.
   * @param {Object} keypoints Collection on points
   * @returns {Coordinates} Coordinates of the median position
   * @memberof PoseController
  */
  getMedianPosition (keypoints) {
    var totalX = 0
    var totalY = 0
    keypoints.keypoints.forEach(function (part) {
      totalX = totalX + part.position.x
      totalY += part.position.y
    })
    totalX /= keypoints.keypoints.length
    totalY /= keypoints.keypoints.length
    return {
      x: totalX,
      y: totalY
    }
  };
  /**
   * @description Formats the raw poses data returned from PoseNet to a useable format
   * @param {Object} poses The raw poses returned from PoseNet
   * @returns {Object} Return formatted Object conforming to usable standards
   * @memberof PoseController
  */
  createExporetableData (poses) {
    poses.forEach((pose, index) => {
      poses[index] = this.replaceKeyPointsWithObjects(pose)
    })
    let dataToSave = { poses: poses }
    dataToSave.meta = {}
    dataToSave.meta.amountOfPoses = poses.length
    dataToSave.meta.sceneCount = mediaManager.currentScene
    dataToSave.meta.movie = mediaManager.currentMovie
    return dataToSave
  }
  /**
   * @description Converts arrays inside poses into a objects
   * @param {Object} pose Raw pose data from PoseNet
   * @returns {Object} Return the pose keypoint as an object
   * @memberof PoseController
  */
  replaceKeyPointsWithObjects (pose) {
    let kvp = {}
    pose.keypoints.forEach(function (part, index) {
      kvp[part.part] = part
      delete kvp[part.part].part
    })
    delete pose.keypoints
    pose.keypoints = kvp
    return pose
  }
}

export let poseController = new PoseController()
