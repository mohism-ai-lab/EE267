function SceneDiodes() {

	this.scene = new THREE.Scene();
	//set camera
	this.camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 2.0 );
	this.camera.up.set( 0, 1.5, 0 );
	this.camera.position.set( 0, 0, 1 );
	this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

	var colors = [ 0xFF0000, 0x00FF00, 0x3BB9FF, 0xFFFFFF ];
	var diodeLinesGeom = new THREE.Geometry();


	//add diodes
	this.diodes = [];

	var diodeCoordinates = [ - 1, 1, 1, 1, 1, - 1, - 1, - 1 ];
	var grid2DUnitLength = 0.1;
	var grid2DNumUnits = 10.0;

	for ( var i = 0; i < 4; i ++ ) {

		var diode = new THREE.Object3D();
		var diodeGeom = new THREE.BoxGeometry( 0.02, 0.02, 0 );
		var diodeMat = new THREE.MeshBasicMaterial( { color: colors[ i ] } );
		var diodeMesh = new THREE.Mesh( diodeGeom, diodeMat );
		diode.add( diodeMesh );
		diode.position.set( diodeCoordinates[ 2 * i ], diodeCoordinates[ 2 * i + 1 ], 0 );
		this.diodes.push( diode );
		diodeLinesGeom.vertices.push( diode.position.clone() );
		this.scene.add( diode );

	}

	//add grid
	this.grid = new THREE.GridHelper( grid2DUnitLength * grid2DNumUnits, grid2DNumUnits, 0xFFFFFF );
	this.grid.position.set( 0, 0, 0 );
	this.grid.rotation.set( Math.PI / 2, 0, 0 );
	this.scene.add( this.grid );

}
