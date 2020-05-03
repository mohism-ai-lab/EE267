/**
 * @file Phong fragment shader with point and directional lights
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */


var shaderID = "fShaderMultiPhong";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

varying vec3 normalCam;
varying vec3 fragPosCam;

uniform mat4 viewMat;

struct Material {
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
	float shininess;
};

uniform Material material;

uniform vec3 attenuation;

uniform vec3 ambientLightColor;

// NUM_POINT_LIGHTS is replaced to the number of point lights by the
// replaceNumLights() function in teapot.js before the shader is compiled.
#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

#endif


// NUM_DIR_LIGHTS is replaced to the number of directional lights by the
// replaceNumLights() function in teapot.js before the shader is compiled.
#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif


vec3 computeReflection(vec3 lightColor, vec3 L, vec3 N ) {

	// Compute diffuse reflection
	vec3 diffuseReflection =
		lightColor * material.diffuse * max( .0, dot( N, L ) );

	// Compute specular reflection (if both L and N are normalized, )
	// NOTE:
	// If both L and N are normalized, the returned vector is also normalized.
	vec3 specularDirection = reflect( - L, N );

	vec3 V = - normalize( fragPosCam );

	vec3 specularReflection =
		lightColor * material.specular *
			pow( max( .0, dot( specularDirection, V ) ), material.shininess );

	return diffuseReflection + specularReflection;

}


void main() {


	// Compute ambient reflection
	vec3 ambientReflection = material.ambient * ambientLightColor;

	vec3 N = normalize( normalCam );

	vec3 fColor = ambientReflection;

	#if NUM_POINT_LIGHTS > 0

		for ( int p_idx = 0; p_idx < NUM_POINT_LIGHTS; p_idx ++ ) {

			vec3 lightPosCam = vec3( viewMat *
				vec4( pointLights[p_idx].position, 1.0 ) );

			// normalized vector pointing from a fragment to a light source
			vec3 pLightDir = normalize( lightPosCam - fragPosCam );

			vec3 pLightRefl = computeReflection(
				pointLights[p_idx].color, pLightDir, N );

			float d = distance( lightPosCam, fragPosCam );

			float attenuationFactor =
				1.0 / ( attenuation[0] + attenuation[1] * d + attenuation[2] * ( d * d ) );

			fColor += attenuationFactor * pLightRefl;

		}

	#endif


	#if NUM_DIR_LIGHTS > 0

		for ( int d_idx = 0; d_idx < NUM_DIR_LIGHTS; d_idx ++ ) {

			vec3 dLightDir = - normalize(
				mat3(viewMat) * directionalLights[d_idx].direction );

			vec3 dLightRefl = computeReflection(
				directionalLights[d_idx].color,	dLightDir, N );

			fColor += dLightRefl;

		}

	#endif

	gl_FragColor = vec4( fColor, 1.0 );

}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
