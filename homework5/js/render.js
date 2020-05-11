/**
 * @file EE267 Virtual Reality
 * Homework 5
 * Orientation Tracking with IMUs Arduino Programming
 *
 * In our homework, we heavily rely on THREE.js library for rendering.
 * THREE.js is a wonderful library to render a complicated scene without
 * cumbersome raw WebGL/OpenGL programming related to GPU use. Furthermore,
 * it also hides most of the math of computer graphics to allow designers to
 * focus on the scene creation. However, this homework does not use such
 * capabilities. We will compute them manually to understand the mathematics
 * behind the rendering pipeline!
 *
 * Instructor: Gordon Wetzstein <gordon.wetzstein@stanford.edu>
 *
 * The previous C++/OpenGL version was developed by Robert Konrad in 2016, and
 * the JavaScript/WebGL version was developed by Hayato Ikoma in 2017.
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 * This version uses Three.js (r115), stats.js (r17) and jQuery (3.2.1).
 */

// Global variables to control the rendering mode
const STEREO_MODE = 0;
const STEREO_UNWARP_MODE = 1;

var renderingMode = STEREO_UNWARP_MODE;


// Set up display parameters.
// The display parameters are hard-coded in the class since all teams have
// the same HMD.
var dispParams = new DisplayParameters();


// Create an instance for Javascript performance monitor.
// In our class, we would like to visualize the number of frames rendered
// in every second. For this purpose, stats.js is a handy tool to achieve it.
// https://github.com/mrdoob/stats.js/
var stats = new Stats();

// Add a DOM element of the performance monitor to HTML.
$( ".renderCanvas" ).prepend( stats.dom );


// Create a THREE's WebGLRenderer instance.
// Since we are not going to use stencil and depth buffers in this
// homework, those buffers are turned off. These two buffers are commonly
// used for more advanced rendering.
var webglRenderer = new THREE.WebGLRenderer( {
	antialias: false,
	stencil: false,
	depth: true,
} );


// Add a DOM element of the renderer to HTML.
$( ".renderCanvas" ).prepend( webglRenderer.domElement );


// Set the size of the renderer based on the current window size.
webglRenderer.setSize( dispParams.canvasWidth, dispParams.canvasHeight );


// add teapots with different shaders
var teapots = [];

var teapot1 =
	new Teapot( new THREE.Vector3( - 500, 0, 0 ),
		$( "#vShaderMultiPhong" ).text(),
		$( "#fShaderMultiPhong" ).text() );

teapots.push( teapot1 );

var teapot2 =
	new Teapot( new THREE.Vector3( 0, - 350, 100 ),
		$( "#vShaderMultiPhong" ).text(),
		$( "#fShaderMultiPhong" ).text() );

teapots.push( teapot2 );


var teapot3 =
	new Teapot( new THREE.Vector3( 500, - 200, - 130 ),
		$( "#vShaderMultiPhong" ).text(),
		$( "#fShaderMultiPhong" ).text() );

teapots.push( teapot3 );

var teapot4 =
	new Teapot( new THREE.Vector3( 0, 300, - 200 ),
		$( "#vShaderMultiPhong" ).text(),
		$( "#fShaderMultiPhong" ).text() );

teapots.push( teapot4 );



// Create an instance of our StateCoontroller class.
// By using this class, we store the mouse movement to change the scene to be
// rendered.
var sc = new StateController( dispParams );


// Set the teapots to the renderer
var standardRenderer =
	new StandardRenderer( webglRenderer, teapots, dispParams );

var stereoUnwarpRenderer =
	new StereoUnwarpRenderer( webglRenderer, dispParams );


// Instantiate our MVPmat class
var mat = new MVPmat( dispParams );


// Start rendering!
animate();



// animate
// This function is the main function to render the scene repeatedly.
//
// Note:
// This function uses some global variables.
//
// Advanced note:
// requestAnimationFrame() is a WebAPI which is often used to perform animation.
// Importantly, requestAnimationFrame() is asynchronous, which makes this
// rendering loop not recursive. requestAnimationFrame immediately returns, and
// the following codes are executed continuously. After a certain amount of
// time, which is determined by a refresh rate of a monitor, the passed callback
// function is executed. In addition, when the window is not displayed (i.e.
// another tab of your browser is displayed), requestAnimationFrame
// significantly reduces its refresh rate to save computational resource and
// battery.
//
// If you are interested, please check out the documentation of
// requestAnimationFrame().
// https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
function animate() {

	requestAnimationFrame( animate );

	// Start performance monitoring
	stats.begin();

	// update model/view/projection matrices
	mat.update( sc.state );

	if ( renderingMode === STEREO_MODE ) {

		if ( webglRenderer.autoClear ) webglRenderer.clear();

		webglRenderer.setScissorTest( true );

		// Render for the left eye on the left viewport
		webglRenderer.setScissor(
			0, 0, dispParams.canvasWidth / 2, dispParams.canvasHeight );

		webglRenderer.setViewport(
			0, 0, dispParams.canvasWidth / 2, dispParams.canvasHeight );

		standardRenderer.render(
			sc.state, mat.modelMat, mat.stereoViewMat.L, mat.stereoProjectionMat.L );

		// Render for the right eye on the right viewport
		webglRenderer.setScissor(
			 dispParams.canvasWidth / 2, 0,
			 dispParams.canvasWidth / 2, dispParams.canvasHeight );

		webglRenderer.setViewport(
			dispParams.canvasWidth / 2, 0,
			dispParams.canvasWidth / 2, dispParams.canvasHeight );

		standardRenderer.render(
			sc.state, mat.modelMat, mat.stereoViewMat.R, mat.stereoProjectionMat.R );

		webglRenderer.setScissorTest( false );

	} else if ( renderingMode === STEREO_UNWARP_MODE ) {

		// Render for the left eye on frame buffer object
		standardRenderer.renderOnTarget( stereoUnwarpRenderer.renderTargetL,
			sc.state, mat.modelMat, mat.stereoViewMat.L, mat.stereoProjectionMat.L );

		// Render for the right eye on frame buffer object
		standardRenderer.renderOnTarget( stereoUnwarpRenderer.renderTargetR,
			sc.state, mat.modelMat, mat.stereoViewMat.R, mat.stereoProjectionMat.R );

		stereoUnwarpRenderer.render( sc.state );

	}

	// End performance monitoring
	stats.end();

	// Display parameters used for rendering.
	sc.display();

}
