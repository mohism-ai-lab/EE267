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
 * @param {Number} dispParams display parameters
 */
var StateController = function ( dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;

	// "state" object is a place where you store variables to render a scene.
	//
	// clipNear: z position of near clipping plane
	// clipFar: z position of far clipping plane
	// modelTranslation: (x,y,z) translations for teapots
	// modelRotation: (x,y) rotations for models
	// viewerPosition: (x,y,z) positions of a viewer
	// viewerTarget: the position where a viewer is looking
	// perspectiveMat switch between perspective
	this.state = {

		clipNear: 1.0,

		clipFar: 10000.0,

		modelTranslation: new THREE.Vector3(),

		modelRotation: new THREE.Vector2(),

		viewerPosition:
			new THREE.Vector3( 0, 0, dispParams.distanceScreenViewer ),

		viewerTarget: new THREE.Vector3(),

		perspectiveMat: true,

		topView: false,

	};


	// Constants for distinguishing which button is engaged.
	const MODEL_TRANSFORM = 0;

	const VIEWER_POSITION = 1;

	const VIEWER_TARGET = 2;

	const CLIPNEAR_CTRL = 3;

	// a variable to find which button is engaged
	var controller = NaN;

	// A variable to store the mouse position on the previous frame.
	var previousPosition = new THREE.Vector2();

	// A variable to check the click status
	var clickHold = false;



	/* Private Functions */

	// Here, we define callback functions for event listeners set by jQuery.
	// For example, onClick function is called when the mouse is clicked
	// somewhere in the window.
	// See at the bottom of this class to see the usages.

	// This function is called when the mouse click is engaged.
	//
	// INPUT
	// x: the x position of the mouse cursor
	// y: the x position of the mouse cursor
	function onClick( x, y ) {

		previousPosition.set( x, y );

		clickHold = true;

	}

	// This function is called when the mouse click is released, or the mouse
	// cursor goes to the outside of the window.
	function releaseClick() {

		clickHold = false;

	}

	// This function is called when the mouse cursor moves.
	//
	// INPUT
	// e: jQuery event
	// x: the x position of the mouse cursor
	// y: the x position of the mouse cursor
	function onMove( e, x, y ) {

		// Check the mouse is clicked. If not, do nothing.
		if ( ! clickHold ) return;

		var movement = computeMovement( x, y, previousPosition );


		// Map mouse movements to matrix parameters

		// Check if the model control button is clicked.
		if ( controller === MODEL_TRANSFORM ) {

			updateModelParams( e, movement );

		}

		// Check if the viewer position control button is clicked.
		if ( controller === VIEWER_POSITION ) {

			updateViewPosition( e, movement );

		}

		// Check if the viewer target control button is clicked.
		if ( controller === VIEWER_TARGET ) {

			updateViewTarget( e, movement );

		}

		// Check if the clipping control button is clicked.
		if ( controller === CLIPNEAR_CTRL ) {

			updateProjectionParams( e, movement );

		}

	}

	// A function to compute the mouse movement between frames.
	// Do not forget to update previousPosition variable.
	//
	// INPUT
	// x: x position of a mouse cursor in jQuery's coordinate
	// y: y position of a mouse cursor in jQuery's coordinate
	// previousPosition: the coordinate of the mouse pointer in jQuery's
	//	coordinate at the previous frame as THREE.Vector2.
	//
	// OUTPUT
	// the mouse movement between frames in Three's coordinate as THREE.Vector2
	function computeMovement( x, y, previousPosition ) {

		/* TODO (2.1.1.1) Mouse Movement */

        var change_x = x - previousPosition.x;
        var change_y = y - previousPosition.y;
        previousPosition.x = x;
        previousPosition.y = y;
        return new THREE.Vector2(change_x, change_y);

	}

	// A function to map mouse movements to high level model matrix parameters.
	// This function should update "modelTranslation" and "modelRotation" in the
	// "state" variable.
	//
	// INPUT
	// e: jQuery event
	// movement: the mouse movement computed by computeMovement() function
	//
	// NOTE (Important!):
	// In JavaScript, if you want to access "this.state" from a closure, you need
	// to make an alias for "this" and access "state" from this alias because
	// "this" refers to the closure itself if you use "this" inside the closure.
	// We have already defined the alias as "_this" at the top of this class.
	// We follow this convention throughout homework.
	function updateModelParams( e, movement ) {

		/* TODO
		 * (2.1.1.2) Mapping Mouse Movement to Matrix Parameters
		 * (2.1.2) Model Rotation
		 */

		var ctrlKey = e.metaKey // for Mac's command key
			|| ( navigator.platform.toUpperCase().indexOf( "MAC" ) == - 1
				&& e.ctrlKey );

		// Check if the shift-key is pressed
		if ( e.shiftKey && ! ctrlKey ) {

			// XY translation
            _this.state.modelTranslation.x += movement.x;
            _this.state.modelTranslation.y += -1* movement.y;

		} else if ( ! e.shiftKey && ctrlKey ) {
			// Z translation
            _this.state.modelTranslation.z -= movement.y;


		} else {

			// Rotation
            _this.state.modelRotation.x += movement.y;
            _this.state.modelRotation.y += movement.x;
		}

	}


	// A function to map mouse movements to the viewer position parameter.
	// This function should update "viewerPosition" in the "state" variable.
	//
	// INPUT
	// e: jQuery event
	// movement: the mouse movement computed by computeMovement() function
	function updateViewPosition( e, movement ) {

		/* TODO (2.2.1) Move viewer position */

		var ctrlKey = e.metaKey // for Mac's command key
			|| ( navigator.platform.toUpperCase().indexOf( "MAC" ) == - 1
				&& e.ctrlKey );

		// Check if shift-key pressed
		if ( ! ctrlKey ) {

			// XY translation
            _this.state.viewerPosition.x += movement.x;
            _this.state.viewerPosition.y -= movement.y;
		} else {

			// Z translation
            _this.state.viewerPosition.z -= movement.y;

		}

	}


	// A function to map mouse movements to the viewer target parameter.
	// This function should update "viewerTarget" in the "state" variable.
	//
	// INPUT
	// e: jQuery event
	// movement: the mouse movement computed by computeMovement() function
	function updateViewTarget( e, movement ) {

		/* TODO (2.2.2) Move viewer target */

		var ctrlKey = e.metaKey // for Mac's command key
			|| ( navigator.platform.toUpperCase().indexOf( "MAC" ) == - 1
				&& e.ctrlKey );

		// Check if shift-key pressed
		if ( ! ctrlKey ) {

			// XY translation
            _this.state.viewerTarget.x += movement.x;
            _this.state.viewerTarget.y -= movement.y;
		} else {

			// Z translation
            _this.state.viewerTarget.z -= movement.y;

		}

	}


	// A function to map mouse movements to the projection matrix parameters.
	// This function should update "clipNear" in the "state" variable.
	//
	// INPUT
	// e: jQuery event
	// movement: the mouse movement computed by computeMovement() function
	function updateProjectionParams( e, movement ) {

		/* TODO (2.3.1) Implement Perspective Transform */
        //+y mouse movement (vertical to the bottom) pull clipping  plane closer to camera 
        // -y mouse movements will push it farther away.
        //clipNear should be clamped to at least 1.
        _this.clipNear = 1;
        _this.clipFar += movement.y;
	}


	// Display the scene parameters in the browser
	function display() {

		$( "#positionVal" ).html(

			"<p>Translation: " +
				vector3ToString( this.state.modelTranslation ) + "</p>" +
			"<p>Rotation: " +
				vector2ToString( this.state.modelRotation ) + "</p>" +
			"<p>Viewer position: " +
				vector3ToString( this.state.viewerPosition ) + "</p>" +
			"<p>Viewer target: " +
				vector3ToString( this.state.viewerTarget ) + "</p>"

		);

	}



	/* Event listeners */

	$( ".renderCanvas" ).on( {

		"mousedown": function ( e ) {

			onClick( e.pageX, e.pageY );

		},

		"mousemove": function ( e ) {

			onMove( e, e.pageX, e.pageY );

			e.preventDefault();

		},

		"mouseout": function ( e ) {

			releaseClick();

		},

		"mouseup": function ( e ) {

			releaseClick();

		},

	} );


	$( "#modelBtn" ).click( function () {

		controller = MODEL_TRANSFORM;

		$( "#modelBtn" ).css( "background-color", "teal" );

		$( "#viewerPositionBtn" ).css( "background-color", cardinalColor );

		$( "#viewerTargetBtn" ).css( "background-color", cardinalColor );

		$( "#clipNearBtn" ).css( "background-color", cardinalColor );

	} );


	$( "#viewerPositionBtn" ).click( function () {

		if ( ! _this.state.topView ) {

			controller = VIEWER_POSITION;

			$( "#modelBtn" ).css( "background-color", cardinalColor );

			$( "#viewerPositionBtn" ).css( "background-color", "teal" );

			$( "#viewerTargetBtn" ).css( "background-color", cardinalColor );

			$( "#clipNearBtn" ).css( "background-color", cardinalColor );

		}

	} );


	$( "#viewerTargetBtn" ).click( function () {

		if ( ! _this.state.topView ) {

			controller = VIEWER_TARGET;

			$( "#modelBtn" ).css( "background-color", cardinalColor );

			$( "#viewerPositionBtn" ).css( "background-color", cardinalColor );

			$( "#viewerTargetBtn" ).css( "background-color", "teal" );

			$( "#clipNearBtn" ).css( "background-color", cardinalColor );

		}

	} );

	$( "#clipNearBtn" ).click( function () {

		if ( ! _this.state.topView ) {

			controller = CLIPNEAR_CTRL;

			$( "#modelBtn" ).css( "background-color", cardinalColor );

			$( "#viewerPositionBtn" ).css( "background-color", cardinalColor );

			$( "#viewerTargetBtn" ).css( "background-color", cardinalColor );

			$( "#clipNearBtn" ).css( "background-color", "teal" );

		}

	} );


	$( "#projectionMatBtn" ).click( function () {

		_this.state.perspectiveMat = ! _this.state.perspectiveMat;

		if ( _this.state.perspectiveMat ) {

			$( "#projectionMatBtn" ).html( "Perspective Matrix" );

		} else {

			$( "#projectionMatBtn" ).html( "Orthographic Matrix" );

		}

	} );

	// Scene switching system
	$( "html" ).keydown( function ( e ) {

		/* Change the scene if space is pressed. */
		if ( e.which === 32 ) {

			_this.state.topView = ! _this.state.topView;

			if ( _this.state.topView ) {

				$( "#modelBtn" ).css( "background-color", "teal" );

				$( "#viewerPositionBtn" ).css( { "background-color": cardinalColor, "opacity": 0.1 } );

				$( "#viewerTargetBtn" ).css( { "background-color": cardinalColor, "opacity": 0.1 } );

				$( "#clipNearBtn" ).css( { "background-color": cardinalColor, "opacity": 0.1 } );

				$( "#projectionMatBtn" ).css( { "background-color": cardinalColor, "opacity": 0.1 } );

				controller = MODEL_TRANSFORM;

			} else {

				$( "#viewerPositionBtn" ).css( "opacity", 1.0 );

				$( "#viewerTargetBtn" ).css( "opacity", 1.0 );

				$( "#clipNearBtn" ).css( "opacity", 1.0 );

				$( "#projectionMatBtn" ).css( "opacity", 1.0 );

			}

		}

	} );


	/* Expose as public functions */

	this.onClick = onClick;

	this.releaseClick = releaseClick;

	this.onMove = onMove;

	this.computeMovement = computeMovement;

	this.updateModelParams = updateModelParams;

	this.updateViewPosition = updateViewPosition;

	this.updateViewTarget = updateViewTarget;

	this.updateProjectionParams = updateProjectionParams;

	this.display = display;

};
