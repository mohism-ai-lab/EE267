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

	this.anaglyphViewMat =
		{ L: new THREE.Matrix4(), R: new THREE.Matrix4() };

	this.anaglyphProjectionMat =
		{ L: new THREE.Matrix4(), R: new THREE.Matrix4() };


	/* Functions */

	// A function to compute a model transform matrix
	function computeModelTransform( modelRotation ) {

		var rotationMatX =
			new THREE.Matrix4().makeRotationX(
				modelRotation.x * THREE.Math.DEG2RAD );

		var rotationMatY =
			new THREE.Matrix4().makeRotationY(
				modelRotation.y * THREE.Math.DEG2RAD );

		var modelMatrix = new THREE.Matrix4().
			premultiply( rotationMatY ).
			premultiply( rotationMatX );

		return modelMatrix;

	}

	// A function to compute a model matrix based on the current state
	//
	// NOTE
	// Please modify this function in a way where halfIpdShift = 0 works for non-
	// stereo rendering.
	//
	// INPUT
	// state: state of StateController
	// halfIpdShift: half of the interpupillary distance
	//              (positive for left eye, negative for right eye
	//               zero for non-stereo rendering)
	function computeViewTransform( state, halfIpdShift ) {

		/* TODO (2.4.1) View Matrix Computation - Update this function! */

		var viewerPosition = state.viewerPosition;

		var viewerTarget = state.viewerTarget;

		var viewerUp = new THREE.Vector3( 0, 1, 0 );
        var shiftIPD =  new THREE.Matrix4().makeTranslation(halfIpdShift,0.0,0.0);

		var translationMat

	   = new THREE.Matrix4().makeTranslation(
             - viewerPosition.x,
			 - viewerPosition.y,
			 - viewerPosition.z );

        var rotationMat = new THREE.Matrix4().lookAt( viewerPosition, viewerTarget, viewerUp ).transpose();

        return new THREE.Matrix4().premultiply(shiftIPD).premultiply( translationMat ).premultiply( rotationMat );

	}

	// A function to compute a perspective projection matrix based on the
	// current state
	//
	// NOTE
	// The function you implemented in HW1 is equivalent to makePerspective().
	//
	// INPUT
	// Notations for the input is the same as in the class.
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
	// renderingMode: this variable decides which matrices are updated
	function update( state, renderingMode ) {

		/* Compute model matrix */
		this.modelMat.copy( computeModelTransform( state.modelRotation ) );

		if ( renderingMode === STANDARD_MODE
			|| renderingMode === FOVEATED_MODE
			|| renderingMode === DOF_MODE ) {

			// Compute view matrix
			this.viewMat.copy( computeViewTransform( state, 0 ) );

			// Compute projection matrix
			var right =
				( dispParams.canvasWidth * dispParams.pixelPitch / 2 )
					* ( state.clipNear / dispParams.distanceScreenViewer );

			var left = - right;

			var top =
				( dispParams.canvasHeight * dispParams.pixelPitch / 2 )
					* ( state.clipNear / dispParams.distanceScreenViewer );

			var bottom = - top;

			this.projectionMat.copy( computePerspectiveTransform(
				left, right, top, bottom, state.clipNear, state.clipFar ) );


		} else if ( renderingMode === ANAGLYPH_MODE ) {

			// Compute view matrix
			this.anaglyphViewMat.L =
                computeViewTransform( state, dispParams.ipd / 2 );

			this.anaglyphViewMat.R =
                computeViewTransform( state, - dispParams.ipd / 2 );

			/* TODO (2.4.2) Projection Matrix Computation */

			// Compute projection matrix
//            var right =
//                ( dispParams.canvasWidth * dispParams.pixelPitch + Math.abs(dispParams.ipd))
//                    * ( state.clipNear / (2*dispParams.distanceScreenViewer) );

			var right =
                ( dispParams.canvasWidth * dispParams.pixelPitch + dispParams.ipd)
                    * ( state.clipNear / (2*dispParams.distanceScreenViewer) );

            var left = -( dispParams.canvasWidth * dispParams.pixelPitch - dispParams.ipd)
                    * ( state.clipNear / (2*dispParams.distanceScreenViewer) );

			var top =
				( dispParams.canvasHeight * dispParams.pixelPitch / 2 )
					* ( state.clipNear / dispParams.distanceScreenViewer );

			var bottom = - top;

			this.anaglyphProjectionMat.L = computePerspectiveTransform(
				left, right, top, bottom, state.clipNear, state.clipFar );

			this.anaglyphProjectionMat.R = computePerspectiveTransform(
                -right, -left, top, bottom, state.clipNear, state.clipFar );

		}

	}



	/* Expose as public functions */

	this.computeModelTransform = computeModelTransform;

	this.computeViewTransform = computeViewTransform;

	this.computePerspectiveTransform = computePerspectiveTransform;

	this.update = update;

};
