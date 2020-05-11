#include "OrientationTracker.h"

OrientationTracker::OrientationTracker(double imuFilterAlphaIn,  bool simulateImuIn) :

  imu(),
  gyr{0,0,0},
  acc{0,0,0},
  gyrBias{0,0,0},
  gyrVariance{0,0,0},
  accBias{0,0,0},
  accVariance{0,0,0},
  previousTimeImu(0),
  imuFilterAlpha(imuFilterAlphaIn),
  deltaT(0.0),
  simulateImu(simulateImuIn),
  simulateImuCounter(0),
  flatlandRollGyr(0),
  flatlandRollAcc(0),
  flatlandRollComp(0),
  quaternionGyr{1,0,0,0},
  eulerAcc{0,0,0},
  quaternionComp{1,0,0,0}

  {

}

void OrientationTracker::initImu() {
  imu.init();
}


/**
 * TODO: see documentation in header file
 */
void OrientationTracker::measureImuBiasVariance() {

  //check if imu.read() returns true
  //then read imu.gyrX, imu.accX, ...

  //compute bias, variance.
  //update:
  //gyrBias[0], gyrBias[1], gyrBias[2]
  //gyrVariance[0], gyrBias[1], gyrBias[2]
  //accBias[0], accBias[1], accBias[2]
  //accVariance[0], accBias[1], accBias[2]
  
  int N = 1000;

  //for bias 
  double gyro_sum[3] = {0, 0, 0}; 
  double accel_sum[3] = {0, 0, 0};

  // for variance
  double gyro_sum_sq[3] = {0, 0, 0};  
  double accel_sum_sq[3] = {0, 0, 0};

  int counter = 0;

  //bias calculations:
  // get npoints consecutive gyro, accel measurements 
  while (counter < N) {
    if (imu.read()) {

      //update expectation/ bias values
      accel_sum[0] += imu.accX;
      accel_sum[1] += imu.accY;
      accel_sum[2] += imu.accZ;
      
      gyro_sum[0] += imu.gyrX;
      gyro_sum[1] += imu.gyrY;
      gyro_sum[2] += imu.gyrZ;

      
      //update variance values
      accel_sum_sq[0] += sq(imu.accX);
      accel_sum_sq[1] += sq(imu.accY);
      accel_sum_sq[2] += sq(imu.accZ);
      
      gyro_sum_sq[0] += sq(imu.gyrX);
      gyro_sum_sq[1] += sq(imu.gyrY);
      gyro_sum_sq[2] += sq(imu.gyrZ);

      counter += 1;
    }
  }

  //update/calculate bias, variance for all elements
  for (int i = 0; i <= 2; i++) {
    //expectation ie average values
    accBias[i] = accel_sum[i]/N;
    gyrBias[i] = gyro_sum[i]/N;

    accVariance[i] = accel_sum_sq[i]/N - sq(accBias[i]); //accBias = E[acc]
    gyrVariance[i] = gyro_sum_sq[i]/N - sq(gyrBias[i]);

  }
  
}

void OrientationTracker::setImuBias(double bias[3]) {

  for (int i = 0; i < 3; i++) {
    gyrBias[i] = bias[i];
  }

}

void OrientationTracker::resetOrientation() {

  flatlandRollGyr = 0;
  flatlandRollAcc = 0;
  flatlandRollComp = 0;
  quaternionGyr = Quaternion();
  eulerAcc[0] = 0;
  eulerAcc[1] = 0;
  eulerAcc[2] = 0;
  quaternionComp = Quaternion();

}

bool OrientationTracker::processImu() {

  if (simulateImu) {

    //get imu values from simulation
    updateImuVariablesFromSimulation();

  } else {

    //get imu values from actual sensor
    if (!updateImuVariables()) {

      //imu data not available
      return false;

    }

  }

  //run orientation tracking algorithms
  updateOrientation();

  return true;

}

void OrientationTracker::updateImuVariablesFromSimulation() {

    deltaT = 0.002;
    //get simulated imu values from external file
    for (int i = 0; i < 3; i++) {
      gyr[i] = imuData[simulateImuCounter + i];
    }
    simulateImuCounter += 3;
    for (int i = 0; i < 3; i++) {
      acc[i] = imuData[simulateImuCounter + i];
    }
    simulateImuCounter += 3;
    simulateImuCounter = simulateImuCounter % nImuSamples;

    //simulate delay
    delay(1);

}

/**
 * TODO: see documentation in header file
 */
bool OrientationTracker::updateImuVariables() {

  //sample imu values
  if (!imu.read()) {
  // return false if there's no data
    return false;
  }

  //call micros() to get current time in microseconds
  //update:
  //previousTimeImu (in seconds)
  //deltaT (in seconds)

  //read imu.gyrX, imu.accX ...
  //update:
  //gyr[0], ...
  //acc[0], ...

  // 1s = 1,000,000ms
  double cur_time = micros()/1000000.0;

  if (previousTimeImu == 0.0) {
    previousTimeImu = cur_time;
  }

  deltaT = cur_time - previousTimeImu;
  previousTimeImu = cur_time;

  gyr[0] = imu.gyrX - gyrBias[0];
  gyr[1] = imu.gyrY - gyrBias[1];
  gyr[2] = imu.gyrZ - gyrBias[2];

  acc[0] = imu.accX;
  acc[1] = imu.accY;
  acc[2] = imu.accZ;

  return true;

}


/**
 * TODO: see documentation in header file
 */
void OrientationTracker::updateOrientation() {
  
  flatlandRollGyr = computeFlatlandRollGyr(flatlandRollGyr, gyr, deltaT);
  flatlandRollAcc = computeFlatlandRollAcc(acc);
  flatlandRollComp = computeFlatlandRollComp(flatlandRollComp, gyr, flatlandRollAcc, deltaT, imuFilterAlpha);
  updateQuaternionGyr(quaternionGyr, gyr, deltaT);
  eulerAcc[0] = computeAccPitch(acc);
  eulerAcc[1] = computeAccRoll(acc); 
  updateQuaternionComp(quaternionComp, gyr, acc, deltaT, imuFilterAlpha);


}
