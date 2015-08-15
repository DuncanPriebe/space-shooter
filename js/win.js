var winState = {
	create: function() {		
		game.add.text(80, 80, 'YOU WIN', {font: '40px Courier', fill: '#70ba70', fontStyle: 'italic', fontWeight: 'bold'});		
		game.add.text(80, 150, 'press enter to restart', {font: '20px Courier', fill: '#7070ba', fontWeight: 'bold'});

		var enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        enterKey.onDown.addOnce(this.restart, this);
	},

	restart: function() {
		game.state.start('menu');
	}
};