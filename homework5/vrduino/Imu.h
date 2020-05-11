/**
 * Header file for our IMU class
 *
 * @author Gordon Wetzstein <gordon.wetzstein@stanford.edu>
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2020/04/01
 */

#ifndef IMU_H
#define IMU_H

#include <Arduino.h>

/* for I2C and serial communication */
#include <Wire.h>

class Imu {
public:

  double gyrX, gyrY, gyrZ;
  double accX, accY, accZ;
  double magX, magY, magZ;

  /* initialize imu */
  void init();

  // read imu data
  //  returns true if data is different from last time read() was called and false otherwise
  bool read();

private:

  void initMPU9250(void);

  void I2Cread(
    uint8_t  Address,
    uint8_t  Register,
    uint8_t  Nbytes,
    uint8_t *Data);


  void I2CwriteByte(
    uint8_t Address,
    uint8_t Register,
    uint8_t Data);

  uint8_t I2CreadByte(
    uint8_t address,
    uint8_t readRegister);

  /* adjustment value for magnetometer */
  double _magnetometerAdjustmentScaleX,
         _magnetometerAdjustmentScaleY,
         _magnetometerAdjustmentScaleZ;

};

#endif // ifndef IMU_H
