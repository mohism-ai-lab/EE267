/**
 * @file Gouraud fragment shader with diffuse and ambient light
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


var shaderID = "fShaderGouraudDiffuse";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

varying vec3 vColor; // Color at a fragment

void main() {

	gl_FragColor = vec4( vColor, 1.0 );


}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
