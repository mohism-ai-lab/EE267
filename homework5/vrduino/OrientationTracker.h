/**
 * @class OrientationTracker
 * This class performs orientation tracking using values from the IMU.
 * Overview:
 * - samples data from the imu.
 * - performs complementary filtering to estimate orientation
 * in either  euler angles or quaternion
 * - calls functions from Quaternion for quaternion math
 * - calls functions from OrientationMath for complementary filtering
 *
 * The complementary filter alpha value is between [0,1].
 * If 1, ignore angle correction from acc. If 0, use full correction
 * from accc.
 *
 * See get..() functions to get read-only access to the following values:
 * - euler angle estimate
 * - quaternion estimate
 * - gyro and acc values (after preprocessing)
 * - gyro bias and variance
 *
 */

#pragma once
#include "Imu.h"
#include "Quaternion.h"
#include "OrientationMath.h"
#include "simulatedImuData.h"

class OrientationTracker {

  public:

    /**
     * constructor that initializes alpha filter params
     * @param [in] imuFilterAlpha - alpha value [0,1] for complementary filter
     *   1: ignore tilt correction from acc. 0: use full tilt correction from acc
     * @param [in] simulateImu - if true, get imu values from external file
     */
    OrientationTracker(double imuFilterAlpha, bool simulateImu) ;


    /**
     * samples and processes imu data.
     * updates the quaternion, and euler
     * @returns true if sampling processing was successful,
     * false, if no data was available.
     */
    bool processImu();


    /** initializes Imu */
    void initImu();


    /**
     * measures Imu bias and variance.
     * updates the gyrBias and gyrVariance fields.
     * updates the accBias and accVariance fields.
     * the order of elements is [x-axis, y-axis, z-axis],
     * i.e. gyrBias[0] is the gyro bias of the x-axis
     *
     * steps to sample from imu:
     * - call imu.read() to sample IMU
     * - if it returns true, get values from
     *   imu.gyrX, imu.gyrY, imu.gyrZ,
     *   imu.accX, imu.accY, imu.accZ,
     */
    void measureImuBiasVariance();


    /**
     * sets the Imu bias
     * @param [in] bias - copy the bias values in this array into
     *  this class' gyrBias variable
     */
    void setImuBias(double bias[3]);


    /**
     * resets orientation estimates to 0
     */
    void resetOrientation();


    /**
     * @returns flatland roll estimate from gyro readings
     */
    double getFlatLandRollGyr() { return flatlandRollGyr; }


    /**
     * @returns flatland roll estimate from acc readings
     */
    double getFlatLandRollAcc() { return flatlandRollAcc; }


    /**
     * @returns flatland roll estimate from complementary filter
     */
    double getFlatLandRollComp() { return flatlandRollComp; }


    /**
     * @returns read-only reference to euler angles array
     * order is pitch (x), yaw (y), roll (z)
     */
    const double* getEulerAcc() const { return eulerAcc; };


    /**
     * @returns read-only reference to quaternion from gyro
     */
    const Quaternion& getQuaternionGyr() const { return quaternionGyr; };


    /**
     * @returns read-only reference to quaternion from comp filter
     */
    const Quaternion& getQuaternionComp() const { return quaternionComp; };


    /**
     * @returns read-only reference to accelerometer values,
     * order is ax,ay,az
     */
    const double* getAcc() const { return acc; };


    /**
     * @returns read-only reference to gyroscope values,
     * order is wx, wy, wz
     */
    const double* getGyr() const { return gyr; };


    /**
     * @returns read-only reference to gyroscope bias values
     * order is wx, wy, wz
     */
    const double* getGyrBias() const { return gyrBias; };


    /**
     * @returns read-only reference to gyroscope variance values,
     * order is wx, wy, wz
     */
    const double* getGyrVariance() const { return gyrVariance; };


    /**
     * @returns read-only reference to accelerometer bias values
     * order is ax, ay, az
     */
    const double* getAccBias() const { return accBias; };


    /**
     * @returns read-only reference to accelerometer variance values,
     * order is ax, ay, az
     */
    const double* getAccVariance() const { return accVariance; };


  protected:

    /**
     * samples the Imu and preprocesses the variables for orientation calculation.
     *
     * steps:
     * - call imu.read() to sample imu, then read imu.gyrX/Y/Z, imu.accX/Y/Z.
     *   units are in deg/s for gyro, m/s^2 for acc
     * - subtract bias for the gyro
     * - store the values in the arrays: gyr, acc.
     *   These are 3 element arrays, with elements the following order [x,y,z]
     *   i.e. gyr[0] corresponds to the rotational velocity about x-axis
     * - update deltaT (s), prevTimeImu (s)
     *
     * The IMU reference frame has the z-axis pointing out of the IMU.
     * You should not negate any axis.
     *
     * @returns true if data from imu is available, false if not
     */
    bool updateImuVariables();


    /**
     * gets imu variables from simulation, instead of sampling from the imu.
     * updates acc, gyr, deltaT
     */
    void updateImuVariablesFromSimulation();


    /**
     * calls the orientation tracking functions and
     * updates the following orientation variables:
     * - flatlandRollGyr
     * - flatlandRollAcc
     * - flatlandRollComp
     * - quaternionGyr
     * - eulerAcc
     * - quaternionComp
     *
     * Uses the following variables defined in this class:
     * - gyr
     * - acc
     * - imuFilterAlpha
     * - deltaT
     *
     * The values should be used as-is, without any subtracting of biases.
     * All that should be done in updateImuVariables()
     *
     * Math should not be done here. That should be done by calling the functions
     * in OrientationMath.cpp
     *
     */
    void updateOrientation();


    /** Imu class for sampling from IMU */
    Imu imu;


    /**
     * gyro values in order (x,y,z) after bias subtraction
     * in IMU ref frame (z-axis points out of imu).
     * units are deg/s
     */
    double gyr[3];


    /**
     * acc values in order (x,y,z)
     * units are m/s^2
     * in IMU ref frame (z-axis points out of imu).
     */
    double acc[3];


    /**
     * gyro bias values. order is: (wx,wy,wz)
     */
    double gyrBias[3];


    /**
     * gyro variance values. order is: (wx,wy,wz)
     */
    double gyrVariance[3];


    /**
     * accelerometer bias values. order is: (ax,ay,az)
     */
    double accBias[3];


    /**
     * accelerometer variance values. order is: (ax,ay,az)
     */
    double accVariance[3];


    /**
     * the previous time in s the imu was polled
     */
    double previousTimeImu;


    /**
     * complementary filter alpha value [0,1]
     * - 1: use full value of acc tilt correction
     * - 0: ignore acc tilt correction
     */
    double imuFilterAlpha;


    /**
     * time since the previous imu read, in s
     */
    double deltaT;


    /**
     * if true, get IMU gyr and acc values from external file
     * if false, sample as usual
     */
    bool simulateImu;


    /**
     * counter for simulation data array
     */
    int simulateImuCounter;


    /**
     * estimate of flatland roll from gyro values
     */
    double flatlandRollGyr;


    /**
     * estimate of flatland roll from acc values
     */
    double flatlandRollAcc;


    /**
     * estimate of flatland roll from complementary filter
     */
    double flatlandRollComp;


    /**
     * estimate of quaternion orientation from gyro only
     */
    Quaternion quaternionGyr;


    /**
     * estimate of euler orientation from acc only
     * order: pitch (x-axis), yaw (y-axis), roll (z-axis)
     */
    double eulerAcc[3];

    /**
     * estimate of quaternion orientation
     * from comp. filter of acc and gyr
     */
    Quaternion quaternionComp;


};
