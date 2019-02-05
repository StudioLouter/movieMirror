import { settings } from './Settings'
const MongoClient = require('mongodb').MongoClient
let db

/**
 * @class DBController - Controls connection with MongoDB, querying & comparing of poses
*/
export class DBController {
  constructor () {
    this.compareFilters = {
      medianPosition: false,
      nose: false,
      leftEye: false,
      rightEye: false,
      leftWrist: false,
      rightWrist: false,
      leftShoulder: false,
      rightShoulder: false
    }
    console.manager('Initializing DbController')
  }

  /**
   * @async
   * @param {boolean} [verbose=false] - logs connection status if true
   * @description Connects to MongoDB using credentials from Settings.
   * @memberof DBController
   */
  async connect (verbose = false) {
    return new Promise(function (resolve, reject) {
      MongoClient.connect(settings.database.host, { useNewUrlParser: true }, function (err, client) {
        if (err != null) {
          if (verbose) console.nope('Error trying to connect to MongoDB: ', err.message)
          reject(err)
          return
        }
        if (verbose) console.zap('MongoDB connected with: ', client.s.url)
        db = client.db(settings.database.name)
        resolve(db)
        if (verbose) db.collection(settings.database.collectionName).stats(function (reject, resolve) { console.log('⚡ MongoDB database set to: ', resolve.ns, ' with ', resolve.count, ' entries') })
      })
    })
  }

  /**
   * @description
   * @param {Object} query - Query formated for MongoDB
   * @param {Number} query.meta.amountOfPoses - Amount of poses to look for
   * @param {Object} query._id - The id filter for MongoDB to start the query from ( so skipping all id's in front of it)
   * @param {Number} query._id.$gt - The id.
   * @param {Object} poses - Poses that were found to sort on nearest with.
   * @returns {Promise} - Returns sorted list of comparable poses
  */
  find (query, poses) {
    let promise = new Promise((resolve, reject) => {
      const collection = db.collection(settings.database.collectionName)
      if (query.amountOfPoses === 0) {
        reject(new Error('no poses in query'))
      } else {
        collection.find(query).limit(500).toArray((err, result) => {
          result.forEach((item, i) => {
            item = this.calculateDelta(poses, item)
          })
          if (err || result == null) {
            reject(err)
          } else if (result.length >= 1) {
            result.sort(this.compare)
            resolve(result)
          } else {
            resolve(0)
          }
          return result
        })
      }
    })
    return promise
  }

  /**
   * Calculate coordinate distance between pose found in webcam and that of database.
   * @param {Object} comparePose - Pose from webcam to compare from
   * @param {Object} pose - Pose from database to compare to.
   * @returns {Object} The pose now with an added difference (delta) added.
   * @memberof DBController
  */
  calculateDelta (comparePose, pose) {
    let delta = 0
    let points = pose.poses[0].keypoints
    Object.entries(points).forEach((entry) => {
      let pos1 = entry[1]
      let pos2 = comparePose.poses[0].keypoints[entry[0]]
      delta += (pos1.position.x - pos2.position.x) + (pos1.position.y - pos2.position.y)
    })
    pose.delta = delta
    return pose
  }

  /**
   * Sort algorithm for MongoDb sorting
   * @param {Number} a - first number to compare from.
   * @param {Number} b  - second number to compare to.
   * @returns {Number} Sorting order (-1 if smaller then, 1 if bigger then)
   */
  static compare (a, b) {
    if (a.delta < b.delta) return -1
    if (a.delta > b.delta) return 1
    return 0
  }

  /**
   * @typedef {Object} filterList
   * @property {Number} [medianPosition] - Pixel distance to look for
   * @property {Number} [nose] - Pixel distance to look for
   * @property {Number} [leftEye] - Pixel distance to look for
   * @property {Number} [rightEye] - Pixel distance to look for
   * @property {Number} [leftShoulder] - Pixel distance to look for
   * @property {Number} [rightShoulder] - Pixel distance to look for
   * @property {Number} [leftWrist] - Pixel distance to look for
   * @property {Number} [rightWrist] - Pixel distance to look for
  */
  /**
   * Construct parameters list with an insecure ratio from where we can construct the query for MongoDB.
   * @param {Number} amountOfPersons - Amount of persons that are found in webcam
   * @param {Number} multiplier - Current multiplier to increase pixel range from
   * @return {filterList} Returns an object that you can feed to MongoDB as a query
  */
  constructParameters (amountOfPersons, multiplier) {
    let filterList = {}
    let paramsForAmount = settings.pose.insecureRatios[amountOfPersons]
    for (const key in paramsForAmount) {
      if (paramsForAmount.hasOwnProperty(key)) {
        const amount = paramsForAmount[key]
        filterList[key] = amount * multiplier
      }
    }
    return filterList
  }

