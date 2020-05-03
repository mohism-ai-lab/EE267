/**
 * @file functions to compute model/view/projection matrices
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * MVPmat
 *
 * @class MVPmat
 * @classdesc Class for holding and computing model/view/projection matrices.
 *
 * @param  {DisplayParameters} dispParams    display parameters
 */
var MVPmat = function ( dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;


	this.modelMat = new THREE.Matrix4();

	this.viewMat = new THREE.Matrix4();

	this.projectionMat = new THREE.Matrix4();



	/* Functions */

	// A function to compute a model matrix based on the current state
	function computeModelTransform( state ) {

		var modelTranslation = state.modelTranslation;

		var modelRotation = state.modelRotation;

		var translationMat
			= new THREE.Matrix4().makeTranslation(
				modelTranslation.x,	modelTranslation.y, modelTranslation.z );

		var rotationMatX =
			new THREE.Matrix4().makeRotationX(
				modelRotation.x * THREE.Math.DEG2RAD );

		var rotationMatY =
			new THREE.Matrix4().makeRotationY(
				modelRotation.y * THREE.Math.DEG2RAD );

		var modelMatrix = new THREE.Matrix4().
				premultiply( rotationMatY ).
				premultiply( rotationMatX ).
				premultiply( translationMat );

		return modelMatrix;

	}

	// A function to compute a view matrix based on the current state
	function computeViewTransform( state ) {

		var upVector = new THREE.Vector3( 0, 1, 0 );

		var viewerPosition = state.viewerPosition;

		var viewerTarget = state.viewerTarget;

		var translationMat
			= new THREE.Matrix4().makeTranslation(
				- viewerPosition.x, - viewerPosition.y, - viewerPosition.z );

		var z_c = new THREE.Vector3().
			subVectors( viewerPosition, viewerTarget ).normalize();

		var x_c = new THREE.Vector3().
			crossVectors( upVector, z_c ).normalize();

		var y_c = new THREE.Vector3().crossVectors( z_c, x_c );

		var rotationMat =
			new THREE.Matrix4().makeBasis( x_c, y_c, z_c ).transpose();

		return new THREE.Matrix4().
			premultiply( translationMat ).premultiply( rotationMat );

	}

	// A function to compute a perspective projection matrix based on the
	// current state
	function computePerspectiveTransform(
		left, right, top, bottom, clipNear, clipFar ) {

		return new THREE.Matrix4().
			makePerspective( left, right, top, bottom, clipNear, clipFar );

	}

	// Update the model/view/projection matrices based on the current state
	// This function is called in every frame.
	//
	// INPUT
	// state: the state object of StateController
	function update( state ) {

		// Compute model matrix
		this.modelMat.copy( computeModelTransform( state ) );

		// Compute view matrix
		this.viewMat.copy( computeViewTransform( state ) );

		// Compute projection matrix
		var right = ( dispParams.canvasWidth * dispParams.pixelPitch / 2 )
			* ( state.clipNear / dispParams.distanceScreenViewer );

		var left = - right;

		var top = ( dispParams.canvasHeight * dispParams.pixelPitch / 2 )
			* ( state.clipNear / dispParams.distanceScreenViewer );

		var bottom = - top;

		this.projectionMat.copy( computePerspectiveTransform(
			left, right, top, bottom, state.clipNear, state.clipFar ) );

	};



	/* Expose as public functions */
	
	this.computeModelTransform = computeModelTransform;
	
	this.computeViewTransform = computeViewTransform;
	
	this.computePerspectiveTransform = computePerspectiveTransform;
	
	this.update = update;

};
