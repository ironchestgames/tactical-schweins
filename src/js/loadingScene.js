var gameVars = require('./gameVars')

var loadingScene = {
  name: 'loadingScene',
  create: function (sceneParams) {

    // fetch assets
    PIXI.loader

    .add('gubbe001', 'assets/images/gubbe001.png')
    .add('square', 'assets/images/square.png')
    .add('square_impassable', 'assets/images/square_impassable.png')
    .add('square_selected', 'assets/images/square_selected.png')
    .add('target', 'assets/images/target.png')
    
    .load(function () {
      this.changeScene(localStorage.scene || 'gameScene', sceneParams)
    }.bind(this))
  },
  destroy: function () {

  },
  update: function () {

  },
  draw: function () {

  },
}

module.exports = loadingScene
