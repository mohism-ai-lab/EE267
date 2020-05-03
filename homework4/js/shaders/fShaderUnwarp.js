/**
 * @file Unwarp fragment shader
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

/* TODO (2.2.2) Fragment shader implementation */

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
    float K_1 = K.x;
    float K_2 = K.y;
    vec2 xy_u = vec2(textureCoords.x*viewportSize.x,textureCoords.y*viewportSize.y) ;
    vec2 xy_c = vec2(centerCoordinate.x*viewportSize.x,centerCoordinate.y*viewportSize.y);
    float r_t = distance(xy_u, xy_c);
    float r = r_t/distLensScreen;

    float x_d = (1.0+K_1*r*r+K_2*pow(r,4.0)) * xy_u.x/viewportSize.x;
    float y_d = (1.0+K_1*r*r+K_2*pow(r,4.0)) * xy_u.y/viewportSize.y;
    if (x_d < 0.0 || x_d >= 1.0 || y_d < 0.0 || y_d >= 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {

        gl_FragColor = texture2D( map, vec2(x_d,y_d));
    }

}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
