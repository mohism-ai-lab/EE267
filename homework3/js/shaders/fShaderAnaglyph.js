/**
 * @file Fragment shader for anaglyph rendering
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

/* TODO (2.4.3) Color Channel Multiplexing */

var shaderID = "fShaderAnaglyph";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */

precision mediump float;

// uv coordinates after interpolation
varying vec2 textureCoords;

// Texture map for the left eye
uniform sampler2D textureMapL;

// Texture map for the right eye
uniform sampler2D textureMapR;

void main() {
    vec4 left = texture2D(textureMapL, textureCoords);
    vec4 right = texture2D(textureMapR, textureCoords);

    float red = 0.2989 *left.x + 0.5870* left.y + 0.1140*left.z;
    float grbl = 0.2989*right.x + 0.5870* right.y + 0.1140*right.z;
    gl_FragColor = vec4(red, grbl, grbl, 1.0);

}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
