/**
 * @file Gouraud vertex shader only with ambient light
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

var shaderID = "vShaderGouraudAmbient";

var shader = document.createTextNode( `
/**
 * varying qualifier is used for passing variables from a vertex shader
 * to a fragment shader. In the fragment shader, these variables are
 * interpolated between neighboring vertexes.
 */
varying vec3 vColor; // Color at a vertex

uniform mat4 projectionMat;
uniform mat4 modelViewMat;

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float shininess;
};

uniform Material material;


uniform vec3 ambientLightColor;

attribute vec3 position;

void main() {

	// Compute ambient reflection
	vec3 ambientReflection = material.ambient * ambientLightColor;

	vColor = ambientReflection;

	gl_Position =
		projectionMat * modelViewMat * vec4( position, 1.0 );

}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-vertex" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
