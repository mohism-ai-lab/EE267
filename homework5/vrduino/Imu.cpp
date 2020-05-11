/**
 * IMU class
 *
 * @author Gordon Wetzstein <gordon.wetzstein@stanford.edu>
 * @copyright The Board of Trustees of the Leland Stanford Junior University
 * @version 2018/05/07
 */

#include "Imu.h"

// turn magnetometer off by default, often creates trouble reading other values
#define USE_MAGNETOMETER false

/* address of gyro & accelerometer */
#define MPU9250_ADDRESS 0x68

/* Register address with expected 0x71 value when queried. */
#define WHO_AM_I_MPU9250 0x75 // address for expected return value

/* expected value to be returned */
#define MPU9250_KNOWN_VAL 0x71

/*  address of magnetometer (separate chip) */
#define MAG_ADDRESS 0x0C

/***
 * gyro maximum angular velocity range (in degrees per second)
 * note: smaller range makes the measurements more precise with the 16 bit ADC,
 * but is problematic for faster motions
 */
#define GYRO_FULL_SCALE_250_DPS   0x00
#define GYRO_FULL_SCALE_500_DPS   0x08
#define GYRO_FULL_SCALE_1000_DPS  0x10
#define GYRO_FULL_SCALE_2000_DPS  0x18

/***
 * accelerometer maximum range (in g, 1 g = 9.81 m/s^2)
 * note: smaller range makes the measurements more precise with the 16 bit ADC,
 *        but is problematic for faster accelerations
 */
#define ACC_FULL_SCALE_2_G  0x00
#define ACC_FULL_SCALE_4_G  0x08
#define ACC_FULL_SCALE_8_G  0x10
#define ACC_FULL_SCALE_16_G 0x18

#define PWR_MGMT_1       0x6B // Device defaults to the SLEEP mode
#define CONFIG           0x1A
#define SMPLRT_DIV       0x19

#define GYRO_CONFIG      0x1B
#define ACCEL_CONFIG     0x1C
#define ACCEL_CONFIG2    0x1D
#define INT_PIN_CFG      0x37
#define INT_ENABLE       0x38
#define INT_STATUS       0x3A

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this is a utility function to help clear the I2C bus so as to avoid it getting stuck

/**
 * This routine turns off the I2C bus and clears it
 * on return SCA and SCL pins are tri-state inputs.
 * You need to call Wire.begin() after this to re-enable I2C
 * This routine does NOT use the Wire library at all.
 *
 * returns 0 if bus cleared
 *         1 if SCL held low.
 *         2 if SDA held low by slave clock stretch for > 2sec
 *         3 if SDA held low after 20 clocks.
 */
