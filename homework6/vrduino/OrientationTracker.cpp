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

  // Number of measurements
  int N = 1000;

  //init variables of recording sum of readings,
  //and sum of squares of readings
  double gyrSum[3] = {0, 0, 0};
  double gyrSquaredSum[3] = {0, 0, 0};

  double accSum[3] = {0, 0, 0};
  double accSquaredSum[3] = {0, 0, 0};

  int nRead = 0;

  while (nRead < N) {

    if (imu.read()) {

      //record sum of readings
      gyrSum[0] += imu.gyrX;
      gyrSum[1] += imu.gyrY;
      gyrSum[2] += imu.gyrZ;

      accSum[0] += imu.accX;
      accSum[1] += imu.accY;
      accSum[2] += imu.accZ;

      //record sum of square of readings for
      //variance calculation
      gyrSquaredSum[0] += sq(imu.gyrX);
      gyrSquaredSum[1] += sq(imu.gyrY);
      gyrSquaredSum[2] += sq(imu.gyrZ);

      accSquaredSum[0] += sq(imu.accX);
      accSquaredSum[1] += sq(imu.accY);
      accSquaredSum[2] += sq(imu.accZ);

      nRead++;
    }

  }

  //calculate the mean and variance
  for (int i = 0; i < 3; i++) {

    gyrBias[i] = gyrSum[i]/N;
    accBias[i] = accSum[i]/N;

    //Var(X) = E(X^2) - E(X)^2
    gyrVariance[i] = gyrSquaredSum[i]/N - sq(gyrBias[i]);
    accVariance[i] = accSquaredSum[i]/N - sq(accBias[i]);

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
  // return if there's no data
    return false;
  }

  double currentTimeImu = micros()/1000000.0;

  if (previousTimeImu == 0.0) {
  // first reading, set prev time to current
    previousTimeImu = currentTimeImu;
  }

  // Compute the elapsed time from the previous iteration
  deltaT = currentTimeImu - previousTimeImu;
  previousTimeImu = currentTimeImu;

  // remove bias from the gyro measurements
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

  //flatland roll estimate
  flatlandRollGyr = computeFlatlandRollGyr(
    flatlandRollGyr, gyr, deltaT);

  flatlandRollAcc = computeFlatlandRollAcc(acc);

  flatlandRollComp = computeFlatlandRollComp(
    flatlandRollComp, gyr, flatlandRollAcc, deltaT, imuFilterAlpha);

  //updates quaternion estimate with only gyro values
  updateQuaternionGyr(quaternionGyr, gyr, deltaT);

  //performs euler complementary filtering with gyro and acc values
  eulerAcc[0] = computeAccPitch(acc);
  eulerAcc[2] = computeAccRoll(acc);

  //performs quaternion complementary filtering with gyro and acc values
  updateQuaternionComp(quaternionComp, gyr, acc, deltaT, imuFilterAlpha);

}
