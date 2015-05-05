$(document).ready(function() {
	var canvas = $("#gameCanvas");
	var context = canvas.get(0).getContext("2d");

	// Canvas dimensions
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	// Game settings
	var playGame;

	// DOM Elements
	var ui = $("#gameUI");
	var uiIntro = $("#gameIntro");
	var uiStats = $("#gameStats");
	var uiComplete = $("#gameComplete");
	var uiPlay = $("#gamePlay");
	var uiReset = $(".gameReset");
	var uiRemaining = $("#gameRemaining");
	var uiScore = $(".gameScore");	

	// Game Variables
	var platformX;
	var platformY;
	var platformOuterRadius;
	var platformInnerRadius;
	var asteroids;

	// player
	var player;
	var playerOriginalX;
	var playerOriginalY;
	var playerSelected;
	var playerMaxAbsVelocity;
	var playerVelocityDampener;
	var powerX;
	var powerY;
	var power;
	var playerAngle;
	var score;

	// resets player position and velocities
	function resetPlayer() 
	{
		player.x = playerOriginalX;
		player.y = playerOriginalY;
		player.vX = 0;
		player.vY = 0;
	};

	// Reset and start the game
	function startGame() 
	{
		// Set up initial game settings
		playGame = false;
		uiScore.html("0");
		uiStats.show();

		// platform variables
		platformX = canvasWidth / 2;
		platformY = 150;
		platformOuterRadius = 100;
		platformInnerRadius = 75;

		// asteroid object
		var Asteroid = function(x, y, radius, mass, friction)
		{
			this.x = x;
			this.y = y;
			this.radius = radius;
			this.mass = mass;
			this.friction = friction;
			this.vX = 0;
			this.vY = 0;
			this.player = false;
		};

		asteroids = new Array();

		// player variables
		playerSelected = false;
		playerMaxAbsVelocity = 30;
		playerVelocityDampener = 0.3;
		powerX = -1;
		powerY = -1;
		power = 0;
		playerAngle = 0;
		score = 0;

		var pRadius = 15;
		var pMass = 10;
		var pFriction = 0.97;

		// creates the player object as the first asteroid
		playerOriginalX = canvasWidth/2;
		playerOriginalY = canvasHeight-150;
		player = new Asteroid(playerOriginalX, playerOriginalY, pRadius, pMass, pFriction);
		player.player = true;
		asteroids.push(player);

		var outerRing = 8; // Asteroids around outer ring
		var ringCount = 3; // number of rings
		var ringSpacing = (platformInnerRadius/(ringCount - 1)); // distance between each ring

		// ring positioning and asteroid creation
		for(var r = 0; r < ringCount; r++)
		{
			var currentRing = 0; // asteroids around current ring
			var angle = 0; // angle between each asteroid
			var ringRadius = 0;

			// is this the innermost ring
			if (r == ringCount - 1)
			{
				currentRing = 1;
			}
			else
			{
				currentRing = outerRing-(r * 3);
				angle = 360 / currentRing;
				ringRadius = platformInnerRadius - (ringSpacing * r);
			};
			// asteroid creation
			for (var a = 0; a < currentRing; a++)
			{
				var x = 0;
				var y = 0;

				// is this the innermost ring
				if (r == ringCount - 1)
				{
					x = platformX;
					y = platformY;
				}
				else
				{
					x = platformX + (ringRadius * Math.cos((angle * a) * (Math.PI / 180)));
					y = platformY + (ringRadius * Math.sin((angle * a) * (Math.PI / 180)));
				};

				var radius  = 10;
				var mass = 5;
				var friction = 0.95;

				asteroids.push(new Asteroid(x, y, radius, mass, friction));
			};

			// score count
			uiRemaining.html(asteroids.length - 1);
		};
		// on mouseDown, start the game
		$(window).mousedown(function(e) 
		{
			if (!playerSelected && player.x == playerOriginalX && player.y == playerOriginalY) 
			{
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);
				if (!playGame) 
				{
					playGame = true;
					animate();
				};
				var dX = player.x-canvasX;
				var dY = player.y-canvasY;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				var padding = 5;
				if (distance < player.radius+padding) 
				{
					powerX = player.x;
					powerY = player.y;
					playerSelected = true;
				};
			};
		});
		// on mouseMove, calculate angle and power of the shot
		$(window).mousemove(function(e) 
		{
			if (playerSelected) 
			{
				var canvasOffset = canvas.offset();
				var canvasX = Math.floor(e.pageX-canvasOffset.left);
				var canvasY = Math.floor(e.pageY-canvasOffset.top);
				var dX = canvasX-player.x;
				var dY = canvasY-player.y;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				if (distance*playerVelocityDampener < playerMaxAbsVelocity) 
				{
					powerX = canvasX;
					powerY = canvasY;
					power = Math.round(distance);
				} 
				else 
				{
					var ratio = playerMaxAbsVelocity/(distance*playerVelocityDampener);
					powerX = player.x+(dX*ratio);
					powerY = player.y+(dY*ratio);
					power = 100;
				};

				playerAngle = Math.round(Math.atan2(canvasX - playerOriginalX, canvasY - playerOriginalY) * 180 / Math.PI);
			};
		});
		// on mouseUp, fire player asteroid
		$(window).mouseup(function(e) 
		{
			if (playerSelected) 
			{
				var dX = powerX-player.x;
				var dY = powerY-player.y;
				player.vX = -(dX*playerVelocityDampener);
				player.vY = -(dY*playerVelocityDampener);
				uiScore.html(++score);
			};
			playerSelected = false;
			powerX = -1;
			powerY = -1;
		});

		// Start the animation loop
		animate();
	};

	// Initialize the game environment
	function init() 
	{
		uiStats.hide();
		uiComplete.hide();

		uiPlay.click(function(e) 
		{
			e.preventDefault();
			uiIntro.hide();
			startGame();
		});
		
		uiReset.click(function(e) 
		{
			e.preventDefault();
			uiComplete.hide();
			startGame();
		});
	};

	// Animation loop that does all the fun stuff
	function animate() 
	{
		// Clear
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		// DRAW

		// platform
		context.fillStyle = "rgb(100, 100, 100)";
		context.beginPath();
		context.arc(platformX, platformY, platformOuterRadius, 0, Math.PI*2, true);
		context.closePath();
		context.fill();

		// aiming line
		if (playerSelected) 
		{
			context.strokeStyle = "rgb(255, 255, 255)";
			context.lineWidth = 3;
			context.beginPath();
			context.moveTo(player.x, player.y);
			context.lineTo(powerX, powerY);
			context.closePath();
			context.stroke();

			context.fillStyle = "rgb(255, 255, 255)";
			context.font = 'normal 20pt Lobster'
			context.fillText("power: " + power, 10, 560);
			if (playerAngle <= 90 && playerAngle >= -90)
			{
				context.fillText("angle: " + playerAngle + "°", 10, 580);				
			};

		};
		// boundary check
		if (player.x != playerOriginalX && player.y != playerOriginalY) 
		{
			if (player.vX == 0 && player.vY == 0) 
			{
				resetPlayer();
			} 
			else if (player.x+player.radius < 0) 
			{
				resetPlayer();
			} 
			else if (player.x-player.radius > canvasWidth) 
			{
				resetPlayer();
			} 
			else if (player.y+player.radius < 0) 
			{
				resetPlayer();
			} 
			else if (player.y-player.radius > canvasHeight) 
			{
				resetPlayer();
			};
		};	

		// asteroids
		context.fillStyle = "rgb(255, 255, 255)";

		var deadAsteroids = new Array();

		var asteroidsLength = asteroids.length;

		for (var i = 0; i < asteroidsLength; i++) 
		{
			var tmpAsteroid = asteroids[i];

			for (var j = i+1; j < asteroidsLength; j++) 
			{
				var tmpAsteroidB = asteroids[j];

				var dX = tmpAsteroidB.x - tmpAsteroid.x;
				var dY = tmpAsteroidB.y - tmpAsteroid.y;
				var distance = Math.sqrt((dX*dX)+(dY*dY));
				if (distance < tmpAsteroid.radius + tmpAsteroidB.radius) 
				{
					var angle = Math.atan2(dY, dX);
					var sine = Math.sin(angle);
					var cosine = Math.cos(angle);
					// Rotate asteroid position
					var x = 0;
					var y = 0;
					// Rotate asteroidB position
					var xB = dX * cosine + dY * sine;
					var yB = dY * cosine - dX * sine;
					// Rotate asteroid velocity
					var vX = tmpAsteroid.vX * cosine + tmpAsteroid.vY * sine;
					var vY = tmpAsteroid.vY * cosine - tmpAsteroid.vX * sine;
					// Rotate asteroidB velocity
					var vXb = tmpAsteroidB.vX * cosine + tmpAsteroidB.vY * sine;
					var vYb = tmpAsteroidB.vY * cosine - tmpAsteroidB.vX * sine;
					// Conserve momentum
					var vTotal = vX - vXb;
					vX = ((tmpAsteroid.mass - tmpAsteroidB.mass) * vX + 2 * tmpAsteroidB.mass *
					vXb) / (tmpAsteroid.mass + tmpAsteroidB.mass);
					vXb = vTotal + vX;
					// Move asteroids apart
					xB = x + (tmpAsteroid.radius + tmpAsteroidB.radius);
					// Rotate asteroid positions back
					tmpAsteroid.x = tmpAsteroid.x + (x * cosine - y * sine);
					tmpAsteroid.y = tmpAsteroid.y + (y * cosine + x * sine);
					tmpAsteroidB.x = tmpAsteroid.x + (xB * cosine - yB * sine);
					tmpAsteroidB.y = tmpAsteroid.y + (yB * cosine + xB * sine);
					// Rotate asteroid velocities back
					tmpAsteroid.vX = vX * cosine - vY * sine;
					tmpAsteroid.vY = vY * cosine + vX * sine;
					tmpAsteroidB.vX = vXb * cosine - vYb * sine;
					tmpAsteroidB.vY = vYb * cosine + vXb * sine;
				};
			};

			// Calculate new position
			tmpAsteroid.x += tmpAsteroid.vX;
			tmpAsteroid.y += tmpAsteroid.vY;

			// Friction
			if (Math.abs(tmpAsteroid.vX) > 0.1) 
			{
				tmpAsteroid.vX *= tmpAsteroid.friction;
			} 
			else 
			{
				tmpAsteroid.vX = 0;
			};
			if (Math.abs(tmpAsteroid.vY) > 0.1) 
			{
				tmpAsteroid.vY *= tmpAsteroid.friction;
			} 
			else 
			{
				tmpAsteroid.vY = 0;
			};

			// check if asteroid is off the platform
			if (!tmpAsteroid.player) 
			{
				var dXp = tmpAsteroid.x - platformX;
				var dYp = tmpAsteroid.y - platformY;
				var distanceP = Math.sqrt((dXp*dXp)+(dYp*dYp));
				if (distanceP > platformOuterRadius) 
				{
					if (tmpAsteroid.radius > 0) 
					{
						tmpAsteroid.radius -= 2;
					} 
					else 
					{
						deadAsteroids.push(tmpAsteroid);
					};
				};
			};

			context.beginPath();
			context.arc(tmpAsteroid.x, tmpAsteroid.y, tmpAsteroid.radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		};		

		// splice dead asteroids
		var deadAsteroidsLength = deadAsteroids.length;
		if (deadAsteroidsLength > 0) 
		{
			for (var di = 0; di < deadAsteroidsLength; di++) 
			{
				var tmpDeadAsteroid = deadAsteroids[di];
				asteroids.splice(asteroids.indexOf(tmpDeadAsteroid), 1);
			};
		};

		var remaining = asteroids.length-1; // Remove player from asteroid count
		uiRemaining.html(remaining);
		if (remaining == 0) 
		{
			// Winner!
			playGame = false;
			uiStats.hide();
			uiComplete.show();
			$(window).unbind("mousedown");
			$(window).unbind("mousemove");
			$(window).unbind("mouseup");
		};

		if (playGame) 
		{
			// Run the animation loop again in 33 milliseconds
			setTimeout(animate, 33);
		};
	};

init();

});