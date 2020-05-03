/**
 * @file utility functions
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

/**
 * @const {string} cardinalColor Our beautiful cardinal color!
 */
const cardinalColor = "rgb( 140, 21, 21 )";


/**
 * vector3ToString - convert THREE.Vector3 to string
 *
 * @param  {THREE.Vector3} v input vector i.e. [a,b,c]
 * @return {string}   output string i.e. "(a, b, c)"
 */
function vector3ToString( v ) {

	return "(" + v.x.toFixed( 1 ).toString()
			+ "," + v.y.toFixed( 1 ).toString()
			+ "," + v.z.toFixed( 1 ).toString() + ")";

}


/**
 * vector2ToString - convert THREE.Vector2 to string
 *
 * @param  {THREE.Vector2} v input vector i.e. [a,b]
 * @return {string}   output string i.e. "(a, b)"
 */
function vector2ToString( v ) {

	return "(" + v.x.toFixed( 1 ).toString()
			   + "," + v.y.toFixed( 1 ).toString() + ")";

}


// By clicking the rendering switch button, the rendering mode is changed.
$( "#renderingSwitchBtn" ).click( function () {

	if ( renderingMode === STANDARD_MODE ) {

		renderingMode = FOVEATED_MODE;

		$( "#renderingSwitchBtn" ).html( "Foveated" );

	} else if ( renderingMode === FOVEATED_MODE ) {

		renderingMode = DOF_MODE;

		$( "#renderingSwitchBtn" ).html( "DoF" );

	} else if ( renderingMode === DOF_MODE ) {

		renderingMode = ANAGLYPH_MODE;

		$( "#renderingSwitchBtn" ).html( "Anaglyph" );

	} else if ( renderingMode === ANAGLYPH_MODE ) {

		renderingMode = STANDARD_MODE;

		$( "#renderingSwitchBtn" ).html( "Standard" );

	}


} );


$( "html" ).keydown( function ( e ) {

	// Keydown 1
	if ( e.which === 49 ) {

		renderingMode = STANDARD_MODE;

		$( "#renderingSwitchBtn" ).html( "Standard" );

	}

	// Keydown 2
	if ( e.which === 50 ) {

		renderingMode = FOVEATED_MODE;

		$( "#renderingSwitchBtn" ).html( "Foveated" );

	}

	// Keydown 3
	if ( e.which === 51 ) {

		renderingMode = DOF_MODE;

		$( "#renderingSwitchBtn" ).html( "DoF" );

	}

	// Keydown 4
	if ( e.which === 52 ) {

		renderingMode = ANAGLYPH_MODE;

		$( "#renderingSwitchBtn" ).html( "Anaglyph" );

	}

} );


// Draw the gaze position in every frame
var gazeCanvas = document.getElementById( "gaze" );


var drawGaze = function ( gazePosition, dispParams ) {

	// Update the position of the circle
	gazeCanvas.style.bottom = gazePosition.y + "px";
	gazeCanvas.style.left = gazePosition.x + "px";

};
