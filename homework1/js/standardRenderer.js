/**
 * @file Class for a standard renderer
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * StandardRenderer
 *
 * @class StandardRenderer
 * @classdesc Class for standard rendering.
 *
 * OpenGL / WebGL use special variables called "uniform variables" and
 * "attribute* variables." Uniform variables have the same values for all
 * vertices/fragments. For example, model/view/projection matrices are uniform
 * variables. On the other hand, attribute variables are different among
 * vertices/fragments. For example, the position are different for all
 * vertices/fragments.
 *
 * THREE.Scene and THREE.Camera are required for rendering with Three.js.
 * THREE.Camera instance is generally used for computing and parsing view
 * and projection matrices automatically. However, in our course material,
 * we are computing the matrices by ourselves and attaching them to each
 * Teapot instance as uniforms. Here, THREE.Scene is used for parsing the
 * position of vertices, background color, etc.
 *
 * If you are interested in a general introduction of Three.js, David Lyons's
 * slides are a helpful material to understand the general usage of Three.js.
 * https://github.com/davidlyons/frontporch
 * In our StandardRenderer class, we add the positions of vertex of teapots
 * to THREE.Scene to use them in vertex shaders and define a function to perform
 * rendering after parsing all uniforms per each rendering.
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {Array.<Teapot>} teapots       array of Teapot
 * @param  {DisplayParameters} dispParams    display parameters
 */
var StandardRenderer = function ( webglRenderer, teapots, dispParams ) {

	// Alias for accessing this from a closure
	var _this = this;


	var camera = new THREE.Camera();

	camera.matrixAutoUpdate = false;

	var scene = new THREE.Scene();


	// add an axis object in the scene
	var axisObject = new THREE.AxesHelper( 100 );

	axisObject.position.set( 0, 0, 0 );

	scene.add( axisObject );


	// add a grid object in the scene
	var grid = new THREE.GridHelper( 1000, 30, "white", "white" );

	grid.position.set( 0, - 50, 0 );

	scene.add( grid );


	// set the scene's background
	scene.background = new THREE.Color( "gray" );

	// set up three teapots in the scene
	var meshes = [];

	for ( var i = 0; i < teapots.length; i ++ ) {

		var material = new THREE.RawShaderMaterial( {

			uniforms: {

				projectionMat: { value: new THREE.Matrix4() },

				modelViewMat: { value: new THREE.Matrix4() },

			},

			wireframe: true,

			vertexShader: teapots[ i ].vertexShader,

			fragmentShader: teapots[ i ].fragmentShader,

		} );

		var mesh = new THREE.Mesh( teapots[ i ].geometry, material );

		meshes.push( mesh );

		scene.add( mesh );

	}


	/* Functions */

	// a function to update all uniforms of Teapot
	function updateUniforms( modelMat, viewMat, projectionMat ) {

		for ( var i = 0; i < teapots.length; i ++ ) {

			// Translate a teapot based on its initial position.
			var positionTranslation = new THREE.Matrix4().
				makeTranslation( teapots[ i ].position.x, teapots[ i ].position.y, teapots[ i ].position.z );

			var _modelMat =
				new THREE.Matrix4().multiplyMatrices( positionTranslation, modelMat );

			var modelViewMat =
				new THREE.Matrix4().multiplyMatrices( viewMat, _modelMat );

			// Attach the computed model/view/projection matrices to the
			// shaders.
			meshes[ i ].material.uniforms.modelViewMat.value = modelViewMat;

			meshes[ i ].material.uniforms.projectionMat.value = projectionMat;

		}

		// This part is for rendering the axis and grid objects with THREE's
		// rendering pipeline by using the view and projection matrices
		// computed by ourselves. This part is not used for rendering teapots.
		// Please ignore this part for doing homework.
		camera.matrixWorld.copy( new THREE.Matrix4().getInverse( viewMat ) );

		camera.projectionMatrix.copy( projectionMat );

	}

	// Perform rendering after updating uniforms
	//
	// INPUT
	// modelMat: model matrix
	// viewMat: view matrix
	// projectionMat: projection matrix
	function render( modelMat, viewMat, projectionMat ) {

		updateUniforms( modelMat, viewMat, projectionMat );

		// Render the scene!
		// This part performs all renderings scheduled above on GPU.
		webglRenderer.render( scene, camera );

	}



	/* Event listeners */

	// Automatic update of the renderer size when the window is resized.
	$( window ).resize( function () {

		webglRenderer.setSize( dispParams.canvasWidth, dispParams.canvasHeight );

	} );



	/* Expose as public functions */

	this.updateUniforms = updateUniforms;

	this.render = render;

};
