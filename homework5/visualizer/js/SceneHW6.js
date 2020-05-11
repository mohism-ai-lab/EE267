/**
 * creates scene with board, and lighthouse.
 */

function SceneHW6() {

	this.scene = new THREE.Scene();

	//set camera
	this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
	this.camera.position.set( 10, 0, 300 );

	this.camera.up.set( 0, 1, 0 );
	//tracset this in trackball controls
	this.lookAt = new THREE.Vector3( 0, 0, 10 );

	this.controls = new THREE.TrackballControls( this.camera );
	this.controls.target.copy( this.lookAt );


	this.board = Vrduino( );

	this.scene.add( this.board );


	//create lighthouse base station
	var lighthouseGeom = new THREE.BoxGeometry( 10, 10, 10 );
	var lighthouseMat = new THREE.MeshNormalMaterial(
		{ transparent: true, opacity: 0.5 } );
	var lighthouseMesh = new THREE.Mesh( lighthouseGeom, lighthouseMat );
	this.lighthouse = new THREE.Object3D();
	this.lighthouse.add( lighthouseMesh );
	this.lighthouse.quaternion.setFromEuler( new THREE.Euler( 0.1, 0, 0.5 ) );
	var lighthouseAxis = buildAxis( 10 );
	//lighthouseAxis.quaternion.setFromEuler(new THREE.Euler(-0.1, 0, -0.5));
	this.lighthouse.add( lighthouseAxis );
	this.scene.add( this.lighthouse );

	//create lighthouse stand to visualize vertical
	var height = 100;
	this.stand = new THREE.Object3D();
	var standGeom = new THREE.BoxGeometry( 2, 100, 2 );
	var standMat = new THREE.MeshNormalMaterial();
	var standMesh = new THREE.Mesh( standGeom, standMat );
	this.stand.add( standMesh );
	this.stand.position.set( 0, - height / 2.0, 0 );
	this.scene.add( this.stand );

	// Create background grid
	var gridUnitLength = 10; //cm
	var gridNumUnits = 10;
	this.grid = new THREE.GridHelper( gridUnitLength * gridNumUnits, gridNumUnits );
	this.grid.position.set( 0, - height, 0 );
	this.scene.add( this.grid );

}
