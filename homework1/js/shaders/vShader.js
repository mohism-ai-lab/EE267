/**
 * @file Pass-through vertex shader
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01

 */

var shaderID = "vShader";

var shader = document.createTextNode( `
/***
 * varying qualifier is used for passing variables from a vertex shader
 * to a fragment shader. In the fragment shader, these variables are
 * interpolated between neighboring vertexes.
 */
varying vec3 vColor;

uniform mat4 projectionMat;
uniform mat4 modelViewMat;

attribute vec3 position;
attribute vec3 color;

void main() {

    vColor = color;

    gl_Position =
        projectionMat * modelViewMat * vec4( position, 1.0 );

}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-vertex" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
