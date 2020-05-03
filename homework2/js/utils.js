/**
 * @file utility functions
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

// Our beautiful cardinal color!
const cardinalColor = "rgb( 140, 21, 21 )";

function vector3ToString( v ) {

	return "(" + v.x.toFixed( 1 ).toString()
		+ "," + v.y.toFixed( 1 ).toString()
		+ "," + v.z.toFixed( 1 ).toString() + ")";

}

function vector2ToString( v ) {

	return "(" + v.x.toFixed( 1 ).toString()
		+ "," + v.y.toFixed( 1 ).toString() + ")";

}
