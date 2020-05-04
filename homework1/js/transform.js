
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

	// A model matrix
	this.modelMat = new THREE.Matrix4();

	// A view matrix
	this.viewMat = new THREE.Matrix4();

	// A projection matrix
	this.projectionMat = new THREE.Matrix4();


	var topViewMat = new THREE.Matrix4().set(
		1, 0, 0, 0,
		0, 0, - 1, 0,
		0, 1, 0, - 1500,
		0, 0, 0, 1 );

	/* Functions */

	// A function to compute a model matrix based on the current state
	//
	// INPUT
	// state: state of StateController
	function computeModelTransform( state ) {

        var translation = new THREE.Matrix4().makeTranslation(state.modelTranslation.x, state.modelTranslation.y, state.modelTranslation.z);
        var rotation_Y = new THREE.Matrix4().makeRotationY(state.modelRotation.y*Math.PI / 180);
        var rotation_X = new THREE.Matrix4().makeRotationX(state.modelRotation.x * Math.PI/180);
        var transformation = new THREE.Matrix4().multiplyMatrices(rotation_X, rotation_Y);
        transformation = transformation.multiplyMatrices(transformation, translation);
        return transformation;
	}

	// A function to compute a view matrix based on the current state
	//
	// NOTE
	// Do not use lookAt().
	//
	// INPUT
	// state: state of StateController
	function computeViewTransform( state ) {

        var eye = state.viewerPosition;
        var center = state.viewerTarget;
        var up = new THREE.Vector3(eye.x, 800, eye.z);

        var z_c =  new THREE.Vector3(eye.x - center.x, eye.y - center.y, eye.z - center.z).normalize();
        var x_c = new THREE.Vector3().crossVectors(up, z_c).normalize();
        var y_c = new THREE.Vector3().crossVectors(z_c, x_c);
        var T_eye = new THREE.Matrix4().set(
                    1, 0, 0, -eye.x,
                    0, 1, 0, -eye.y,
                    0, 0, 1, - eye.z,
                    0, 0, 0, 1 );
        var R = new THREE.Matrix4().set(
                    x_c.x, x_c.y, x_c.z, 0,
                    y_c.x, y_c.y, y_c.z, 0,
                    z_c.x, z_c.y, z_c.z, 0,
                    0, 0, 0, 1 );
        
        return new THREE.Matrix4().multiplyMatrices(R,T_eye);

	}

	// A function to compute a perspective projection matrix based on the
	// current state
	//
	// NOTE
	// Do not use makePerspective().
	//
	// INPUT
	// Notations for the input is the same as in the class.
	function computePerspectiveTransform(
		left, right, top, bottom, clipNear, clipFar ) {
        

		return new THREE.Matrix4().set(
			2*clipNear/(right-left), 0, (right+left)/(right-left), 0,
			0, 2*clipNear/(top - bottom), (top+bottom)/(top-bottom), 0,
			0, 0, -(clipFar+clipNear)/(clipFar- clipNear), -2*(clipFar*clipNear)/(clipFar- clipNear),
			0, 0, - 1.0, 0 );
	}

	// A function to compute a orthographic projection matrix based on the
	// current state
	//
	// NOTE
	// Do not use makeOrthographic().
	//
	// INPUT
	// Notations for the input is the same as in the class.
	function computeOrthographicTransform(
		left, right, top, bottom, clipNear, clipFar ) {

		return new THREE.Matrix4().set(
            2/(right-left), 0, 0, -(right + left)/(right - left),
            0, 2/(top - bottom), 0, -(top + bottom)/ (top - bottom),
            0, 0, -2/(clipFar - clipNear), -(clipFar + clipNear)/(clipFar - clipNear),
            0, 0, 0, 1 );

	}

	// Update the model/view/projection matrices
	// This function is called in every frame (animate() function in render.js).
	function update( state ) {

		// Compute model matrix
		this.modelMat.copy( computeModelTransform( state ) );

		// Use the hard-coded view and projection matrices for top view
		if ( state.topView ) {

			this.viewMat.copy( topViewMat );

			var right = ( dispParams.canvasWidth * dispParams.pixelPitch / 2 )
				* ( state.clipNear / dispParams.distanceScreenViewer );

			var left = - right;

			var top = ( dispParams.canvasHeight * dispParams.pixelPitch / 2 )
				* ( state.clipNear / dispParams.distanceScreenViewer );

			var bottom = - top;

			this.projectionMat.makePerspective( left, right, top, bottom, 1, 10000 );

		} else {

			// Compute view matrix
			this.viewMat.copy( computeViewTransform( state ) );

			// Compute projection matrix
			if ( state.perspectiveMat ) {

				var right = ( dispParams.canvasWidth * dispParams.pixelPitch / 2 )
				* ( state.clipNear / dispParams.distanceScreenViewer );

				var left = - right;

				var top = ( dispParams.canvasHeight * dispParams.pixelPitch / 2 )
				* ( state.clipNear / dispParams.distanceScreenViewer );

				var bottom = - top;

				this.projectionMat.copy( computePerspectiveTransform(
					left, right, top, bottom, state.clipNear, state.clipFar ) );

			} else {

				var right = dispParams.canvasWidth * dispParams.pixelPitch / 2;

				var left = - right;

				var top = dispParams.canvasHeight * dispParams.pixelPitch / 2;

				var bottom = - top;

				this.projectionMat.copy( computeOrthographicTransform(
					left, right, top, bottom, state.clipNear, state.clipFar ) );

			}

		}

	}



	/* Expose as public functions */

	this.computeModelTransform = computeModelTransform;

	this.computeViewTransform = computeViewTransform;

	this.computePerspectiveTransform = computePerspectiveTransform;

	this.computeOrthographicTransform = computeOrthographicTransform;

	this.update = update;

};
