/**
 * @file EE267 Virtual Reality
 * Homework 3
 * Foveated Rendering, Depth of Field, Stereo Rendering, Anaglyph 3D
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
// Set up display parameters.
// Please use the parameters of your own environment.
// Length of the monitor's diagonal in [inch]
// (ex. Macbook Pro 13" => 13.3 inch
//      Macbook Pro 15" => 15.4 inch
var screenDiagonal = 27;

// Distance between the viewer and the monitor in [mm]
var distanceScreenViewer = 800.0;

var dispParams = new DisplayParameters( distanceScreenViewer, screenDiagonal );

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
	antialias: true,
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
	new Teapot( new THREE.Vector3( - 70, 10, 0 ),
		$( "#vShaderMultiPhong" ).text(),
		$( "#fShaderMultiPhong" ).text() );

teapots.push( teapot1 );

var teapot2 =
	new Teapot( new THREE.Vector3( 0, - 30, 100 ),
		$( "#vShaderMultiPhong" ).text(),
		$( "#fShaderMultiPhong" ).text() );

teapots.push( teapot2 );


var teapot3 =
	new Teapot( new THREE.Vector3( 70, - 10, - 130 ),
		$( "#vShaderMultiPhong" ).text(),
		$( "#fShaderMultiPhong" ).text() );

teapots.push( teapot3 );

var teapot4 =
	new Teapot( new THREE.Vector3( 0, 60, - 200 ),
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

var foveatedRenderer =
	new FoveatedRenderer( webglRenderer, dispParams );

var dofRenderer =
	new DofRenderer( webglRenderer, dispParams );

var anaglyphRenderer =
	new AnaglyphRenderer( webglRenderer, dispParams );


// Instantiate our MVPmat class
var mat = new MVPmat( dispParams );



// Global variables to control the rendering mode
const STANDARD_MODE = 0;
const FOVEATED_MODE = 1;
const DOF_MODE = 2;
const ANAGLYPH_MODE = 3;

// Select which mode for rendering
// This is controlled by clicks on the button or the keyboard
// See utils.js
var renderingMode = STANDARD_MODE;


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

	// Draw the gaze position (see utils.js)
	drawGaze( sc.state.gazePosition, dispParams );

	// Start performance monitoring
	stats.begin();

	// update model/view/projection matrices
	mat.update( sc.state, renderingMode );

	if ( renderingMode === STANDARD_MODE ) {

		// One rendering pass
		standardRenderer.render(
			sc.state, mat.modelMat, mat.viewMat, mat.projectionMat );

	} else if ( renderingMode === FOVEATED_MODE ) {

		// First rendering pass (into FBO)
		standardRenderer.renderOnTarget(
			foveatedRenderer.renderTarget, sc.state,
			mat.modelMat, mat.viewMat, mat.projectionMat );

		// Second rendering pass (onto screen)
		foveatedRenderer.render( sc.state );

	} else if ( renderingMode === DOF_MODE ) {

		// First rendering pass (into FBO)
		standardRenderer.renderOnTarget(
			dofRenderer.renderTarget,	sc.state,
			mat.modelMat, mat.viewMat, mat.projectionMat );

		// Second rendering pass (onto screen)
		dofRenderer.render( sc.state, mat.projectionMat );

	} else if ( renderingMode === ANAGLYPH_MODE ) {

		// First rendering pass (left eye into left FBO)
		standardRenderer.renderOnTarget(
			anaglyphRenderer.renderTargetL,	sc.state,
			mat.modelMat, mat.anaglyphViewMat.L, mat.anaglyphProjectionMat.L );

		// Second rendering pass (right eye into right FBO)
		standardRenderer.renderOnTarget(
			anaglyphRenderer.renderTargetR,	sc.state,
			mat.modelMat, mat.anaglyphViewMat.R, mat.anaglyphProjectionMat.R );

		// Third rendering pass (onto screen)
		anaglyphRenderer.render();

	}

	// End performance monitoring
	stats.end();

	// Display parameters used for rendering.
	sc.display();

}
