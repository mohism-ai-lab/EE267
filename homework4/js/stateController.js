/**
 * @file Class for handling mouse movement
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * State_controller
 *
 * @class StateController
 * @classdesc Class holding the state of a model and a viewer.
 *		This class accumulates the total mouse movement.
 *
 * @param  {DisplayParameters} dispParams display parameters
 */
var StateController = function ( dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;


	this.state = {
		// Values are specified in millimeter.

		clipNear: 100,

		clipFar: 100000,

		modelRotation: new THREE.Vector2(),

		modelTranslation: new THREE.Vector3(),

		viewerPosition:
			new THREE.Vector3( 0, 0, dispParams.distanceScreenViewer ),

		viewerTarget: new THREE.Vector3(),

		lights: {

			pointLights: [
				{

					position: new THREE.Vector3( 100, 1000, 1000 ),

					color: new THREE.Color( 'lightgreen' ).multiplyScalar( 1.3 ),

				},
			],

			directionalLights: [],

			ambientLightColor: new THREE.Vector3( 1, 1, 1 ),

		},

		material: {

			ambient: new THREE.Vector3( 0.3, 0.3, 0.3 ),

			diffuse: new THREE.Vector3( 1.0, 1.0, 1.0 ),

			specular: new THREE.Vector3( 1.0, 1.0, 1.0 ),

			shininess: 120.0,

		},

		attenuation: new THREE.Vector3( 2.0, 0.0, 0.0 ),

		/* TODO (2.2.3) Update this parameter with your values  */
		lensDistortion: new THREE.Vector2( 0.39, 0.14 ),

	};

	// A variable to store the mouse position on the previous frame.
	var previousPosition = new THREE.Vector2();

	// A variable to check the click status
	var clickHold = false;


	/* Functions */

	// Here, we define callback functions for event listeners set by jQuery..
	// For example, onClick function is called when the mouse is clicked
	// somewhere in the window.
	// See at the bottom of this class to see the usages.

	// This function is called when the mouse click is engaged.
	//
	// input:
	// x: the x position of the mouse cursor
	// y: the x position of the mouse cursor
	function onClick( e, x, y ) {

		previousPosition.set( x, y );

		clickHold = true;

		if ( e.shiftKey ) {

			updateGaze( x, y );

		}

	}

	// This function is called when the mouse click is released, or the mouse
	// cursor goes to the outside of the window.
	function releaseClick() {

		clickHold = false;

	}

	function onMove( e, x, y ) {

		var ctrlKey = e.metaKey // for Mac's command key
			|| ( navigator.platform.toUpperCase().indexOf( "MAC" ) == - 1
				&& e.ctrlKey );

		// Check the mouse is clicked. If not, do nothing.
		if ( ! clickHold ) return;

		var movement = computeMovement( x, y, previousPosition );

		// Check if the shift-key is pressed
		if ( ! ctrlKey ) {

			// XY translation
			_this.state.modelRotation.x += movement.y;

			_this.state.modelRotation.y += movement.x;

		} else if ( ctrlKey ) {

			// Z translation
			_this.state.modelTranslation.z += movement.y;

		}

	}

	$( "html" ).keydown( function ( e ) {

		/* Change the scene if space is pressed. */
		if ( e.which === 87 ) {

			_this.state.modelTranslation.z += 3;

		}

		if ( e.which == 83 ) {

			_this.state.modelTranslation.z -= 3;

		}

	} );

	// A function to compute the mouse movement between frames.
	// Do not forget to update previousPosition variable.
	function computeMovement( x, y, previousPosition ) {

		var mv = new THREE.Vector2(
			x - previousPosition.x, previousPosition.y - y );

		previousPosition.set( x, y );

		return mv;

	}

	// Display the scene parameters in the browser
	function display() {

		$( "#positionVal" ).html(

			"<p>Model rotation: " +
				vector2ToString( this.state.modelRotation ) + "</p>" +
			"<p>Model translation: " +
				vector3ToString( this.state.modelTranslation ) + "</p>" +
			"<p>Lens distortion: " +
				vector2ToString( this.state.lensDistortion ) + "</p>"

		);

	}



	/* Event listeners */

	$( ".renderCanvas" ).on( {

		"mousedown": function ( e ) {

			onClick( e, e.pageX, e.pageY );

		},

		"mousemove": function ( e ) {

			onMove( e, e.pageX, e.pageY );

			e.preventDefault();

		},

		"mouseout": function ( ) {

			releaseClick();

		},

		"mouseup": function ( ) {

			releaseClick();

		},

	} );



	// Controller for the lens distortion parameter
	var lensDistortion = this.state.lensDistortion;

	$( "html" ).keydown( function ( e ) {

		switch ( e.which ) {

			case 50: /* Increase K_1: Key 2 */

				lensDistortion.x += 0.01;

				break;

			case 51: /* Decrease K_1 of the distortion parameter: Key 3 */

				lensDistortion.x -= 0.01;

				break;

			case 52: /* Increase K_2: Key 4 */

				lensDistortion.y += 0.01;

				break;

			case 53: /* Decrease K_2: Key 5 */

				lensDistortion.y -= 0.01;

				break;

		}

	} );



	/* Expose as public functions */

	this.onClick = onClick;

	this.releaseClick = releaseClick;

	this.onMove = onMove;

	this.computeMovement = computeMovement;

	this.display = display;

};
