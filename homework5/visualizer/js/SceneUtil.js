/** returns a 3D axis. red: x, green: y, blue: z */
function buildAxis( length, width ) {

	width = width || length / 20.0;
	var axis = new THREE.Object3D();
	var colors = [ 0xFF0000, 0x00FF00, 0x0000FF ];
	var rotations = [ new THREE.Euler( 0, 0, 0 ), new THREE.Euler( 0, 0, Math.PI / 2 ), new THREE.Euler( 0, - Math.PI / 2, 0 ) ];
	var translations = [ new THREE.Vector3( length / 2, 0, 0 ), new THREE.Vector3( 0, length / 2, 0 ), new THREE.Vector3( 0, 0, length / 2 ) ];
	for ( var i = 0; i < 3; i ++ ) {

		var line = new THREE.Object3D();
		var lineGeom = new THREE.BoxGeometry( length, width, width );
		var lineMat = new THREE.MeshBasicMaterial( { color: colors[ i ] } );
		var lineMesh = new THREE.Mesh( lineGeom, lineMat );
		line.add( lineMesh );
		line.position.copy( translations[ i ] );
		line.rotation.copy( rotations[ i ] );
		axis.add( line );

	}
	return axis;

}

/** returns a vrduino board object */
function Vrduino() {

	var vrduino = new THREE.Object3D();
	var boardGeom = new THREE.BoxGeometry( 8.4, 5, 0.5 );
	var boardMat = new THREE.MeshNormalMaterial(
		{ transparent: true, opacity: 0.8 } );
	var boardMesh = new THREE.Mesh( boardGeom, boardMat );
	vrduino.add( boardMesh );
	var boardAxis = buildAxis( 10 );
	boardAxis.quaternion.setFromEuler( new THREE.Euler( 0, 0, 0 ) );
	vrduino.add( boardAxis );

	var teensy = Teensy( 3 );
	teensy.position.set( 0, 0, 0.25 );
	teensy.quaternion.setFromEuler( new THREE.Euler( 0, 0, 0 ) );
	vrduino.add( teensy );

	return vrduino;

}


/** returns the an object in the shape of the teensyduino */
function Teensy( scale ) {

	var leg1Geom = new THREE.BoxGeometry( 0.05, 1, 0.25 );
	var leg1Mat = new THREE.MeshNormalMaterial(
		{ transparent: true, opacity: 0.8 } );
	var leg1Mesh = new THREE.Mesh( leg1Geom, leg1Mat );
	var leg1 = new THREE.Object3D();
	leg1.add( leg1Mesh );
	leg1.position.set( - 0.25, 0, 0.125 );

	var leg2Geom = new THREE.BoxGeometry( 0.05, 1, 0.25 );
	var leg2Mat = new THREE.MeshNormalMaterial(
		{ transparent: true, opacity: 0.8 } );
	var leg2Mesh = new THREE.Mesh( leg2Geom, leg2Mat );
	var leg2 = new THREE.Object3D();
	leg2.add( leg2Mesh );
	leg2.position.set( 0.25, 0, 0.125 );

	var faceGeom = new THREE.BoxGeometry( 0.5, 1, 0.05 );
	var faceMat = new THREE.MeshNormalMaterial(
		{ transparent: true, opacity: 0.8 } );
	var faceMesh = new THREE.Mesh( faceGeom, faceMat );
	var face = new THREE.Object3D();
	face.add( faceMesh );
	face.position.set( 0, 0, 0.25 );

	var teensy = new THREE.Object3D();
	teensy.add( leg1 );
	teensy.add( leg2 );
	teensy.add( face );
	teensy.scale.set( scale, scale, scale );
	return teensy;

}
