/**
 * @file Unwarp fragment shader
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

var shaderID = "fShaderUnwarp";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */

precision mediump float;

varying vec2 textureCoords;

// texture rendered in the first rendering pass
uniform sampler2D map;

// center of lens for un-distortion
// in normalized coordinates between 0 and 1
uniform vec2 centerCoordinate;

// [width, height] size of viewport in [mm]
// viewport is the left/right half of the browser window
uniform vec2 viewportSize;

// lens distortion parameters [K_1, K_2]
uniform vec2 K;

// distance between lens and screen in [mm]
uniform float distLensScreen;

void main() {

	// distance from center in [mm]
	float radius_mm = distance(
		viewportSize * textureCoords, viewportSize * centerCoordinate );

	float radius = radius_mm / distLensScreen;

	float distortionFactor = 1.0 + K[0] * pow( radius, 2.0 ) + K[1] * pow( radius, 4.0 );

	// compute undistorted texture coordinates
	vec2 textureCoordsUndistorted =
		( textureCoords - centerCoordinate ) * distortionFactor + centerCoordinate;

	if ( textureCoordsUndistorted.x < 1.0 &&
		textureCoordsUndistorted.x > 0.0 &&
		textureCoordsUndistorted.y < 1.0 &&
		textureCoordsUndistorted.y > 0.0 ) {

		gl_FragColor = texture2D( map, textureCoordsUndistorted );

	} else {

		gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );

	}

	// if ( radius_mm < 0.5 ) {
	// 	gl_FragColor = vec4( 0.0, 1.0, 0.0, 1.0 );
	// }

}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