  /**
   * @typedef {Object} query
   * @property {Number} meta.amountOfPoses - Amount of poses to look for
   * @property {Object} query._id - The id filter for MongoDB to start the query from ( so skipping all id's in front of it)
   * @property {Number} query._id.$gt - The id.
   * @property {Array} $and - List of all conditionals
  */
  /**
   * Construct the MongoDB formatted query to filter for comparable poses.
   * @param {Object} poses contains the PoseNet found poses
   * @param {Array} poses.poses The list of all found poses
   * @param {Object} poses.meta Meta information about the found poses
   * @param {Number} poses.meta.amountOfPoses Amount of poses that exist in the current frame
   * @param {String} poses.meta.movie Title of the movie
   * @param {Number} poses.meta.sceneCount The id of the scene inside of the movie
   * @param {Object} params The parts that will make up each conditional in the query.
   * @param {Array} skipThisMovie A list of films that should be filtered
   * @returns {Promise<Query>} blurblur
   */
  queryBuilder (poses, params, skipThisMovie) {
    var query = {} // container to hold queries
    let sections = [] // array where conditionals of the query will reside in
    query['meta.amountOfPoses'] = poses.meta.amountOfPoses // filter on amount of poses

    // SKIP RANDOMLY     (first id + random)
    let skip = 1532533309411 + (Math.floor(Math.random() * 2000000))
    query['_id'] = { $gt: skip }

    // check if the query is not the first, and filter previous found films if it isn't
    if (skipThisMovie != null && skipThisMovie.length === 1) {
      query['meta.movie'] = { $ne: skipThisMovie[0] }
    } else if (skipThisMovie != null && skipThisMovie.length > 1) {
      skipThisMovie.forEach((mov, index) => {
        sections.push({ 'meta.movie': { $ne: mov } })
      })
    }

    // for each part of the pose, construct a conditional
    poses.poses.forEach((pose, poseNumber) => {
      for (const part in params) {
        if (params.hasOwnProperty(part)) {
          // if the query should contain medianPosition, construct its 'special' conditional
          if (part === 'medianPosition') {
            sections.push(this.addQueryMedianConditional(pose, poseNumber, params[part]))
          } else if (this.compareFilters[part] === false) {
            // initially, the insecure multiplier is adhered to.
            let paramIncreasingMultiplier = 1
            // check if a wrist (left or right) is contained inside of the query
            if (this.compareFilters.leftWrist === true || this.compareFilters.rightWrist === true) {
              // if a wrist should be contained in the query, increase the multiplier of the other parts
              if (part !== 'leftWrist' && part !== 'rightWrist') {
                paramIncreasingMultiplier = 4
              }
            }
            // add the conditional to the query.
            sections.push(this.addQueryPartConditional(pose, poseNumber, { 'name': part, 'insecure': params[part] }, paramIncreasingMultiplier))
          }
        }
      }
    })
    query['$and'] = sections
    return query
  }
  /**
   * Construct a conditional specificly for the medianPosition (as its object structure is different then other parts)
   * @param {Object} pose - Pose to get the comparable poses from.
   * @param {Number} poseNumber - The index of the pose in the list
   * @param {Number} insecure - The pixel distance currently allowed for the comparable pose to be inside of.
   * @returns {Object} Returns the conditional
   * @example <caption>Example of an conditional where the medianPosition must fit between (lower then, greater then) of specific x & y positions</caption>
   * {
   *   $and": [
   *     { "poses.1.medianPosition.x": { "$gt":659.87 } },
   *     { "poses.1.medianPosition.x": { "$lt":719.87 } },
   *     { "poses.1.medianPosition.y": { "$gt":434.82 } },
   *     { "poses.1.medianPosition.y": { "$lt":494.82 } }
   *   ]
   * }
  */
  addQueryMedianConditional (pose, poseNumber, insecure) {
    return {
      $and: [
        {
          ['poses.' + poseNumber + '.medianPosition.x']: { $gt: pose.medianPosition.x - insecure }
        },
        {
          ['poses.' + poseNumber + '.medianPosition.x']: { $lt: pose.medianPosition.x + insecure }
        },
        {
          ['poses.' + poseNumber + '.medianPosition.y']: { $gt: pose.medianPosition.y - insecure }
        },
        {
          ['poses.' + poseNumber + '.medianPosition.y']: { $lt: pose.medianPosition.y + insecure }
        }
      ]
    }
  }

