var gameVars = require('./gameVars')
var easystarjs = require('easystarjs')

var TILESIZE = 32

var tileSelectionSprite
var tileTargetSprite

// squad
var squad = [
  {
    name: 'Agent Anderson',
    start: {
      x: 2,
      y: 2,
    },
    speed: 5,
    path: [],
  },
]

// enemies
var enemies = [
  {
    start: {
      x: 30,
      y: 20,
    },
    speed: 4,
    path: [],
  }
]

var WALKABLE = 0
var WALL = 1

var pathfinder
var map = [ // NOTE: use single characters in map because easier
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
[1, , , , , ,1, , , , , , , , , , , , , , , , , , , , , , , , ,1,],
[1, , , , , ,1, , , , , , , , , , , , , , , , , , , , , , , , ,1,],
[1, , , , , ,1, , ,1,1,1,1,1, , ,1,1,1, , ,1,1, , ,1,1,1, , ,1,1,],
[1, , , , , ,1, , ,1, , , , , , , , ,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1, , , , , , , , ,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1, , , , , , , , ,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1,1,1,1,1,1, , , ,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1, , , , , , , , ,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1, , , , , , , , ,1, , ,1,1,1,1,1,1,1,1,1,1,1,],
[1, , , , , ,1, , ,1, , , , ,1,1,1,1,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1, , , , ,1, , , ,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1, , , , ,1, , , ,1, , ,1, , , , ,1, , , , ,1,],
[1, , , , , ,1, , ,1,1,1,1,1,1, , ,1,1, , ,1, , ,1,1,1,1, , ,1,1,],
[1, , , , , ,1, , , , , , , , , , , ,1, , , , , , , , , , , , ,1,],
[1, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,1,],
[1, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,1,],
[1, , , , , ,1, , , , , , , , , , , ,1, , , , , , , , , , , , ,1,],
[1,1,1,1,1,1,1, , ,1,1,1,1,1,1,1,1,1,1,1,1,1, , ,1,1,1,1, , ,1,1,],
[1, , , , ,1, , , , ,1, , , ,1, , , ,1, , , , , , ,1, , , , , ,1,],
[1, , , , , , , , , , , , , , , , , ,1, , , , , , ,1, , , , , ,1,],
[1, , , , , , , , , , , , , , , , , ,1, , , , , , ,1, , , , , ,1,],
[1, , , , ,1,1,1,1,1,1, , , ,1, , , ,1, , , , , , ,1, , , , , ,1,],
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,],
]

