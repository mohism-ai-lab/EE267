/**
 * @file Class for a DoF renderer
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * DofRenderer
 *
 * @class DofRenderer
 * @classdesc Class for DoF rendering.
 * This class should be used for adding some post effects on a pre-rendered scene.
 *
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {DisplayParameters} dispParams    display parameters
 */
var DofRenderer = function ( webglRenderer, dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;


	// Set up a render target (a.k.a. frame buffer object in WebGL/OpenGL
	this.renderTarget = new THREE.WebGLRenderTarget(
		dispParams.canvasWidth, dispParams.canvasHeight );

	// Set up a depth buffer on the render target
	this.renderTarget.depthTexture = new THREE.DepthTexture();


	var camera = new THREE.Camera();

	var scene = new THREE.Scene();

	var material = new THREE.RawShaderMaterial( {

		uniforms: {

			textureMap: { value: this.renderTarget.texture },

			depthMap: { value: this.renderTarget.depthTexture },

			projectionMat: { value: new THREE.Matrix4() },

			invProjectionMat: { value: new THREE.Matrix4() },

			windowSize: { value: new THREE.Vector2(
				dispParams.canvasWidth, dispParams.canvasHeight ) },

			// Gaze position in [px]
			gazePosition: { value: new THREE.Vector2() },

			pupilDiameter: { value: dispParams.pupilDiameter },

			pixelPitch: { value: dispParams.pixelPitch },

		},

		vertexShader: $( "#vShaderDof" ).text(),

		fragmentShader: $( "#fShaderDof" ).text(),

	} );


	// THREE.PlaneBufferGeometry( 2, 2 ) creates four vertices (-1,1,0),
	// (1,1,0),(-1,-1,0), (1,-1,0), which are position attributes. In addition,
	// it has texture coordinates (0,1), (1,1), (0,0), (1,0), which are uv
	// attributes. Check it in console to see what's stored in "mesh".
	var mesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ), material );

	scene.add( mesh );

	// Perform rendering
	//
	// INPUT
	// state: the state object of StateController
	// projectionMat: projection matrix
	function render( state, projectionMat ) {

		var gazePosition = state.gazePosition;

		material.uniforms.gazePosition.value.set( gazePosition.x, gazePosition.y );

		material.uniforms.projectionMat.value.copy( projectionMat );

		material.uniforms.invProjectionMat.value.copy(
			new THREE.Matrix4().getInverse( projectionMat ) );

		webglRenderer.setRenderTarget( null );

		webglRenderer.render( scene, camera );

	}



	/* Event listeners */

	// Automatic update of the renderer size when the window is resized.
	$( window ).resize( function () {

		_this.renderTarget.setSize(
			dispParams.canvasWidth, dispParams.canvasHeight );

		material.uniforms.windowSize.value.set(
			dispParams.canvasWidth, dispParams.canvasHeight );

	} );



	/* Expose as public functions */

	this.render = render;

};
