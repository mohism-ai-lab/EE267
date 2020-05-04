/**
 * @file Class for a foveated renderer
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * DofRenderer
 *
 * @class FoveatedRenderer
 * @classdesc Class for foveated rendering.
 * This class should be used for adding some post effects on a pre-rendered scene.
 *
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {DisplayParameters} dispParams    display parameters
 */
var FoveatedRenderer = function ( webglRenderer, dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;


	// Set up a render target (a.k.a. frame buffer object in WebGL/OpenGL
	this.renderTarget = new THREE.WebGLRenderTarget(
		dispParams.canvasWidth, dispParams.canvasHeight );


	var camera = new THREE.Camera();

	var scene = new THREE.Scene();

	// angle per pixel in [degree]
	var pixelVA = computePixelVA(
		dispParams.pixelPitch, dispParams.distanceScreenViewer );

	// Eccentricity angle at which a 4x reduction in resolution is imperceivable

    var e1 = computeEcc(4*2*pixelVA);
	// Eccentricity angle at which a 8x reduction in resolution is imperceivable
    var e2 = computeEcc(8*2*pixelVA);
    //computeEcc(8*2*this.pixelVA);
	var material = new THREE.RawShaderMaterial( {

		uniforms: {

			textureMap: { value: this.renderTarget.texture },

			windowSize: { value: new THREE.Vector2(
				dispParams.canvasWidth, dispParams.canvasHeight ) },

			// Gaze position in [px]
			gazePosition: { value: new THREE.Vector2() },

			// Gaussian kernel 1
			middleBlurKernel: { value: [ 0.0625, 0.2500, 0.3750, 0.2500, 0.0625 ] },

			// Gaussian kernel 2
			outerBlurKernel: { value: [ 0.0039, 0.0312, 0.1094, 0.2188,
				0.2734, 0.2188, 0.1094, 0.0312, 0.0039 ] },

			e1: { value: e1 },

			e2: { value: e2 },

			pixelVA: { value: pixelVA },

		},

		vertexShader: $( "#vShaderFoveated" ).text(),

		fragmentShader: $( "#fShaderFoveated" ).text(),

	} );


	// THREE.PlaneBufferGeometry( 2, 2 ) creates four vertices (-1,1,0),
	// (1,1,0),(-1,-1,0), (1,-1,0), which are position attributes. In addition,
	// it has texture coordinates (0,1), (1,1), (0,0), (1,0), which are uv
	// attributes. Check it in console to see what's stored in "mesh".
	var mesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 2, 2 ), material );

	scene.add( mesh );



	/* Functions */

	// A function to computes the visual angle per pixel
	//
	// INPUT
	// pixelPitch: pixel pitch of your monitor in [mm]
	// distanceScreenViewer: distance between the viewer and the monitor
	//
	// OUTPUT
	// visual angle per pixel in [degree]
	function computePixelVA( pixelPitch, distanceScreenViewer ) {
        var angle = 2*Math.atan(pixelPitch/(2*distanceScreenViewer))*360/(2*Math.PI)
        return angle;

	}

	// A function to computes the eccentricity corresponding to a given
	// minimum angle of resolution in deg/cycle
	//
	// INPUT
	//  mar: Minimum angle of resolution in deg/cycle
	//
	// OUTPUT
	//  eccentricity
	function computeEcc( mar ) {
        var m = 0.0275;
        var w_0 = 1/48;
        //eccen = (w-w_0)/m
        return (mar - w_0)/m;
	}

	// Perform rendering
	//
	// INPUT
	// state: the state variable in StateController
	function render( state ) {

		var gazePosition = state.gazePosition;

		material.uniforms.gazePosition.value.set( gazePosition.x, gazePosition.y );

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

	this.computePixelVA = computePixelVA;

	this.computeEcc = computeEcc;

	this.render = render;

	this.e1 = e1;

	this.e2 = e2;

};
