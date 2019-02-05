import { settings } from './Settings'
import { utils } from './utils'
import { dbClient } from './dbController'

class Debug {
  constructor () {
    this.timings = {}
    console.manager('Initializing Debug')
  }

  startSection (section) {
    if (settings.debug.logTimings === false) return
    var el = document.getElementById(section)
    if (el == null) {
      el = this.createDiv(section)
      this.createTimeDiv(section)
      if (this.timings[section] == null) this.timings[section] = new Date().getTime()
    }
    // for (var i = 0 i < document.getElementById('sectionContainer').children.length i++) {
    //   document.getElementById('sectionContainer').children[i].style = 'opacity: 0.25'
    // }
    el.style = 'opacity: 1'
    this.setStart(section)
  }

  createDiv (name) {
    var div = document.createElement('div')
    div.setAttribute('id', name)
    div.setAttribute('class', 'section')
    div.innerText = name
    document.getElementById('sectionContainer').append(div)
    return div
  }

  createTimeDiv (name) {
    var div = document.createElement('div')
    div.setAttribute('class', 'sectionTiming')
    div.setAttribute('id', 'timing' + name)
    div.innerText = 'timing'
    document.getElementById(name).append(div)
    return div
  }

  setStart (name) {
    this.timings[name] = new Date().getTime()
  }

  endSection (name) {
    this.setTiming(name)
    if (document.getElementById(name) != null) document.getElementById(name).style = 'opacity: 0.25'
  }

  setTiming (name) {
    const thisTime = new Date().getTime()
    if (document.getElementById('timing' + name) != null) {
      document.getElementById('timing' + name).innerText = (thisTime - this.timings[name]) + 'ms'
    }
  }

  drawPoses (poses, mapVars = { x: 760, y: 545 }, fromWebcam = true, scene = 'webcam') {
    if (fromWebcam === true) {
      document.getElementById('dots_container').innerHTML = ''
      document.getElementById('dots_container_scenes').innerHTML = ''
    }
    const colors = ['#f00', '#0f0', '#00f', '#f0f', '#f0c', '#ccF', '#000', '#fff', '#ccf', '#ccc']
    if (poses.poses.length > 0) {
      poses.poses.forEach((pose, index) => {
        if (poses.poses.length <= 1) {
          this.drawPart(pose.keypoints.nose, 0, 'nose', colors[index], mapVars, fromWebcam, scene)
          this.drawPart(pose.keypoints.leftEye, 0, 'leftEye', colors[index], mapVars, fromWebcam, scene)
          this.drawPart(pose.keypoints.rightEye, 0, 'rightEye', colors[index], mapVars, fromWebcam, scene)
          this.drawPart(pose.keypoints.rightWrist, 0, 'rightWrist', colors[index], mapVars, fromWebcam, scene)
          this.drawPart(pose.keypoints.leftWrist, 0, 'leftWrist', colors[index], mapVars, fromWebcam, scene)
          this.drawPart(pose.keypoints.leftHip, 0, 'leftHip', colors[index], mapVars, fromWebcam, scene)
          this.drawPart(pose.keypoints.rightHip, 0, 'rightHip', colors[index], mapVars, fromWebcam, scene)
        }
      })
    }
  }

  drawPart (part, index, name, color, mapVars, fromWebcam, sceneNumber) {
    if (dbClient.compareFilters[name] === false) {
      var div = document.createElement('div')
      div.setAttribute('class', 'dot')
      if (part.score > 0.1 && index === 0) {
        let position = part.position
        let offset = { x: 0, y: 0 }
        if (fromWebcam === false) {
          offset.x = document.getElementById('sceneOutput' + sceneNumber).getBoundingClientRect().left
          offset.y = document.getElementById('sceneOutput' + sceneNumber).getBoundingClientRect().top
        }
        div.style = `top: ${utils.map(position.y, 0, 545, 0, mapVars.y) + offset.y}px left: ${utils.map(position.x, 0, 760, 0, mapVars.x) + offset.x}pxbackground-color:${color}`
        div.innerText = name
      } else {
        document.getElementById(part.part)
        div.style = `top: -200px left: 0px`
      }
      if (fromWebcam) {
        document.getElementById('dots_container').appendChild(div)
      } else {
        document.getElementById('dots_container_scenes').appendChild(div)
      }
    }
  }

  drawMedianPosition (medianPosition, mapVars, fromWebcam, sceneNumber) {
    var medianDiv = document.createElement('div')
    medianDiv.setAttribute('class', 'medianDot')
    let offset = { x: 0, y: 0 }
    if (fromWebcam === false) {
      offset.x = document.getElementById('sceneOutput' + sceneNumber).getBoundingClientRect().left
      offset.y = document.getElementById('sceneOutput' + sceneNumber).getBoundingClientRect().top
    }
    medianDiv.style = `top: ${utils.map(medianPosition.y, 0, 545, 0, mapVars.y) + offset.y}px left: ${utils.map(medianPosition.x, 0, 760, 0, mapVars.x) + offset.x}px`
    if (fromWebcam) {
      document.getElementById('dots_container').appendChild(medianDiv)
    } else {
      document.getElementById('dots_container_scenes').appendChild(medianDiv)
    }
    // document.getElementById('dots_container').appendChild(medianDiv)
  }

  logQuery (query) {
    if (settings.debug.logQuery) console.log(JSON.stringify(query))
  }

  screenLogger (id, value, pos) {
    if (settings.debug.screenLogger) {
      let div = document.getElementById(id)
      div.style = `top: ${pos.y}px left: ${pos.x}px`
      div.innerText = id + ': ' + value
    }
  }

  showScenePoses (pose, sceneNumber) {
    if (settings.debug.showScenePoses) {
      let sceneOutput = document.getElementById('sceneOutput' + sceneNumber)
      const windowSize = {
        x: sceneOutput.offsetWidth,
        y: sceneOutput.offsetHeight
      }
      this.drawPoses(pose, windowSize, false, sceneNumber)
    }
  }

  showScenePlaying (sceneLoaded, sceneNumber) {
    if (settings.debug.showSceneTitle) {
      if (sceneNumber === 0)document.getElementById('sceneTitleContainer').innerHTML = ''
      const windowSize = {
        x: document.getElementById('sceneOutput' + sceneNumber).getBoundingClientRect().left,
        y: document.getElementById('sceneOutput' + sceneNumber).getBoundingClientRect().top
      }
      let div = document.createElement('div')
      div.setAttribute('class', 'sceneTitle')
      div.style = `top: ${windowSize.y + 10}px left: ${windowSize.x + 10}px`
      div.innerText = sceneLoaded
      document.getElementById('sceneTitleContainer').append(div)
    }
  }
}

export let debug = new Debug()
