/**
 * @file vertex shader for anaglyph rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


var shaderID = "vShaderAnaglyph";

var shader = document.createTextNode( `
/**
 * varying qualifier is used for passing variables from a vertex shader
 * to a fragment shader. In the fragment shader, these variables are
 * interpolated between neighboring vertexes.
 */
varying vec2 textureCoords;


// Four vertices positions of the rectangle:
// (-1,1,0), (1,1,0), (-1,-1,0), (1,-1,0)
attribute vec3 position;

// Four texture coordinates of the rectangle:
// (0,1), (1,1), (0,0), (1,0)
attribute vec2 uv;

void main() {

	textureCoords = uv;

	gl_Position = vec4( position, 1.0 );

}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-vertex" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
