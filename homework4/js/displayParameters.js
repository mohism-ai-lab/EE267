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
 * 		The height and width holds the size of a window in pixel.
 * 		These values are automatically updated when the window is resized.
 */
var DisplayParameters = function () {

	// Alias for accessing this from a closure
	var _this = this;


	// screen width in [mm]
	var screenWidth = 132.5;

	// screen height in [mm]
	var screenHeight = 74.5;

	// lens diameter in [mm]
	var lensDiameter = 34;

	// Focal length of the lens in [mm]
	var focalLength = 40;

	// Eye relief in [mm]
	var eyeRelief = 18;

	// Vertical resolution of the current window in [pixel]
	this.canvasHeight = window.innerHeight;

	// Horizontal resolution of the current window in [pixel]
	this.canvasWidth = window.innerWidth;

	// Interpupillnary distance in [mm]
	this.ipd = 64;

	// distance between lens and screen in [mm]
	this.distLensScreen = 39;

	// Pixel pitch of the screen in [mm/px]
	this.pixelPitch = screenWidth / 1920; // 1920: external monitor resolution in [pixels]

	// Magnification of the lens
	this.lensMagnification = computeLensMagnification();

	// Distance between the viewer and the virtual screen in [mm]
	this.distanceScreenViewer = computeDistanceScreenViewer();



	/* Functions */

	// Compute the magnification of the lens
	//
	// OUTPUT
	// Lens magnification
	//
	// NOTE
	// Use private variables defined above.
	// You may not need all of them.
	function computeLensMagnification() {
		/* TODO (2.1.1) Calculating Parameters of the Magnified Virtual Screen Image */
   		// M = -i/o= i/f - 1 
        var magnification = focalLength/(focalLength - _this.distLensScreen);
		return magnification;
	}

	// Compute distance between the virtual screen and viewer
	//
	// OUTPUT
	// Distance between the virtual image and a viewer in [mm]
	//
	// NOTE
	// Use private variables defined above.
	// You may not need all of them.
	function computeDistanceScreenViewer() {

		/* TODO (2.1.1) Calculating Parameters of the Magnified Virtual Screen Image */
        var imageDist = 1/Math.abs((1/focalLength - 1/_this.distLensScreen));
		return eyeRelief + imageDist;

	}



	/* Event listeners */

	// For automatic update of canvasHieght and canvasWidth upon
	// window resizing (jQuery's method)
	$( window ).resize( function () {

		_this.canvasHeight = window.innerHeight;

		_this.canvasWidth = window.innerWidth;

	} );



	/* Expose as public functions */

	this.computeLensMagnification = computeLensMagnification;

	this.computeDistanceScreenViewer = computeDistanceScreenViewer;

};
