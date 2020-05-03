/**
 * @file Phong vertex shader with point and directional lights
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


var shaderID = "vShaderMultiPhong";

var shader = document.createTextNode( `
/**
 * varying qualifier is used for passing variables from a vertex shader
 * to a fragment shader. In the fragment shader, these variables are
 * interpolated between neighboring vertexes.
 */
varying vec3 normalCam;
varying vec3 fragPosCam;

uniform mat4 modelViewMat;
uniform mat4 projectionMat;
uniform mat3 normalMat;

attribute vec3 position;
attribute vec3 normal;

void main() {

	// Compute the normalized surface normal in camera space
	normalCam = normalize( normalMat * normal );

	// Compute position of the vertex in camera space.
	// Since this value is going to be linearly interpolated to be a position
	// of fragment, the varialbe is named to be "fragPosCam."
	fragPosCam = vec3( modelViewMat * vec4( position, 1.0 ) );

	gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );

}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-vertex" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
