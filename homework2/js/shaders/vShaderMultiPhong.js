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
varying vec3 normalCam; // Normal in view coordinate
varying vec3 fragPosCam; // Vertex position in view cooridnate

uniform mat4 modelViewMat;
uniform mat4 projectionMat;
uniform mat3 normalMat;

attribute vec3 position;
attribute vec3 normal;

void main() {
    vec4 vertPos_4 = modelViewMat * vec4(position, 1.0);
    fragPosCam = vec3(vertPos_4) / vertPos_4.w;
    normalCam = normalize(normal * normalMat);

	gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );

}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-vertex" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
