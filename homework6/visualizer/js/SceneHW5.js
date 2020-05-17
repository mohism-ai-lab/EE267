/**
 * creates scene with 3 boards to visualize HW5
 */
function SceneHW5() {

	this.scene = new THREE.Scene();

	//set camera
	this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
	this.camera.position.set( 0, 0, 120 );

	this.camera.up.set( 0, 1, 0 );
	this.lookAt = new THREE.Vector3( 0, 0, 50 );

	this.controls = new THREE.TrackballControls( this.camera );
	this.controls.target.copy( this.lookAt );

	//create 3 boards
	this.boards = [];

	for ( var i = 0; i < 3; i ++ ) {

	  this.boards.push( Vrduino() );
		this.scene.add( this.boards[ i ] );

	}

}
