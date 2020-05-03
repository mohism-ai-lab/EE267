/**
 * @file Class for a anaglyph renderer
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * AnaglyphRenderer
 *
 * @class AnaglyphRenderer
 * @classdesc Class for anaglyph rendering.
 * This class should be used for adding some post effects on a pre-rendered
 * scene.
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {DisplayParameters} dispParams    display parameters
 */
var AnaglyphRenderer = function ( webglRenderer, dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;


	// frame buffer object for left eye
	this.renderTargetL = new THREE.WebGLRenderTarget(
		dispParams.canvasWidth, dispParams.canvasHeight );

	// frame buffer object for right eye
	this.renderTargetR = new THREE.WebGLRenderTarget(
		dispParams.canvasWidth, dispParams.canvasHeight );


	var camera = new THREE.Camera();

	var scene = new THREE.Scene();

	var material = new THREE.RawShaderMaterial( {

		uniforms: {

			textureMapL: { value: this.renderTargetL.texture },

			textureMapR: { value: this.renderTargetR.texture },

		},

		vertexShader: $( "#vShaderAnaglyph" ).text(),

		fragmentShader: $( "#fShaderAnaglyph" ).text()

	} );


	// THREE.PlaneBufferGeometry( 2, 2 ) creates four vertices (-1,1,0),
	// (1,1,0),(-1,-1,0), (1,-1,0), which are position attributes. In addition,
	// it has texture coordinates (0,1), (1,1), (0,0), (1,0), which are uv
	// attributes.
	var mesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ), material );

	scene.add( mesh );

	function render() {

		webglRenderer.setRenderTarget( null );

		webglRenderer.render( scene, camera );

	}



	/* Event listeners */

	// Automatic update of the renderer size when the window is resized.
	$( window ).resize( function () {

		_this.renderTargetL.setSize(
			dispParams.canvasWidth, dispParams.canvasHeight );

		_this.renderTargetR.setSize(
			dispParams.canvasWidth, dispParams.canvasHeight );

	} );



	/* Expose as public functions */

	this.render = render;

};
