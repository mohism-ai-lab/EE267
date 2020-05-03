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


	// "state" object is a place where you store variables to render a scene.
	//
	// clipNear: z position of near clipping plane
	// clipFar: z position of far clipping plane
	// modelTranslation: (x,y,z) translations for teapots
	// modelRotation: (x,y) rotations for models
	// viewerPosition: (x,y,z) positions of a viewer
	// viewerTarget: the position where a viewer is looking
	// lights: position and color of light sources
	// material: various material properties
	// attenuation: (kc, kl, kq) light attenuation parameters
	this.state = {

		clipNear: 1.0,

		clipFar: 10000.0,

		modelTranslation: new THREE.Vector3(),

		modelRotation: new THREE.Vector2(),

		viewerPosition:
			new THREE.Vector3( 0, 0, dispParams.distanceScreenViewer ),

		viewerTarget: new THREE.Vector3(),

		lights: {

			pointLights: [
				{

					position: new THREE.Vector3( 0, 20, 30 ),

					color: new THREE.Color( 'lightgreen' ).multiplyScalar( 1.3 ),

				},
			],

			directionalLights: [
				 {

					direction: new THREE.Vector3( - 1, - 1, - 1 ),

					color: new THREE.Color( 'skyblue' ).multiplyScalar( .3 ),

				},
			],

			ambientLightColor: new THREE.Vector3( 1, 1, 1 ),

		},

		material: {

			ambient: new THREE.Vector3( 0.3, 0.3, 0.3 ),

			diffuse: new THREE.Vector3( 1.0, 1.0, 1.0 ),

			specular: new THREE.Vector3( 1.0, 1.0, 1.0 ),

			shininess: 120.0,

		},

        attenuation: new THREE.Vector3( 2.0, 0.0, 0.001),

	};

	// Constants for distinguishing which button is engaged.
	const MODEL_TRANSFORM = 0;

	const VIEWER_POSITION = 1;

	const VIEWER_TARGET = 2;

	const POINT_LIGHT_CTRL = 3;

	const DIRECTIONAL_LIGHT_CTRL = 4;

	// index of which lights are under control
	var pointLightIdx = 0;

	var directionalLightIdx = 0;

	// a variable to find which button is engaged
	var controller = NaN;

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
	// input:
	// e: jQuery event
	// x: the x position of the mouse cursor
	// y: the x position of the mouse cursor
	function onMove( e, x, y ) {

		// Check the mouse is clicked. If not, do nothing.
		if ( ! clickHold ) return;

		var ctrlKey = e.metaKey // for Mac's command key
			|| ( navigator.platform.toUpperCase().indexOf( "MAC" ) == - 1
			&& e.ctrlKey );

		var movement = computeMovement( x, y, previousPosition );

		// Check if the model control button is clicked.
		if ( controller === MODEL_TRANSFORM ) {

			// Check if the shift-key is pressed
			if ( e.shiftKey && ! ctrlKey ) {

				// XY translation
				_this.state.modelTranslation.x += movement.x;

				_this.state.modelTranslation.y += movement.y;

			} else if ( ! e.shiftKey && ctrlKey ) {

				// Z translation
				_this.state.modelTranslation.z += movement.y;

			} else {

				// Rotation
				_this.state.modelRotation.x -= movement.y;

				_this.state.modelRotation.y += movement.x;

			}

		}


		// Check if the viewer position control button is clicked.
		if ( controller === VIEWER_POSITION ) {

			// Check if the shift-key is pressed
			if ( ! ctrlKey ) {

				// XY translation
				_this.state.viewerPosition.x += movement.x;

				_this.state.viewerPosition.y += movement.y;

			} else {

				// Z translation
				_this.state.viewerPosition.z += movement.y;

			}

		}


		// Check if the viewer target control button is clicked.
		if ( controller === VIEWER_TARGET ) {

			// Check if the shift-key is pressed
			if ( ! ctrlKey ) {

				// XY translation
				_this.state.viewerTarget.x += movement.x;

				_this.state.viewerTarget.y += movement.y;

			} else {

				// Z translation
				_this.state.viewerTarget.z += movement.y;

			}

		}


		// Check if the point light control button is clicked.
		if ( controller === POINT_LIGHT_CTRL ) {

			var idx = pointLightIdx % _this.state.lights.pointLights.length;

			if ( ! isNaN( idx ) ) {

				var pointLight = _this.state.lights.pointLights[ idx ];

				if ( ! ctrlKey ) {

					// XY translation
					pointLight.position.x += movement.x * 0.1;

					pointLight.position.y += movement.y * 0.1;

				} else {

					// Z translation
					pointLight.position.z += movement.y * 0.1;

				}

			}

		}

		// Check if the directional light control button is clicked.
		if ( controller === DIRECTIONAL_LIGHT_CTRL ) {

			var idx = directionalLightIdx % _this.state.lights.directionalLights.length;

			if ( ! isNaN( idx ) ) {

				var directionalLight = _this.state.lights.directionalLights[ idx ];

				if ( ! ctrlKey ) {

					// XY translation
					directionalLight.direction.x -= movement.x * 0.1;

					directionalLight.direction.y -= movement.y * 0.1;

				} else {

					// Z translation
					directionalLight.direction.z -= movement.y * 0.1;

				}

			}

		}

	}

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

			e.preventDefault();

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


	$( "#modelBtn" ).click( function () {

		controller = MODEL_TRANSFORM;

		$( "#modelBtn" ).css( "background-color", "teal" );

		$( "#viewerPositionBtn" ).css( "background-color", cardinalColor );

		$( "#viewerTargetBtn" ).css( "background-color", cardinalColor );

		$( "#pointLightCtrlBtn" ).css( "background-color", cardinalColor );

		$( "#directionalLightCtrlBtn" ).css( "background-color", cardinalColor );

	} );


	$( "#viewerPositionBtn" ).click( function () {

		controller = VIEWER_POSITION;

		$( "#modelBtn" ).css( "background-color", cardinalColor );

		$( "#viewerPositionBtn" ).css( "background-color", "teal" );

		$( "#viewerTargetBtn" ).css( "background-color", cardinalColor );

		$( "#pointLightCtrlBtn" ).css( "background-color", cardinalColor );

		$( "#directionalLightCtrlBtn" ).css( "background-color", cardinalColor );

	} );


	$( "#viewerTargetBtn" ).click( function () {

		controller = VIEWER_TARGET;

		$( "#modelBtn" ).css( "background-color", cardinalColor );

		$( "#viewerPositionBtn" ).css( "background-color", cardinalColor );

		$( "#viewerTargetBtn" ).css( "background-color", "teal" );

		$( "#pointLightCtrlBtn" ).css( "background-color", cardinalColor );

		$( "#directionalLightCtrlBtn" ).css( "background-color", cardinalColor );

	} );


	$( "#pointLightCtrlBtn" ).click( function ( ) {

		controller = POINT_LIGHT_CTRL;

		pointLightIdx += 1;

		$( "#modelBtn" ).css( "background-color", cardinalColor );

		$( "#viewerPositionBtn" ).css( "background-color", cardinalColor );

		$( "#viewerTargetBtn" ).css( "background-color", cardinalColor );

		$( "#pointLightCtrlBtn" ).css( "background-color", "teal" );

		$( "#directionalLightCtrlBtn" ).css( "background-color", cardinalColor );

	} );


	$( "#directionalLightCtrlBtn" ).click( function ( ) {

		controller = DIRECTIONAL_LIGHT_CTRL;

		directionalLightIdx += 1;

		$( "#modelBtn" ).css( "background-color", cardinalColor );

		$( "#viewerPositionBtn" ).css( "background-color", cardinalColor );

		$( "#viewerTargetBtn" ).css( "background-color", cardinalColor );

		$( "#pointLightCtrlBtn" ).css( "background-color", cardinalColor );

		$( "#directionalLightCtrlBtn" ).css( "background-color", "teal" );

	} );


	// By clicking the point light button, a point light source is added to the
	// scene at the position specified. You can manipulate the position later
	// on based on the mouse movement.
	//
	// The color of the added point light is randomly chosen.
	var pLightPos = [
		new THREE.Vector3( 100, 70, 100 ),
		new THREE.Vector3( - 100, 70, 100 ),
		new THREE.Vector3( - 100, 70, - 100 ),
		new THREE.Vector3( 100, 70, - 100 ),
		new THREE.Vector3( 100, - 30, 100 ),
		new THREE.Vector3( - 100, - 30, 100 ),
		new THREE.Vector3( - 100, - 30, - 100 ),
		new THREE.Vector3( 100, - 30, - 100 ),
	];

	$( "#addPointLightBtn" ).click( function ( ) {

		var idx = _this.state.lights.pointLights.length - 1;

		var color = Math.random() * 0xffffff;

		var pointLight = {

			position: pLightPos[ idx % pLightPos.length ],

			color: new THREE.Color( color ),

		};

		_this.state.lights.pointLights.push( pointLight );

	} );


	// By clicking the directional light button, a directional light source is
	// added to the scene at the position specified. Here, we define the
	// direction as the direction to which the light propagates.
	//
	// The color of the added directional light is randomly chosen.
	var dLightDir = [
		new THREE.Vector3( - 1, - 1, - 1 ),
		new THREE.Vector3( 1, - 1, - 1 ),
		new THREE.Vector3( 1, - 1, 1 ),
		new THREE.Vector3( - 1, - 1, 1 ),
		new THREE.Vector3( - 1, 1, - 1 ),
		new THREE.Vector3( 1, 1, - 1 ),
		new THREE.Vector3( 1, 1, 1 ),
		new THREE.Vector3( - 1, 1, 1 ),
	];

	$( "#addDirectionalLightBtn" ).click( function ( ) {

		var idx = _this.state.lights.directionalLights.length;

		var color = Math.random() * 0xffffff;

		var directionalLight = {

			direction: dLightDir[ idx % dLightDir.length ],

			color: new THREE.Color( color ).multiplyScalar( .3 ),

		};

		_this.state.lights.directionalLights.push( directionalLight );

	} );



	/* Expose as public functions */

	this.onClick = onClick;

	this.releaseClick = releaseClick;

	this.onMove = onMove;

	this.computeMovement = computeMovement;

	this.display = display;

};
