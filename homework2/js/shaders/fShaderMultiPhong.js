/**
 * @file Phong fragment shader with point and directional lights
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

/* TODO (2.3) */

var shaderID = "fShaderMultiPhong";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */
precision mediump float;

varying vec3 normalCam; // Normal in view coordinate
varying vec3 fragPosCam; // Fragment position in view cooridnate

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

/***
 * NUM_POINT_LIGHTS is replaced to the number of point lights by the
 * replaceNumLights() function in teapot.js before the shader is compiled.
 */
#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

#endif

/***
 * NUM_DIR_LIGHTS is replaced to the number of directional lights by the
 * replaceNumLights() function in teapot.js before the shader is compiled.
 */
#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif


void main() {

    // Compute ambient reflection
    vec3 ambientReflection = material.ambient * ambientLightColor;

    vec3 fColor = ambientReflection;
    vec3 N = normalize(normalCam);

    if (NUM_POINT_LIGHTS >= 0) {

        for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
            PointLight light = pointLights[i];
            vec4 light_position_4 = (viewMat * vec4(light.position,1.0));
            vec3 light_position = vec3(light_position_4) / light_position_4.w;

            //Compute lambertian
             vec3 L = normalize(light_position - fragPosCam);
             float lambertian = max(dot(L, N),0.0);

             //compute attenuation
             float d = length(light_position - fragPosCam);
             float atten = float(1.0/(attenuation[0] + d*attenuation[1] + d*d*attenuation[2]));

             //diffuse color
             vec3 diffuseColor = lambertian * material.diffuse * light.color;

             //specular color
             vec3 R = normalize(-reflect(L, N));
             vec3 V = normalize(-fragPosCam);
             float max_val = max(dot(R,V), 0.0);

             vec3 specularColor = material.specular * light.color * max_val;
             fColor += atten * diffuseColor + specularColor;

        }
     }

    if (NUM_DIR_LIGHTS >= 0) {

        for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
            DirectionalLight light = directionalLights[i];

            vec4 light_dir4 = (viewMat * vec4(light.direction,1.0));
            vec3 light_dir = vec3(light_dir4) / light_dir4.w;

            //Compute lambertian
             vec3 L = normalize(-light_dir);
             float lambertian = max(dot(L, N),0.0);

             //diffuse color
             vec3 diffuseColor = lambertian * material.diffuse * light.color;

             //specular color
             vec3 R = normalize(reflect(-L, N));
             vec3 V = normalize(-fragPosCam);
             float max_val = max(dot(R,V), 0.0);

             vec3 specularColor = material.specular * light.color * max_val;
             fColor += diffuseColor + specularColor;
        }
     }
    gl_FragColor = vec4( fColor, 1.0 );
}
` );

var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
