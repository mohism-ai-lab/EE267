/**
 * @file Class for teapot
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


/**
 * Our Teapot class
 *
 * @class Teapot
 * @classdesc Class to hold all uniforms and shaders for a teapot
 *
 * @param  {THREE.Vector3} position position of a teapot
 * @param  {string} vShader  vertex shader
 * @param  {string} fShader  fragment shader
 */
var Teapot = function ( position, vShader, fShader ) {

	// TeapotBufferGeometry creates the set of vertex's coordinates of a teapot
	// See js/libs/TeapotBufferGeometry.js for details.
	this.geometry =
		new THREE.TeapotBufferGeometry( 10, 3, true, true, true, false, true );

	this.position = position;

	this.vertexShader = vShader;

	this.fragmentShader = fShader;

};