  /**
   * Construct a conditional for pose parts.
   * @param {Object} pose - Pose to get the comparable poses from.
   * @param {Number} poseNumber - The index of the pose in the list
   * @param {Number} insecure - The pixel distance currently allowed for the comparable pose to be inside of.
   * @returns {Object} Returns the conditional
   * @example <caption>Example of an conditional where the medianPosition must fit between (lower then, greater then) of specific x & y positions</caption>
   * {
   *   $and": [
   *     { "poses.1.nose.x": { "$gt":659.87 } },
   *     { "poses.1.nose.x": { "$lt":719.87 } },
   *     { "poses.1.nose.y": { "$gt":434.82 } },
   *     { "poses.1.nose.y": { "$lt":494.82 } }
   *   ]
   * }
  */
  addQueryPartConditional (pose, poseNumber, part, paramIncreasingMultiplier) {
    return {
      $and: [
        {
          ['poses.' + poseNumber + '.keypoints.' + part.name + '.position.x']: { $gt: pose.keypoints[part.name].position.x - part.insecure * paramIncreasingMultiplier }
        },
        {
          ['poses.' + poseNumber + '.keypoints.' + part.name + '.position.x']: { $lt: pose.keypoints[part.name].position.x + part.insecure * paramIncreasingMultiplier }
        },
        {
          ['poses.' + poseNumber + '.keypoints.' + part.name + '.position.y']: { $gt: pose.keypoints[part.name].position.y - part.insecure * paramIncreasingMultiplier }
        },
        {
          ['poses.' + poseNumber + '.keypoints.' + part.name + '.position.y']: { $lt: pose.keypoints[part.name].position.y + part.insecure * paramIncreasingMultiplier }
        }
      ]
    }
  }

  /**
   * Sets DBControllers compareFilters, indicating which pose parts should be compared with the query. In this case, it looks for hands being far away from the pose's hips. If thats the case, the wrists will be used inside the compare query, otherwise it won't.  It will also set other parts to off, to ensure more poses match the wrists instead of other less 'meiningful' pose parts.
   * @param {Object} poses - Poses that are being scanned of 'expressive' hands
  */
  setCompareFilters (poses) {
    if (Math.hypot(poses.poses[0].keypoints.leftWrist.position.x - poses.poses[0].keypoints.leftHip.position.x, poses.poses[0].keypoints.leftWrist.position.y - poses.poses[0].keypoints.leftHip.position.y) < 100) {
      this.compareFilters.leftWrist = true
    } else {
      this.compareFilters.leftWrist = false
    }
    if (Math.hypot(poses.poses[0].keypoints.rightWrist.position.x - poses.poses[0].keypoints.rightHip.position.x, poses.poses[0].keypoints.rightWrist.position.y - poses.poses[0].keypoints.rightHip.position.y) < 100) {
      this.compareFilters.rightWrist = true
    } else {
      this.compareFilters.rightWrist = false
    }
    if (this.compareFilters.rightWrist === true && this.compareFilters.leftWrist === true) {
      this.compareFilters.leftEye = false
      this.compareFilters.rightEye = false
    } else {
      this.compareFilters.leftEye = true
      this.compareFilters.rightEye = true
    }
  }

  /**
   * This queries the database, trying to find comparable poses matching the currently found pose from the webcam stream.
   * @param {Object} poses
   * @param {Number} queryMultiplier
   * @param {Array} skipThisMovie
   */
  getCombarablePoses (poses, queryMultiplier, skipThisMovie = null) {
    if (poses.poses.length === 1) this.setCompareFilters(poses)
    let query = this.queryBuilder(poses, this.constructParameters(poses.poses.length, queryMultiplier), skipThisMovie)
    return new Promise((resolve, reject) => {
      let results = []
      dbClient.find(query, poses).then((result1) => {
        if (result1 === 0) reject(new Error('noComparablePoses'))
        results.push(result1[0])
        if (result1[0] == null) {
          if (queryMultiplier === 1) {
            reject(new Error('no results with multiplier 1'))
          }
          resolve(results)
          return
        }
        let query = this.queryBuilder(poses, this.constructParameters(poses.poses.length, queryMultiplier), [result1[0].meta.movie])
        dbClient.find(query, poses).then((result2) => {
          if (result2 === 0) resolve(0)
          results.push(result2[0])
          if (result2[0] == null) {
            resolve(results)
            return
          }
          let query = this.queryBuilder(poses, this.constructParameters(poses.poses.length, queryMultiplier), [result1[0].meta.movie, result2[0].meta.movie])
          dbClient.find(query, poses).then((result3) => {
            if (result3 === 0) resolve(0)
            results.push(result3[0])
            resolve(results)
          })
        })
      }, function (err) {
        console.error(err)
        reject(err)
      })
    })
  }
}
export let dbClient = new DBController()
