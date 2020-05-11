/**
 * EE267 Virtual Reality
 * Homework 5
 * Orientation Tracking with IMUs Arduino Programming
 *
 * Instructor: Gordon Wetzstein <gordon.wetzstein@stanford.edu>
 *
 * The previous C++/OpenGL version was developed by Robert Konrad in 2016, and
 * the JavaScript/WebGL version was developed by Hayato Ikoma in 2017.
 *
 * The VRduino board is developed by Keenan Molner in 2017.
 * The current version of this Arduino codes are developed mainly by Marcus Pan
 * and Keenan Molner in 2017 and 2018.
 *
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 * This version uses Three.js (r115), stats.js (r17) and jQuery (3.2.1).
 */


#include <Wire.h>
#include "OrientationTracker.h"
#include "TestOrientation.h"

//complementary filter value [0,1].
//1: ignore acc tilt, 0: use all acc tilt
double alphaImuFilter = 0.0;

//if true, get imu values from recorded data in external file
//if false, get imu values from live sampling.
bool simulateImu = false;

//if test is true, then run tests in TestOrientation.cpp and exit
bool test = false;

//if measureImuBias is true, measure imu bias and variance
bool measureImuBias = false;

//if measureBias is false, set the imu bias to the following:
double gyrBiasSet[3] = {0.90750, -0.45814, 0.81967};

//initialize orientation tracker
OrientationTracker tracker(alphaImuFilter, simulateImu);

//stream mode
//To change what the Teensy is printing out, set streamMode
//to one of the following values.
//You can change the streamMode in real time by sending the
//corresponding number to the Teensy through the Serial Monitor.

//bias values, read frequency
const int INFO   = 0;

//flatland roll
const int FLAT   = 1;

//full 3D orientation in quaternion (gyro),
//and euler angles (acc), quaternion (comp filter)
const int THREED = 2;

//gyro values after bias subtraction
const int GYR    = 3;

//acc values
const int ACC    = 4;

//quaternion from comp filter
const int QC     = 5;

//chose which values you want to stream
int streamMode = QC;

//variables to measure read frequency
int nReads = 0;
unsigned long prevTime = 0;

//runs when the Teensy is powered on
void setup() {

  Serial.begin(115200);


  if (test) {

    delay(1000);
    testMain();
    return;

  }

  tracker.initImu();

  if (measureImuBias) {

    Serial.printf("Measuring bias\n");
    tracker.measureImuBiasVariance();

  } else {

    tracker.setImuBias(gyrBiasSet);

  }

  prevTime = micros();

}

void loop() {

  //reads in a single char to update behaviour. options:
  //0-5: set streamMode. See mapping above.
  //r  : reset orientation estimates to 0.
  //b  : remeasure bias
  if (Serial.available()) {

    int read = Serial.read();

    //check for streamMode
    int modeRead = read - 48;

    if (modeRead >= 0 && modeRead <= 5) {

      streamMode = modeRead;

    } else  if (read == 'r') {

      //reset orientation estimate to 0
      tracker.resetOrientation();

    } else if (read == 'b') {

      //measure imu bias
      Serial.printf("Measuring bias\n");
      tracker.measureImuBiasVariance();

    }
  }

  if (test) {
    return;
  }

  if (streamMode == INFO) {
    //print out number of reads / sec
    unsigned long now = micros();
    if ((now - prevTime) > 1000000) {
      Serial.printf("nReads/sec: %d\n", nReads);
      nReads = 0;
      prevTime = now;

      //print out bias/variance
      const double* gyrBias = tracker.getGyrBias();
      const double* gyrVariance = tracker.getGyrVariance();
      Serial.printf("GYR_BIAS: %.5f %.5f %.5f\n", gyrBias[0], gyrBias[1], gyrBias[2]);
      Serial.printf("GYR_VAR: %.5f %.5f %.5f\n", gyrVariance[0], gyrVariance[1], gyrVariance[2]);

      const double* accBias = tracker.getAccBias();
      const double* accVariance = tracker.getAccVariance();
      Serial.printf("ACC_BIAS: %.3f %.3f %.3f\n", accBias[0], accBias[1], accBias[2]);
      Serial.printf("ACC_VAR: %.3f %.3f %.3f\n", accVariance[0], accVariance[1], accVariance[2]);

    }
  }

  bool imuTrack = tracker.processImu();

  //return if there's no new values
  if (!imuTrack) {
    return;
  }

  nReads++;

  //get relevant values from the tracker class
  double flatlandRollGyr = tracker.getFlatLandRollGyr();
  double flatlandRollAcc = tracker.getFlatLandRollAcc();
  double flatlandRollComp = tracker.getFlatLandRollComp();
  const double* acc = tracker.getAcc();
  const double* gyr = tracker.getGyr();
  const Quaternion& qGyr = tracker.getQuaternionGyr();
  const double* eulerAcc = tracker.getEulerAcc();
  const Quaternion& qComp = tracker.getQuaternionComp();

  if (streamMode == FLAT) {

    //print out flatland roll
    Serial.printf("FLAT %.3f %.3f %.3f\n",
      flatlandRollGyr, flatlandRollAcc, flatlandRollComp);

  } else if (streamMode == THREED) {

    //quat values from gyro
    Serial.printf("QG %.3f %.3f %.3f %.3f\n",
      qGyr.q[0], qGyr.q[1], qGyr.q[2], qGyr.q[3]);

    //euler values from acc
    Serial.printf("EA %.3f %.3f %.3f\n",
      eulerAcc[0], eulerAcc[1], eulerAcc[2]);

    //quat values from comp filter
    Serial.printf("QC %.3f %.3f %.3f %.3f\n",
      qComp.q[0], qComp.q[1], qComp.q[2], qComp.q[3]);

  } else if (streamMode == GYR) {

    //print out gyr values
    Serial.printf("GYR: %.3f %.3f %.3f\n",
      gyr[0], gyr[1], gyr[2]);

  } else if (streamMode == ACC) {

    //print out acc values
    Serial.printf("ACC: %.3f %.3f %.3f\n",
      acc[0], acc[1], acc[2]);

  } else if (streamMode == QC) {

    //just print out comp filter
    Serial.printf("QC %.3f %.3f %.3f %.3f\n",
      qComp.q[0], qComp.q[1], qComp.q[2], qComp.q[3]);

  }

  delay(5);

}
