/**
 * visualizes objects in the scene.
 * reinitializes the scene if the mode changes
 */

'use strict';

// Declare required variables
var container;
var scene, sceneDiodes, renderer, stateController;
var degToRad = Math.PI / 180;
var radToDeg = 180.0 / Math.PI;


//create scene
init();

//render
animate();


function init() {

	container = document.getElementById( 'container' );
	document.body.appendChild( container );

	stateController = new StateController();

	//create scene based on viz mode
	//0: HW5, 3 boards, 1: HW6, single board, lighthouse, diodes
	if ( stateController.visualizationMode = 0 ) {

		scene = new SceneHW5();

	} else {

		scene = new SceneHW6();
		sceneDiodes = new SceneDiodes();

	}


	//renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0xf0f0f0 );
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );

}


function onWindowResize() {

	scene.camera.aspect = window.innerWidth / window.innerHeight;
	scene.camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );
	render();

}


function updatePose() {

	//update board rotation
	scene.controls.update();

	if ( stateController.visualizationMode == 0 ) {

		//mode = 3D orientation
		for ( var i = 0; i < 3; i ++ ) {

			scene.boards[ i ].quaternion.copy( stateController.boards[ i ].quaternion );
			scene.boards[ i ].position.copy( stateController.boards[ i ].position );

		}


	} else {

		//mode = 6D pose

		scene.board.quaternion.copy( stateController.board.quaternion );
		//update board position, and ligthouse, diodes
		scene.board.position.copy( stateController.board.position );
		scene.lighthouse.quaternion.copy( stateController.lighthouse.quaternion );
		for ( var i = 0; i < 4; i ++ ) {

			sceneDiodes.diodes[ i ].position.set(
				stateController.diodeCoordinates[ 2 * i ],
				stateController.diodeCoordinates[ 2 * i + 1 ], 0 );

		}

	}

}


/**
 * updates pose of objects
 * checks for mode update
 * renders the scene
 */
function render() {

	if ( stateController.visualizationModeUpdate ) {

		//reinitialize scenes
		if ( stateController.visualizationMode == 0 ) {

			scene = new SceneHW5();

			//update info block
			$( "#infoHW6" ).hide();
			$( "#infoHW5" ).show();


		} else {

			scene = new SceneHW6();
			$( "#infoHW5" ).hide();
			$( "#infoHW6" ).show();

		}
		stateController.visualizationModeUpdate = false;

	}


	//update positions
	updatePose();


	//first render the 3D scene
	var windowW = window.innerWidth;
	var windowH = window.innerHeight;
	renderer.setViewport( 0, 0, windowW, windowH );
	renderer.setScissor( 0, 0, windowW, windowH );
	renderer.setScissorTest( true );
	renderer.setClearColor( 0xf0f0f0 );
	renderer.render( scene.scene, scene.camera );


	if ( stateController.visualizationMode == 1 ) {

		//now render the 2D diodes
		//taken from view-source:https://threejs.org/examples/webgl_multiple_views.html
		var w = 0.25;
		var h = 0.25;
		//var left = Math.floor(windowW * (1.0-w));
		var left = 0;
		var top = Math.floor( windowH * 0 );
		var width = Math.floor( windowW * w );
		var height = Math.floor( windowH * h );
		renderer.setViewport( left, top, width, height );
		renderer.setScissor( left, top, width, height );
		renderer.setScissor( left, top, width, height );
		renderer.setScissorTest( true );
		renderer.setClearColor( 0x000000 );
		renderer.render( sceneDiodes.scene, sceneDiodes.camera );

		$( "#trans" ).html(
			fixedWidth( scene.board.position.x ) + ", " +
      fixedWidth( scene.board.position.y ) + ", " +
      fixedWidth( scene.board.position.z ) + ", " );
		$( "#rot" ).html(
			fixedWidth( scene.board.rotation.x * radToDeg ) + ", " +
      fixedWidth( scene.board.rotation.y * radToDeg ) + ", " +
      fixedWidth( scene.board.rotation.z * radToDeg ) + ", " );

	}


}

/**
 * return a string representing a number that
 * takes up 7 spaces, including sign
 */
function fixedWidth( number ) {

	var numberString = number.toFixed( 2 );
	var nSpaces = 7 - numberString.length;
	if ( nSpaces > 0 ) {

		var spaces = '&nbsp'.repeat( nSpaces );
		return spaces.concat( numberString );

	} else {

		return numberString;

	}

}
