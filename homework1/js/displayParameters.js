/**
 * @file Class for display parameters
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01

 */

/**
 * DisplayParameters
 *
 * @class DisplayParameters
 * @classdesc A class to hold display parameters.
 *    The height and width holds the size of a window in pixel.
 *    These values are automatically updated when the window is resized.
 *
 * @param  {Number} distSceenViewer distance to a screen from a viewer in [mm]
 * @param  {Number} screenDiagonal diagonal length of the screen in [inch]
 */
var DisplayParameters = function ( distSceenViewer, screenDiagonal ) {

	// Alias for accessing this from a closure
	var _this = this;

	// Vertical resolution of the current window in [pixel]
	this.canvasHeight = window.innerHeight;

	// Horizontal resolution of the current window in [pixel]
	this.canvasWidth = window.innerWidth;

	// Distance between the viewer and the monitor in [mm]
	this.distanceScreenViewer = distSceenViewer;

	// Pixel pitch of the monitor in [mm]
	this.pixelPitch = computePixelPitch();



	/* Functions */
	function computePixelPitch() {

		// Conversion factor from inch to mm
		var in_to_mm = 25.4;

		var screenResolutionHeight = screen.height;

		var screenResolutionWidth = screen.width;

		var aspectRatio = screenResolutionWidth / screenResolutionHeight;

		// Compute width of monitor (mm)
		var W = ( screenDiagonal * in_to_mm ) /
			Math.sqrt( 1.0 + Math.pow( 1 / aspectRatio, 2.0 ) );

		return W / screenResolutionWidth;

	}



	/* Event listeners */

	// For automatic update of canvasHieght and canvasWidth upon
	// window resizing (jQuery's method)
	$( window ).resize( function () {

		_this.canvasHeight = window.innerHeight;

		_this.canvasWidth = window.innerWidth;

	} );

	

	/* Expose as public functions */

	this.computePixelPitch = computePixelPitch;

};
