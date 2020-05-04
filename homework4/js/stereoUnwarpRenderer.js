/**
 * @file Class for a stereo unwarp renderer
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * StereoUnwarpRenderer
 *
 * @class StereoUnwarpRenderer
 * @classdesc Class for stereo unwarp rendering.
 * This class should be used for adding some post effects on a pre-rendered scene.
 *
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {DisplayParameters} dispParams    display parameters
 */
var StereoUnwarpRenderer = function ( webglRenderer, dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;

	var camera = new THREE.Camera();

	var sceneL = new THREE.Scene();

	var sceneR = new THREE.Scene();

	var centerCoord = computeCenterCoord( dispParams );


	// Left eye
	this.renderTargetL = new THREE.WebGLRenderTarget(
		dispParams.canvasWidth, dispParams.canvasHeight );

	var materialL = setUnwarpMaterial( this.renderTargetL, centerCoord.L );

	var meshL = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ), materialL );

	sceneL.add( meshL );


	// Right eye
	this.renderTargetR = new THREE.WebGLRenderTarget(
		dispParams.canvasWidth, dispParams.canvasHeight );

	var materialR = setUnwarpMaterial( this.renderTargetR, centerCoord.R );

	var meshR = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ), materialR );

	sceneR.add( meshR );



	/* Functions */

	function setUnwarpMaterial( renderTarget, centerCoord ) {

		var material = new THREE.RawShaderMaterial( {

			uniforms: {

				map: { value: renderTarget.texture },

				centerCoordinate: { value: centerCoord },

				K: { value: new THREE.Vector2() },

				distLensScreen: { value: dispParams.distLensScreen },

				viewportSize: { value: new THREE.Vector2(
					dispParams.pixelPitch * dispParams.canvasWidth / 2,
					dispParams.pixelPitch * dispParams.canvasHeight ) },

			},

			vertexShader: $( "#vShaderUnwarp" ).text(),

			fragmentShader: $( "#fShaderUnwarp" ).text()

		} );

		return material;

	}

	function render( state ) {

		// Update the uniforms for the lens distortion parameters
		materialL.uniforms.K.value = state.lensDistortion;

		materialR.uniforms.K.value = state.lensDistortion;

		webglRenderer.setRenderTarget( null );

		webglRenderer.setScissorTest( true );

		// Render for left eye on the left side
		webglRenderer.setScissor(
			0, 0, dispParams.canvasWidth / 2, dispParams.canvasHeight );

		webglRenderer.setViewport(
			0, 0, dispParams.canvasWidth / 2, dispParams.canvasHeight );

		webglRenderer.render( sceneL, camera );


		// Render for right eye on the right side
		webglRenderer.setScissor(
			dispParams.canvasWidth / 2, 0,
			dispParams.canvasWidth / 2, dispParams.canvasHeight );

		webglRenderer.setViewport(
			dispParams.canvasWidth / 2, 0,
			dispParams.canvasWidth / 2, dispParams.canvasHeight );

		webglRenderer.render( sceneR, camera );


		webglRenderer.setScissorTest( false );

	}


	// A function to compute frustum parameters for stereo rendering.
	// Returns top/bottom/left/right values for left and right eyes.
	//
	// OUTPUT:
	// (L) center coordinates for the left eye as THREE.Vector2 (in texture (u,v) coordinates)
	// (R) center coordinates for the right eye as THREE.Vector2 (in texture (u,v) coordinates)
	//
	// NOTE:
	// TODO (2.2.1) Lens Distortion Center
	// The default values are wrong. Replace them.
	// All the parameters you need for your calculations are found in the function arguments.
	function computeCenterCoord( dispParams ) {

        var centerCoordL = new THREE.Vector2(1.0 - dispParams.ipd / (dispParams.pixelPitch*dispParams.canvasWidth), 0.5);
        var centerCoordR = new THREE.Vector2(dispParams.ipd / (dispParams.canvasWidth * dispParams.pixelPitch), 0.5);

		return { L: centerCoordL, R: centerCoordR };

	}

	/* Event listeners */

	// Automatic update of the renderer size when the window is resized.
	$( window ).resize( function () {

		_this.renderTargetL.setSize(
			dispParams.canvasWidth, dispParams.canvasWidth );

		_this.renderTargetR.setSize(
			dispParams.canvasWidth, dispParams.canvasWidth );

	} );



	/* Expose as public functions */

	this.setUnwarpMaterial = setUnwarpMaterial;

	this.computeCenterCoord = computeCenterCoord;

	this.render = render;

};
