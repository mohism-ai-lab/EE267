/**
 * @file
 * math implementation for algorithm to estimate 3D pose from clock ticks
 */

#pragma once
#include <Wire.h>
#include "MatrixMath.h"
#include "Quaternion.h"


#if defined(KINETISK)
  #define CLOCKS_PER_SECOND (F_BUS)
#elif defined(KINETISL)
  // PLL is 48 Mhz, which is 24 clocks per microsecond, but
  // there is a divide by two for some reason.
  #define CLOCKS_PER_SECOND (F_PLL / 2)
#endif



/**
 * convert RAW clock ticks to 2D positions
 * use the variable CLOCKS_PER_SECOND defined above
 * @param [in] clockTicks - raw ticks of timing values in x and y
 *  for each of the 4 photodiodes
 * @param [out] pos2D positions of measurements on plane at
 *   unit distance
 */
void convertTicksTo2DPositions(uint32_t *clockTicks, double *pos2D);


/**
 * form matrix A, that maps sensor positions, b, to homography parameters, h:
 *  b = Ah
 * See course notes for derviation
 * @param [in]  pos2D  - lighthouse measurements of 2D photodiode projections
    on plane at unit distance away.
 *  this is a 8-element array of doubleing point values with order:
 *  [sensor0x, sensor0y, ... sensor3x, sensor3y]
 * @param [in] posRef - actual 2D positions of photodiodes. this
 *  is set based on the layout of the board. units is in mm, order is
 *  [sensor0x, sensor0y, ... sensor3x, sensor3y]
 * @param [out] AOut - 8x8 output matrix. A[i][j] refers to A_{i,j}
 */
void formA(double pos2D[8], double posRef[8], double AOut[8][8]);

/**
 * solves for h, given A and b: h = A^{-1} * b
 * @param [in] A - 8x8 matrix A.
 * @param [in] b - 8x1 vector containing actual 2D positions of photodiodes,
 *  in order: [sensor0x, sensor0y, ... sensor3x, sensor3y]
 * @param [out] h - 8x1 vector containing parameters of homography matrix:
 *  [h11, h12, h13, h21, h22, h23, h31, h32] (h33 is set to 1)
 * @returns - true if the matrix inversion of A was successful. false if not.
 */
bool solveForH(double A[8][8], double b[8], double hOut[8]);


/**
 * solves for Rotation and translation from homography.
 * R, t and gives the transformation of the vrduino in the base station
 * frame
 * @param [in] h - 8x1 array of homography parameters.
 *  order is: [h11, h12, h13, h21, h22, h23, h31, h32]
 * @param [out] ROut - 3x3 output Rotation matrix
 * @param [out] pos3DOut - 3x1 position vector. order is [x,y,z]
 */
void getRtFromH(double h[8], double ROut[3][3], double pos3DOut[3]);


/**
 * extract a quaternion from a 3x3 rotation matrix
 * follows algorithm here:
 * see http://www.ee.ucr.edu/~farrell/AidedNavigation/D_App_Quaternions/Rot2Quat.pdf
 * @param [in] R - 3x3 rotation matrix
 * @returns output quaternion
 */
Quaternion getQuaternionFromRotationMatrix(double R[3][3]);
