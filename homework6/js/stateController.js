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

		//set to null so we know it's uninitialized
		previousPositionHm: null,

		//interpolation parameter between previous estimate and new measurement, for
		//position x,y,z
		//1: use only new measurement, 0: use only previous estimate
		alphaPositionFilter: 1.0,

		viewerPosition:
			new THREE.Vector3( 0, 0, dispParams.distanceScreenViewer ),

		imuQuaternion: new THREE.Quaternion(),

		baseStationPitch: 0,

		baseStationRoll: 0,

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

		lensDistortion: new THREE.Vector2( 0.34, 0.55 ),

		connectionMsg: ''

	};

	// A variable to store the mouse position on the previous frame.
	var previousPosition = new THREE.Vector2();

	// A variable to check the click status
	var clickHold = false;

	var socket = null;

	initWebSocket();


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
			"<p>Lens distortion: " +
				vector2ToString( this.state.lensDistortion ) + "</p>" +
			"<p>Viewer position: " +
				vector3ToString( this.state.viewerPosition ) + "</p>" +
			"<p>alpha: " + this.state.alphaPositionFilter.toFixed( 2 ) + "</p>"
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

	// Controller for the lens distortion parameter and head-and-neck model
	$( "html" ).keydown( function ( e ) {

		switch ( e.which ) {

			case 50: // Increase alpha: Key 2

				if ( _this.state.alphaPositionFilter <= 0.99 ) {

					_this.state.alphaPositionFilter += 0.01;

				}


				break;

			case 51: // Decrease alpha: Key 3

				if ( _this.state.alphaPositionFilter >= .01 ) {

					_this.state.alphaPositionFilter -= 0.01;

				}

				break;

		}

	} );

	function initWebSocket() {

		if ( socket && socket.readyState == 1 ) {

			return;

		}

		console.log( 'connecting' );

		/* Initialize WebSocket */
		socket = new WebSocket( "ws://localhost:8081" );

		socket.onopen = function () {

			var openMsg = "WebSocket is opened.";

			socket.send( openMsg );

			console.log( openMsg );

			_this.state.connectionMsg = "Connected!";

		};

		socket.onclose = function () {

			var closeMsg = "WebSocket is closed.";

			socket.send( closeMsg );

			console.log( closeMsg );

			_this.state.connectionMsg = "Lost...";

			socket = null;

			//try to reconnect in 1s
			setTimeout( initWebSocket, 1000 );

		};

		socket.onmessage = function ( imu ) {

			var data = imu.data.replace( /"/g, "" ).split( " " );

			if ( data[ 0 ] == "QC" ) {

				_this.state.imuQuaternion.set(
					Number( data[ 2 ] ), Number( data[ 3 ] ),
					Number( data[ 4 ] ), Number( data[ 1 ] ) ).normalize();

			} else if ( data[ 0 ] == "PS" ) {

				//apply pitch and roll correction, then rotate around y by 180
				var pos = new THREE.Vector3(
					Number( data[ 1 ] ), Number( data[ 2 ] ), Number( data[ 3 ] ) );

				var rotateBaseStationToWorld = new THREE.Matrix4().makeRotationFromEuler(
					new THREE.Euler( _this.state.baseStationPitch, 0, _this.state.baseStationRoll ) );

				var rotateY180Mat = new THREE.Matrix4().makeRotationFromEuler(
					new THREE.Euler( 0, Math.PI, 0 ) );

				rotateBaseStationToWorld.premultiply( rotateY180Mat );

				pos.applyMatrix4( rotateBaseStationToWorld );

				//record translation from previous measurement
				if ( _this.state.previousPositionHm == null ) {

					//if prev position is uninitialized, just set to current position
					//so the translation starts as 0
					_this.state.previousPositionHm = pos.clone();

				}

				var translation = pos.clone().sub(
					_this.state.previousPositionHm ).multiplyScalar( _this.state.alphaPositionFilter );

				_this.state.viewerPosition.add( translation );

				_this.state.previousPositionHm = pos.clone();


			} else if ( data[ 0 ] == "BS" ) {

				_this.state.baseStationPitch = Number( data[ 1 ] ) * Math.PI / 180;

				_this.state.baseStationRoll = Number( data[ 2 ] ) * Math.PI / 180;

			}

		};

	}



	/* Expose as public functions */

	this.onClick = onClick;

	this.releaseClick = releaseClick;

	this.onMove = onMove;

	this.computeMovement = computeMovement;

	this.display = display;

	this.initWebSocket = initWebSocket;

};