int I2C_ClearBus() {
#if defined(TWCR) && defined(TWEN)
  TWCR &= ~(_BV(TWEN)); //Disable the Atmel 2-Wire interface so we can control the SDA and SCL pins directly
#endif

  pinMode(SDA, INPUT_PULLUP); // Make SDA (data) and SCL (clock) pins Inputs with pullup.
  pinMode(SCL, INPUT_PULLUP);

  delay(2500);  // Wait 2.5 secs. This is strictly only necessary on the first power
  // up of the DS3231 module to allow it to initialize properly,
  // but is also assists in reliable programming of FioV3 boards as it gives the
  // IDE a chance to start uploaded the program
  // before existing sketch confuses the IDE by sending Serial data.

  boolean SCL_LOW = (digitalRead(SCL) == LOW); // Check is SCL is Low.
  if (SCL_LOW) { //If it is held low Arduno cannot become the I2C master.
    return 1; //I2C bus error. Could not clear SCL clock line held low
  }

  boolean SDA_LOW = (digitalRead(SDA) == LOW);  // vi. Check SDA input.
  int clockCount = 20; // > 2x9 clock

  while (SDA_LOW && (clockCount > 0)) { //  vii. If SDA is Low,
    clockCount--;
  // Note: I2C bus is open collector so do NOT drive SCL or SDA high.
    pinMode(SCL, INPUT); // release SCL pullup so that when made output it will be LOW
    pinMode(SCL, OUTPUT); // then clock SCL Low
    delayMicroseconds(10); //  for >5uS
    pinMode(SCL, INPUT); // release SCL LOW
    pinMode(SCL, INPUT_PULLUP); // turn on pullup resistors again
    // do not force high as slave may be holding it low for clock stretching.
    delayMicroseconds(10); //  for >5uS
    // The >5uS is so that even the slowest I2C devices are handled.
    SCL_LOW = (digitalRead(SCL) == LOW); // Check if SCL is Low.
    int counter = 20;
    while (SCL_LOW && (counter > 0)) {  //  loop waiting for SCL to become High only wait 2sec.
      counter--;
      delay(100);
      SCL_LOW = (digitalRead(SCL) == LOW);
    }
    if (SCL_LOW) { // still low after 2 sec error
      return 2; // I2C bus error. Could not clear. SCL clock line held low by slave clock stretch for >2sec
    }
    SDA_LOW = (digitalRead(SDA) == LOW); //   and check SDA input again and loop
  }
  if (SDA_LOW) { // still low
    return 3; // I2C bus error. Could not clear. SDA data line held low
  }

  // else pull SDA line low for Start or Repeated Start
  pinMode(SDA, INPUT); // remove pullup.
  pinMode(SDA, OUTPUT);  // and then make it LOW i.e. send an I2C Start or Repeated start control.
  // When there is only one I2C master a Start or Repeat Start has the same function as a Stop and clears the bus.
  /// A Repeat Start is a Start occurring after a Start with no intervening Stop.
  delayMicroseconds(10); // wait >5uS
  pinMode(SDA, INPUT); // remove output low
  pinMode(SDA, INPUT_PULLUP); // and make SDA high i.e. send I2C STOP control.
  delayMicroseconds(10); // x. wait >5uS
  pinMode(SDA, INPUT); // and reset pins as tri-state inputs which is the default state on reset
  pinMode(SCL, INPUT);
  return 0; // all ok
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// initialize the connection to the IMU

void Imu::init()
{

  // Clearing the bus is necessary due to a common I2C problem: when restarting the program several times
  // in a row, soemtimes the slave (i.e., IMU) waits for a package by the master (Arduino) and keeps the
  // SDA line low. There is no way for the master to release it other than clearing the bus this way.
  int rtn = I2C_ClearBus(); // clear the I2C bus first before calling Wire.begin()
  if (rtn != 0) {
    Serial.println("WARNING: I2C problem, try unplugging your VRduino and plugging it back in!");
  }
  delay(250);

  // initialize I2C contnection to IMU with Arduino being the master
  Wire.begin();
  Wire.setClock(400000L); // set clock rate to 400 kHz for faster data transfer

  /*
  // We can ping the IMU first thing and read out the WHO_AM_I_MPU9250 register. The returned value should
  // be 0x71. If it's not, there may be a connection problem

  byte c = I2CreadByte(MPU9250_ADDRESS, WHO_AM_I_MPU9250);  // Read WHO_AM_I register for MPU-9250
  Serial.print("MPU9250 ");
  Serial.print("I AM ");
  Serial.print(c, HEX);
  Serial.print(" I should be ");
  Serial.println(0x71, HEX);
  if (c != 0x71) {
    Serial.println("ERROR: could not connect to MPU9250, try unplugging your VRduino and plugging it back in!");
  }
  */

  //choose LPF bandwidth (184 Hz) and sampling Freq (1 kHz) for gyro
  this->I2CwriteByte(MPU9250_ADDRESS, CONFIG, 0x01);

  //choose LPF bandwidth (184 Hz) and sampling Freq (1 kHz) for acc
  this->I2CwriteByte(MPU9250_ADDRESS, ACCEL_CONFIG2, 0x01);

  // Configure gyroscope range (use maximum range)
  this->I2CwriteByte(MPU9250_ADDRESS, 27, GYRO_FULL_SCALE_2000_DPS);

  // Configure accelerometers range (use maximum range)
  this->I2CwriteByte(MPU9250_ADDRESS, 28, ACC_FULL_SCALE_16_G);

  // Set bypass mode for the magnetometer, so we can read values directly
  this->I2CwriteByte(MPU9250_ADDRESS, 0x37, 0x02);

  if(USE_MAGNETOMETER) {

    // read adjument value
    uint8_t buf[3];
    this->I2Cread(MAG_ADDRESS, 0x10, 3, buf);

    this->_magnetometerAdjustmentScaleX = 0.5 * (double(buf[0]) - 128) / 128 + 1;
    this->_magnetometerAdjustmentScaleY = 0.5 * (double(buf[1]) - 128) / 128 + 1;
    this->_magnetometerAdjustmentScaleZ = 0.5 * (double(buf[2]) - 128) / 128 + 1;

    // Request first magnetometer single 16 bit measurement
    this->I2CwriteByte(MAG_ADDRESS, 0x0A, B00010001);

    //  uint8_t cntl_reg;
    //  I2Cread(MAG_ADDRESS,0x0A,1,&cntl_reg);
    //  Serial.println (cntl_reg, BIN);
  }

}

/***
 *  read all 9 sensors from the IMU and convert values into metric units
 *  note: these values will be reported in the coordinate system of the sensor,
 *        which may be different for gyro, accelerometer, and magnetometer
 */
bool Imu::read() {

  // query this register to see if new values are available
  uint8_t int_status = this->I2CreadByte(MPU9250_ADDRESS, INT_STATUS);
  if ((int_status & 0x01) == false ) {
    return false;
  }

  // all measurements are converted to 16 bits by the IMU-internal ADC
  double max16BitValue = 32767.0;

  uint8_t Buf[14];

  this->I2Cread(MPU9250_ADDRESS, 0x3B, 14, Buf);

  /////////////////////////////////////////////////////////////////////////////
  // Read accelerometer

  /* 16 bit accelerometer data */
  int16_t ax = Buf[0] << 8 | Buf[1];
  int16_t ay = Buf[2] << 8 | Buf[3];
  int16_t az = Buf[4] << 8 | Buf[5];

  /* scale to get metric data in m/s^2 */

  // float maxAccRange   = 2.0; // in g
  double maxAccRange = 16.0;                             // max range (in g)
                                                         // as set in setup()
                                                         // function
  double g2ms2    = 9.80665;
  double accScale = g2ms2 * maxAccRange / max16BitValue; // convert 16 bit to
                                                         // float

  /* convert 16 bit raw measurement to metric float */
  //accX = - double(ax) * accScale;
  //accY =   double(ay) * accScale;
  //accZ = - double(az) * accScale;

  accX = double(ax) * accScale;
  accY = double(ay) * accScale;
  accZ = double(az) * accScale;

  /////////////////////////////////////////////////////////////////////////////
  // Read gyroscope

  /* 16 bit gyroscope raw data */
  int16_t gx = Buf[8]  << 8 | Buf[9];
  int16_t gy = Buf[10] << 8 | Buf[11];
  int16_t gz = Buf[12] << 8 | Buf[13];

  double maxGyrRange = 2000.0;                   // max range (in deg per sec)
                                                 // as set in setup() function
  double gyrScale = maxGyrRange / max16BitValue; // convert 16 bit to float

  /* convert 16 bit raw measurement to metric float */
  //gyrX = - double(gx) * gyrScale;
  //gyrY =   double(gy) * gyrScale;
  //gyrZ = - double(gz) * gyrScale;

  gyrX = double(gx) * gyrScale;
  gyrY = double(gy) * gyrScale;
  gyrZ = double(gz) * gyrScale;

  /////////////////////////////////////////////////////////////////////////////

  if (USE_MAGNETOMETER) {

    // Read magnetometer
    uint8_t ST1;
    I2Cread(MAG_ADDRESS, 0x02, 1, &ST1);

    // new measurement available (otherwise just move on)
    if (ST1 & 0x01) {
      // Read magnetometer data
      uint8_t m[6];
      I2Cread(MAG_ADDRESS, 0x03, 6, m);

       //  see datatsheet:
       //  - byte order is reverse from other sensors
       //  - x and y are flipped
       //  - z axis is reverse
      int16_t mmy =  m[1] << 8 | m[0];
      int16_t mmx =  m[3] << 8 | m[2];
      int16_t mmz =  -m[5] << 8 | m[4];

      // convert 16 bit raw measurement to metric float
      double magScale = 4912.0 / max16BitValue;
      this->magX = double(mmx) * magScale * this->_magnetometerAdjustmentScaleX;
      this->magY = double(mmy) * magScale * this->_magnetometerAdjustmentScaleY;
      this->magZ = double(mmz) * magScale * this->_magnetometerAdjustmentScaleZ;

      // request next reading on magnetometer
      I2CwriteByte(MAG_ADDRESS, 0x0A, B00010001);
    }
  }

  return true;
}

///////////////////////////////////////////////////////////////////////////////////////////
// general I2C communication routine

uint8_t Imu::I2CreadByte(uint8_t address, uint8_t readRegister)
{
  uint8_t data;                          // `data` will store the register data

  Wire.beginTransmission(address);       // Initialize the Tx buffer
  Wire.write(readRegister);              // Put slave register address in Tx buffer
  Wire.endTransmission(false);           // Send the Tx buffer, but send a restart to keep connection alive
  Wire.requestFrom(address, (uint8_t)1);  // Read one byte from slave register
  data = Wire.read();                     // Fill Rx buffer with result
  return data;                            // Return data read from slave register
}

///////////////////////////////////////////////////////////////////////////////////////////
// general I2C communication routine

/* Write a byte (Data) in device (Address) at register (Register) */
void Imu::I2CwriteByte(uint8_t Address, uint8_t Register, uint8_t Data)
{
  // Set register address
  Wire.beginTransmission(Address);
  Wire.write(Register);
  Wire.write(Data);
  Wire.endTransmission();

//  delay(70);
}

///////////////////////////////////////////////////////////////////////////////////////////
// general I2C communication routine

/***
 * This function reads Nbytes bytes from I2C device at address Address.
 * Put read bytes starting at register Register in the Data array.
 */
void Imu::I2Cread(uint8_t Address, uint8_t Register, uint8_t Nbytes,
                  uint8_t *Data)
{
  // Set register address
  Wire.beginTransmission(Address);
  Wire.write(Register);
  Wire.endTransmission();

  // Read Nbytes
  Wire.requestFrom(Address, Nbytes);
  uint8_t index = 0;

  while (Wire.available())
    Data[index++] = Wire.read();
}