var gameScene = {
  name: 'gameScene',
  create: function (sceneParams) {

    // create layers
    this.container = new PIXI.Container()
    this.tileContainer = new PIXI.Container()
    this.pathingContainer = new PIXI.Container()
    this.selectionContainer = new PIXI.Container()
    this.enemyContainer = new PIXI.Container()
    this.squadContainer = new PIXI.Container()

    this.container.addChild(this.tileContainer)
    this.container.addChild(this.pathingContainer)
    this.container.addChild(this.selectionContainer)
    this.container.addChild(this.enemyContainer)
    this.container.addChild(this.squadContainer)

    global.baseStage.addChild(this.container)

    // create map tile sprites
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {

        // pick texture
        let texture
        switch (map[y][x]) {
          case undefined:
          map[y][x] = WALKABLE // NOTE: used spaces in map so it is easier to see
          texture = PIXI.loader.resources['square'].texture
          break
          case 1:
          texture = PIXI.loader.resources['square_impassable'].texture
          break
        }

        // create sprite
        let tile = new PIXI.Sprite(texture)

        // position sprite
        tile.x = x * TILESIZE
        tile.y = y * TILESIZE

        // add to layer
        this.tileContainer.addChild(tile)
      }
    }

    // create tile selection sprite
    tileSelectionSprite = new PIXI.Sprite(PIXI.loader.resources['square_selected'].texture)
    this.selectionContainer.addChild(tileSelectionSprite)

    // create tile target sprite
    tileTargetSprite = new PIXI.Sprite(PIXI.loader.resources['target'].texture)
    this.selectionContainer.addChild(tileTargetSprite)

    // create squad sprites
    for (let i = 0; i < squad.length; i++) {
      let squadMember = squad[i]

      // create sprite
      let sprite = new PIXI.Sprite(PIXI.loader.resources['gubbe001'].texture)

      // position sprite at starting position
      sprite.x = squadMember.start.x * TILESIZE
      sprite.y = squadMember.start.y * TILESIZE

      // add to layer
      this.squadContainer.addChild(sprite)

      // save sprite
      squadMember.sprite = sprite
    }

    // create enemy sprites
    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i]

      // create sprite
      let sprite = new PIXI.Sprite(PIXI.loader.resources['enemy001'].texture)

      // position sprite at starting position
      sprite.x = enemy.start.x * TILESIZE
      sprite.y = enemy.start.y * TILESIZE

      // add to layer
      this.enemyContainer.addChild(sprite)

      // save sprite
      enemy.sprite = sprite
    }

    // init interaction
    this.tileContainer.interactive = true
    this.tileContainer.on('mousemove', function (event) {

      // calc map position
      let localPoint = event.data.getLocalPosition(this)
      let mapX = Math.floor(localPoint.x / TILESIZE)
      let mapY = Math.floor(localPoint.y / TILESIZE)

      // move selection sprite
      tileSelectionSprite.x = mapX * TILESIZE
      tileSelectionSprite.y = mapY * TILESIZE
    }.bind(this.tileContainer))
    this.tileContainer.on('click', function (event) {

      // calc target position
      let localPoint = event.data.getLocalPosition(this)
      let targetX = Math.floor(localPoint.x / TILESIZE)
      let targetY = Math.floor(localPoint.y / TILESIZE)

      // calc current position
      let currentX = Math.floor(squad[0].sprite.x / TILESIZE)
      let currentY = Math.floor(squad[0].sprite.y / TILESIZE)

      pathfinder.findPath(
        currentX,
        currentY,
        targetX,
        targetY,
        function (path) {
          if (path) {
            tileTargetSprite.x = targetX * TILESIZE
            tileTargetSprite.y = targetY * TILESIZE

            squad[0].path = path
          }
        })
    })

    // init path-finding
    pathfinder = new easystarjs.js()
    pathfinder.setGrid(map)
    pathfinder.setAcceptableTiles([0])
    pathfinder.enableDiagonals()

  },
  destroy: function () {
    this.container.destroy()
  },
  update: function (dt) {
    // run pathfinding
    pathfinder.calculate()

    // move squad
    var squadMember = squad[0]
    if (squadMember.path.length > 0) {
      let nextTarget = squadMember.path[0]
      let dx = nextTarget.x * TILESIZE - squadMember.sprite.x
      let dy = nextTarget.y * TILESIZE - squadMember.sprite.y
      let h = Math.sqrt(dx * dx + dy * dy)
      if (h < squadMember.speed + 1) {
        squadMember.path.shift()
      } else {
        let angle = Math.atan2(dy, dx)
        squadMember.sprite.x += Math.cos(angle) * squadMember.speed
        squadMember.sprite.y += Math.sin(angle) * squadMember.speed
      }
    }

    // enemy
    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i]

      // keep look out for intruders
      if (!enemy.target) {

        for (let j = 0; j < squad.length; j++) {
          let squadMember = squad[j]

          let dx = squadMember.sprite.x - enemy.sprite.x
          let dy = squadMember.sprite.y - enemy.sprite.y
          let h = Math.sqrt(dx * dx + dy * dy)

          // found one, inside a 90 pixel radius
          if (h < 200) {
            enemy.target = squadMember

            let currentX = Math.floor(enemy.sprite.x / TILESIZE)
            let currentY = Math.floor(enemy.sprite.y / TILESIZE)

            let targetX = Math.floor(squadMember.sprite.x / TILESIZE)
            let targetY = Math.floor(squadMember.sprite.y / TILESIZE)

            pathfinder.findPath(
              currentX,
              currentY,
              targetX,
              targetY,
              function (path) {
                if (path) {
                  this.path = path

                // no path, ignore
                } else {
                  this.target = null
                }
              }.bind(enemy))
          }
        }

      // move enemy towards squad member
      } else if (enemy.path.length > 0) {
        let nextTarget = enemy.path[0]
        let dx = nextTarget.x * TILESIZE - enemy.sprite.x
        let dy = nextTarget.y * TILESIZE - enemy.sprite.y
        let h = Math.sqrt(dx * dx + dy * dy)
        if (h < enemy.speed + 1) {
          enemy.path.shift()
          enemy.target = null
        } else {
          let angle = Math.atan2(dy, dx)
          enemy.sprite.x += Math.cos(angle) * enemy.speed
          enemy.sprite.y += Math.sin(angle) * enemy.speed
        }
      }
    }

  },
  draw: function () {
    global.renderer.render(this.container)
  },
}

module.exports = gameScene
