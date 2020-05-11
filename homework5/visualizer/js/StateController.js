/**
 * reads from web socket and records pose
 * detects mode change from web page
 */
function StateController() {

	//render 3 boards for HW5
	this.boards = [];
	positions = [
		new THREE.Vector3( - 50, 0, 50 ),
		new THREE.Vector3( 0, 0, 50 ),
		new THREE.Vector3( 50, 0, 50 ) ];

	for ( var i = 0; i < 3; i ++ ) {

		this.boards.push( new THREE.Object3D() );
		this.boards[ i ].position.copy( positions[ i ] );
		//intialize to face away
		this.boards[ i ].quaternion.copy( new THREE.Quaternion( 0, 1, 0, 0 ) );

	}

	//single board in HW6
	this.board = new THREE.Object3D();
	this.board.position.set( 0, - 10, 40 );

	this.lighthouse = new THREE.Object3D();

	this.diodeCoordinates = [];

	//mode = 0, visualize orientation only.
	//mode = 1, visualize full 3D pose.
	this.visualizationMode = 0;
	this.visualizationModeUpdate = true;

	var _this = this;

	//Connect to websocket
	var socket = null;

	var initWebSocket = function () {

		console.log( 'init' );
		if ( socket && socket.readyState == 1 ) {

			console.log( 'null' );
			return;

		}

		socket = new WebSocket( "ws://localhost:8081" );

		socket.onopen = function () {

			console.log( "web socket opened" );

		};

		//parse data from web socket into pose data
		socket.onmessage = function ( e ) {

			var dataString = e.data;
			var dataArray = dataString.split( " " );
			if ( dataArray[ 0 ] == "error:" ) {

				return;

			} else if ( dataArray[ 0 ] == 'SF' ) {

				//full pose
				//order is x,y,z,qw,qx,qy,qz
				//shouldn't matter if data comes from IMU or HM
				//convert units from mm to cm
				var x = parseFloat( dataArray[ 1 ] ) / 10.0;
				var y = parseFloat( dataArray[ 2 ] ) / 10.0;
				var z = parseFloat( dataArray[ 3 ] ) / 10.0;
				_this.board.position.set( x, y, z );

				//serialized quat is in order w,x,y,z
				//THREE set function is in order x,y,z,w
				_this.board.quaternion.set(
					parseFloat( dataArray[ 5 ] ), parseFloat( dataArray[ 6 ] ),
					parseFloat( dataArray[ 7 ] ), parseFloat( dataArray[ 4 ] ) );

			} else if ( dataArray[ 0 ] == 'EA' ) {

				_this.boards[ 1 ].quaternion.setFromEuler( new THREE.Euler(
					parseFloat( dataArray[ 1 ] ) * degToRad,
					parseFloat( dataArray[ 2 ] ) * degToRad,
					parseFloat( dataArray[ 3 ] ) * degToRad, 'YXZ' ) );

				rotateY180( _this.boards[ 1 ].quaternion );

			} else if ( dataArray[ 0 ] == 'QC' ) {

				_this.boards[ 2 ].quaternion.set(
					parseFloat( dataArray[ 2 ] ),
					parseFloat( dataArray[ 3 ] ),
					parseFloat( dataArray[ 4 ] ),
					parseFloat( dataArray[ 1 ] ) );

				var q = _this.boards[ 2 ].quaternion.clone();
				var Ry = new THREE.Matrix4().makeRotationAxis( new THREE.Vector3( 0, 1, 0 ), Math.PI );
				var Rq = new THREE.Matrix4().makeRotationFromQuaternion( q );
				var RqRy = Rq.clone().multiply( Ry );
				var RyRq = Ry.clone().multiply( Rq );

				rotateY180( _this.boards[ 2 ].quaternion );

			} else if ( dataArray[ 0 ] == 'QG' ) {

				_this.boards[ 0 ].quaternion.set(
					parseFloat( dataArray[ 2 ] ),
					parseFloat( dataArray[ 3 ] ),
					parseFloat( dataArray[ 4 ] ),
					parseFloat( dataArray[ 1 ] ) );

				rotateY180( _this.boards[ 0 ].quaternion );

			} else if ( dataArray[ 0 ] == 'FLAT' ) {

				_this.boards[ 0 ].quaternion.setFromEuler( new THREE.Euler(
					0, 0, parseFloat( dataArray[ 1 ] ) * degToRad ) );

				_this.boards[ 1 ].quaternion.setFromEuler( new THREE.Euler(
					0, 0, parseFloat( dataArray[ 2 ] ) * degToRad ) );

				_this.boards[ 2 ].quaternion.setFromEuler( new THREE.Euler(
					0, 0, parseFloat( dataArray[ 3 ] ) * degToRad ) );

				rotateY180( _this.boards[ 0 ].quaternion );
				rotateY180( _this.boards[ 1 ].quaternion );
				rotateY180( _this.boards[ 2 ].quaternion );

			} else if ( dataArray[ 0 ] == 'BS' ) {

				//base station pitch and roll
				var pitch = - degToRad * parseFloat( dataArray[ 1 ] );
				var roll = - degToRad * parseFloat( dataArray[ 2 ] );
				//if ((pitch != pitchLighthouseToWorld) || (roll != rollLighthouseToWorld)) {

				rollLighthouseToWorld = roll;
				pitchLighthouseToWorld = pitch;
				_this.lighthouse.quaternion.setFromEuler( new THREE.Euler( pitch, 0, roll ) );
				//lighthouseUpdate = true;
				//}

			} else if ( dataArray[ 0 ] == 'PP' ) {

				//record diode 2d positions. format is d0x, d0y, d1x, d1y, ...
				for ( var i = 0; i < 8; i ++ ) {

					_this.diodeCoordinates[ i ] = dataArray[ i + 1 ];

				}

			}//endif

		};

		socket.onclose = function () {

			console.log( "web socket closed" );
			socket = null;
			setTimeout( initWebSocket, 1000 );

		};


	};

	initWebSocket();

	//detect visualization mode from button press, and record
	var buttons = document.getElementsByName( 'mode' );
	var val = document.querySelector( 'input[name="mode"]:checked' ).value;
	_this.visualizationMode = parseInt( val );

	for ( var i = 0; i < buttons.length; i ++ ) {

		buttons[ i ].onclick = function () {

			var val = document.querySelector( 'input[name="mode"]:checked' ).value;
			_this.visualizationMode = parseInt( val );
			_this.visualizationModeUpdate = true;

		};

	}

}

/** rotates an input quaternion by 180 around the y-axis */
function rotateY180( q ) {

	var qRotate = new THREE.Quaternion( 0, 1, 0, 0 );
	q.premultiply( qRotate );


}
