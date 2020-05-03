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

	var numPointLights = - 1;

	var numDirectionalLights = - 1;

	// This sphere geometry for visualizing the position of point light source.
	// It will be rendered through Three's built-in shader along with the
	// and grid object.
	var sphere = new THREE.SphereGeometry( 1, 15, 10 );

	var pLightSpheres = [];

	// add a grid object in the scene
	var sqGrid = new THREE.GridHelper( 1000, 20, "gray", "gray" );

	sqGrid.position.set( 0, - 100, 0 );

	sqGrid.rotation.y = 45 * THREE.Math.DEG2RAD;

	scene.add( sqGrid );

	// Overlay a plane over the grid for depth of field rendering

	var planeGeometry = new THREE.PlaneGeometry( 1000, 1000, 100, 100 );

	var planeMaterial = new THREE.MeshBasicMaterial( { color: "blanchedalmond", side: THREE.DoubleSide } );

	var plane = new THREE.Mesh( planeGeometry, planeMaterial );

	plane.position.set( 0, - 100.1, 0 );

	plane.rotation.x = 90 * THREE.Math.DEG2RAD;

	plane.rotation.y = 0 * THREE.Math.DEG2RAD;

	plane.rotation.z = 45 * THREE.Math.DEG2RAD;

	scene.add( plane );


	// add a grid object in the scene
	var w = 1000;
	var sqGridBackRight = new THREE.GridHelper( w, 20, "gray", "gray" );

	var x_right = 170;
	var y_right = 0;
	var z_right = - 170;


	sqGridBackRight.position.set( x_right, y_right, z_right );

	sqGridBackRight.rotation.x = 90 * THREE.Math.DEG2RAD;

	sqGridBackRight.rotation.z = 45 * THREE.Math.DEG2RAD;

	scene.add( sqGridBackRight );

	// Overlay a plane over the grid for depth of field rendering
	var planeGeometryBackRight = new THREE.PlaneGeometry( w, w, 10, 10 );

	var planeMaterialBackRight = new THREE.MeshBasicMaterial( { color: "ivory", side: THREE.DoubleSide } );

	var planeBackRight = new THREE.Mesh( planeGeometryBackRight, planeMaterialBackRight );

	planeBackRight.position.set( x_right, y_right, z_right - 1 );

	planeBackRight.rotation.x = 0 * THREE.Math.DEG2RAD;

	planeBackRight.rotation.y = - 45 * THREE.Math.DEG2RAD;

	planeBackRight.rotation.z = 0 * THREE.Math.DEG2RAD;

	scene.add( planeBackRight );


	// add a grid object in the scene
	var sqGridBackLeft = new THREE.GridHelper( w, 20, "gray", "gray" );

	sqGridBackLeft.position.set( - x_right, y_right, z_right );

	sqGridBackLeft.rotation.x = 90 * THREE.Math.DEG2RAD;

	sqGridBackLeft.rotation.z = - 45 * THREE.Math.DEG2RAD;

	scene.add( sqGridBackLeft );

	// Overlay a plane over the grid for depth of field rendering
	var planeGeometryBackLeft = new THREE.PlaneGeometry( w, w, 10, 10 );

	var planeMaterialBackLeft = new THREE.MeshBasicMaterial( { color: "lightgreen", side: THREE.DoubleSide } );

	var planeBackLeft = new THREE.Mesh( planeGeometryBackLeft, planeMaterialBackLeft );

	planeBackLeft.position.set( - x_right, y_right, z_right - 1 );

	planeBackLeft.rotation.x = 0 * THREE.Math.DEG2RAD;

	planeBackLeft.rotation.y = 45 * THREE.Math.DEG2RAD;

	planeBackLeft.rotation.z = 0 * THREE.Math.DEG2RAD;

	scene.add( planeBackLeft );



	// set the scene's background
	scene.background = new THREE.Color( "gray" );

	// set up three teapots in the scene
	var meshes = [];

	for ( var i = 0; i < teapots.length; i ++ ) {

		var material = new THREE.RawShaderMaterial( {

			uniforms: {

				viewMat: { value: new THREE.Matrix4() },

				projectionMat: { value: new THREE.Matrix4() },

				modelViewMat: { value: new THREE.Matrix4() },

				normalMat: { value: new THREE.Matrix3() },

				material: { value: {

					ambient: new THREE.Vector3(),

					diffuse: new THREE.Vector3(),

					specular: new THREE.Vector3(),

					shininess: new THREE.Vector3(),

				}, },

				ambientLightColor: { value: new THREE.Vector3() },

				pointLights: { value: [], properties: {

					position: new THREE.Vector3(),

					color: new THREE.Color(),

				}, },

				directionalLights: { value: [], properties: {

					direction: new THREE.Vector3(),

					color: new THREE.Color(),

				}, },

				attenuation: { value: new THREE.Vector3() },

			},

			vertexShader: replaceNumLights( teapots[ i ].vertexShader, 0, 0 ),

			fragmentShader: replaceNumLights( teapots[ i ].fragmentShader, 0, 0 ),

			side: THREE.DoubleSide,

			shadowSide: THREE.DoubleSide,

		} );

		var mesh = new THREE.Mesh( teapots[ i ].geometry, material );

		meshes.push( mesh );

		scene.add( mesh );

	}



	/* Functions */

	// Update all of the uniforms that are going to be parsed to the GLSL shaders
	//
	// INPUT
	// state: state object of StateController
	// modelMat: model matrix
	// viewMat: view matrix
	// projectionMat: projection matrix
	function updateUniforms(
		state, modelMat, viewMat, projectionMat ) {

		var lights = state.lights;

		for ( var i = 0; i < teapots.length; i ++ ) {

			// Translate a teapot based on its initial position.
			var positionTranslation = new THREE.Matrix4().makeTranslation( teapots[ i ].position.x, teapots[ i ].position.y, teapots[ i ].position.z );

			var _modelMat =
				new THREE.Matrix4().multiplyMatrices( positionTranslation, modelMat );

			var modelViewMat =
				new THREE.Matrix4().multiplyMatrices( viewMat, _modelMat );

			var normalMat = new THREE.Matrix3().getNormalMatrix( modelViewMat );

			// Attach the computed model/view/projection matrices to the shaders.
			meshes[ i ].material.uniforms.viewMat.value = viewMat;

			meshes[ i ].material.uniforms.modelViewMat.value = modelViewMat;

			meshes[ i ].material.uniforms.normalMat.value = normalMat;

			meshes[ i ].material.uniforms.projectionMat.value = projectionMat;

			meshes[ i ].material.uniforms.pointLights.value = lights.pointLights;

			meshes[ i ].material.uniforms.directionalLights.value = lights.directionalLights;

			meshes[ i ].material.uniforms.ambientLightColor.value = lights.ambientLightColor;

			meshes[ i ].material.uniforms.attenuation.value = state.attenuation;

			meshes[ i ].material.uniforms.material.value = state.material;


			// Update the shaders based on the number of existing lights.
			// By setting material.needsUpdate to be true, the updated shaders
			// are recompiled.
			if ( numPointLights !== lights.pointLights.length
				|| numDirectionalLights !== lights.directionalLights.length ) {

				meshes[ i ].material.vertexShader =
					replaceNumLights( teapots[ i ].vertexShader,
						lights.pointLights.length, lights.directionalLights.length );

				meshes[ i ].material.fragmentShader =
					replaceNumLights( teapots[ i ].fragmentShader,
						lights.pointLights.length, lights.directionalLights.length );

				meshes[ i ].material.needsUpdate = true;

			}

		}

		numPointLights = lights.pointLights.length;

		numDirectionalLights = lights.directionalLights.length;

		// This part is for rendering the axis, point lights and grid objects
		// with THREE's rendering pipeline by using the view and projection
		// matrices computed by ourselves. This part is not used for rendering
		// teapots. Please ignore this part for doing homework.
		camera.matrixWorld.copy( new THREE.Matrix4().getInverse( viewMat ) );

		camera.projectionMatrix.copy( projectionMat );

		var pointLights = lights.pointLights;

		if ( pLightSpheres.length !== pointLights.length ) {

			for ( var idx = pLightSpheres.length;
				idx < pointLights.length; idx ++ ) {

				var pLight = pointLights[ idx ];

				var sphereMesh = new THREE.Mesh( sphere,
					new THREE.MeshBasicMaterial( { color: pLight.color } ) );

				pLightSpheres.push( sphereMesh );

				scene.add( sphereMesh );

			}

		}

		for ( var idx = 0; idx < pLightSpheres.length; idx ++ ) {

			var pos = pointLights[ idx ].position;

			pLightSpheres[ idx ].position.set( pos.x, pos.y, pos.z );

		}

	}

	// Replace NUM_POINT_LIGHTS and NUM_DIR_LIGHTS in the shaders to the number
	// of existing lights respectively. By doing this, we can define the size
	// of an array of struct (e.g. pointLights[NUM_POINT_LIGHTS]) in the
	// shaders and can avoid using the uniforms in the main function for
	// compilation. After replacing the variables to hard-coded numbers, the
	// shaders have to be recompiled.
	function replaceNumLights( shader, num_plights, num_dlights ) {

		return shader.replace( /NUM_POINT_LIGHTS/g, num_plights )
		 .replace( /NUM_DIR_LIGHTS/g, num_dlights );

	}

	// Perform rendering after updating uniforms
	//
	// INPUT
	// state: state object of StateController
	// modelMat: model matrix
	// viewMat: view matrix
	// projectionMat: projection matrix
	function render(
		state, modelMat, viewMat, projectionMat ) {

		updateUniforms( state, modelMat, viewMat, projectionMat );

		webglRenderer.setRenderTarget( null );

		// Render the scene!
		// This part performs all renderings scheduled above on GPU.
		webglRenderer.render( scene, camera );

	}

	// Perform rendering on renderTarget (a.k.a. frame buffer)
	// for multipass renderings!
	//
	// INPUT
	// state: state object of StateController
	// modelMat: model matrix
	// viewMat: view matrix
	// projectionMat: projection matrix
	function renderOnTarget(
		renderTarget, state, modelMat, viewMat, projectionMat ) {

		updateUniforms( state, modelMat, viewMat, projectionMat );

		webglRenderer.setRenderTarget( renderTarget );

		webglRenderer.clear();

		webglRenderer.render( scene, camera );

	}

	/* Event listeners */

	// Automatic update of the renderer size when the window is resized.
	$( window ).resize( function () {

		webglRenderer.setSize( dispParams.canvasWidth, dispParams.canvasHeight );

	} );



	/* Expose as public functions */

	this.updateUniforms = updateUniforms;

	this.replaceNumLights = replaceNumLights;

	this.render = render;

	this.renderOnTarget = renderOnTarget;

};
