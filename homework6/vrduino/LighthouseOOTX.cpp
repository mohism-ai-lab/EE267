////////////////////////////////////////////////////////////////////////////////////////////
//  This class decodes an incoming bitstream from the individual data bits sent by the
//  lighthouse base station.
//
//  Details:  First, we will be looking for a preamble, that is a binary sequence of 17 zeros
//            and 1 one. Then, we read the length of the payload and then the payload.
//
//  OOTX Frame: details of the format of OOTX frames and also the code base of this class are
//              adopted from nairol (https://github.com/nairol) - thanks for the documentation
//              and the code !!
//              https://github.com/nairol/LighthouseRedox/blob/master/docs/Light%20Emissions.md
//
//  Gordon Wetzstein
//  gordon.wetzstein@stanford.edu
//  Stanford University
//  September 12, 2017
//
////////////////////////////////////////////////////////////////////////////////////////////
#include "LighthouseOOTX.h"

////////////////////////////////////////////////////////////////////////////////////////////
// constructor - reset all variables

LighthouseOOTX::LighthouseOOTX() {
  reset();
  complete      = 0;
  length        = 0;
  bCompleteOnce = false;
}

////////////////////////////////////////////////////////////////////////////////////////////
// reset all variables and start scanning bitsequence

void LighthouseOOTX::reset() {
  waiting_for_preamble  = 1;
  waiting_for_length    = 1;
  accumulator           = 0;
  accumulator_bits      = 0;
  rx_bytes              = 0;
}

////////////////////////////////////////////////////////////////////////////////////////////
// add a detected databit to the sequence

void LighthouseOOTX::addBit(unsigned long bit) {

  if (bit != 0 && bit != 1) {
    // something is wrong.  dump what we have received so far
    reset();
    return;
  }

  // add this bit to our incoming word
  accumulator = (accumulator << 1) | bit;
  accumulator_bits++;

  //////////////////////////////////////////////////////////////////////////////////////////
  // before doing anything else, wait for the preamble of
  // 17 zeros and 1 one

  if (waiting_for_preamble) {

    // 17 zeros, followed by a 1 == 18 bits
    if (accumulator_bits != 18) {
      return;
    }

    if (accumulator == 0x1)
    {
      // received preamble, start on data
      // first we'll need the length
      waiting_for_preamble = 0;
      waiting_for_length = 1;

//      Serial.print("success: received preamble: ");
//      Serial.println(accumulator,BIN);

      accumulator       = 0;
      accumulator_bits  = 0;
      return;
    }

    // we've received 18 bits worth of preamble,
    // but it is not a valid thing.  hold onto the
    // last 17 bits worth of data
    accumulator_bits--;
    accumulator = accumulator & 0x1FFFF;
    return;
  }

  ////////////////////////////////////////////////////////////////////////////////////////

  // we're receiving data!  accumulate until we get a sync bit
  if (accumulator_bits != 17)
    return;

  if ((accumulator & 1) == 0) {

//    Serial.println("reset due to sync bit :( !");

    // no sync bit. go back into waiting for preamble mode
    reset();
    return;
  }

  // hurrah!  the sync bit was set
  unsigned long word = accumulator >> 1;
  accumulator = 0;
  accumulator_bits = 0;

  add_word(word);
}

//////////////////////////////////////////////////////////////////////////////////////////
// add a 16 bit / 2 byte sequence to the detected payload

void LighthouseOOTX::add_word(unsigned long word) {

  if (waiting_for_length) {

    // these bits are coming in wwith  the least significant bit first!
    // let's flip the order so that
    word = flipByteOrder(word);

    length = word + 4; // add in the CRC32 length
    padding = length & 1;
    waiting_for_length = 0;
    rx_bytes = 0;

    // error!
    if (length > sizeof(bytes)) {
      Serial.print("WARNING: length of payload seems questionable: ");
      Serial.println(word);
      length = 33; // just set it to 33 by default
      //reset();
    }

    return;
  }

  bytes[rx_bytes++] = (word >> 8) & 0xFF;
  bytes[rx_bytes++] = (word >> 0) & 0xFF;

  if (rx_bytes < length + padding)
    return;

  // we are at the end!

  // save base station pitch and roll from bytes 20 and 22
  //accelerometer acc axis: z points back, y is normal to top face
  double accx = double(int8_t(bytes[20]))/127.0;
  double accy = double(int8_t(bytes[21]))/127.0;
  double accz = double(int8_t(bytes[22]))/127.0;

  double acc_norm = sqrt( accx*accx + accy*accy + accz*accz );
  accx = accx/acc_norm;
  accy = accy/acc_norm;
  accz = accz/acc_norm;

  double signAccy = double((accy > 0) - (accy < 0));
  baseStationRoll     = 360 * -atan2(-accx,accy) / (2*PI);
  baseStationPitch    = 360 * -atan2(accz, signAccy*sqrt(accx*accx + accy*accy)) / (2*PI);

  baseStationMode = (int) bytes[31];

  //baseStationRoll     = 90.0 * double(int8_t(bytes[20]))/127.0;
  //baseStationPitch    = -90.0 * double(int8_t(bytes[22]))/127.0;

  complete            = 1;
  bCompleteOnce       = true;
  waiting_for_length  = 1;

  // reset to wait for a preamble
  reset();
}

//////////////////////////////////////////////////////////////////////////////////////////
// flip order of the last two bytes in a 32 bit variables
// this seems necessary to reliably decode the data

unsigned long LighthouseOOTX::flipByteOrder(unsigned long bitsequence) {
  return (bitsequence >> 8) | ((bitsequence & 0xFF) << 8);
}

//////////////////////////////////////////////////////////////////////////////////////////
// print all data of possible interest if the entire stream was decoded at least once
// need to flip byte order for all data, disregarding how many bytes there are in the variable (except for anything with 1 byte)

void LighthouseOOTX::printAllData(void) {

  // print only if datastream was decoded at least once
  if (bCompleteOnce) {

    Serial.println("-------------------------------------------");
    Serial.print("OOTX Frame Information (");
    Serial.print(length);
    Serial.println("  bytes recorded)");

    ///////////////////////////////////////////////////////////////////////////////////////
    // first 16 bits are firmware (bits 15 to 6) and protocol (bits 5 to 0) version
    //unsigned short first16bitvariable = (bytes[0] << 8) + bytes[1];
    unsigned short first16bitvariable = (bytes[1] << 8) + bytes[0];

    unsigned short fw_version       = (first16bitvariable & 0xFFC0) >> 6;
    unsigned short protocol_version = (first16bitvariable & 0x3F);
    Serial.print("Firmware version: ");
    Serial.print(fw_version);
    Serial.print(", protocol version: ");
    Serial.println(protocol_version);

    // can check firmware version in steamvr settings->general->create system report->devices


    ///////////////////////////////////////////////////////////////////////////////////////
    // bytes 3-6 are a uint32 with the unique identifier of the base station

    //unsigned int baseStationID = (bytes[2] << 24) + (bytes[3] << 16) + (bytes[4] << 8) + bytes[5];
    unsigned int baseStationID = (bytes[5] << 24) + (bytes[4] << 16) + (bytes[3] << 8) + bytes[2];
    Serial.print("Base station ID: 0x");
    Serial.println(baseStationID,HEX);

    ///////////////////////////////////////////////////////////////////////////////////////
    // bytes 7,8 and 9,10 are two double16 values for the phases of rotor 0 and 1


    ///////////////////////////////////////////////////////////////////////////////////////
    // byte 16 is a uint8 with the hardware version

    unsigned int hwVersion = bytes[15];
    Serial.print("Hardware version: 0x");
    Serial.println(hwVersion,HEX);

    ///////////////////////////////////////////////////////////////////////////////////////
    // bytes 21,22,23 are int8 values with the arbitrarily scaled accelerometer directions in x,y,z

    int8_t accX = bytes[20];
    int8_t accY = bytes[21];
    int8_t accZ = bytes[22];
    Serial.print("Accelerometer: ");
    Serial.print(accX);
    Serial.print(", ");
    Serial.print(accY);
    Serial.print(", ");
    Serial.println(accZ);

    ///////////////////////////////////////////////////////////////////////////////////////
    // bytes 32 is uint8 current mode of base station (default: 0=A, 1=B, 2=C)
    unsigned int currentMode = bytes[31];
    Serial.print("Current mode: ");
    if (currentMode==0) {
      Serial.println("A");
    } else if (currentMode==1) {
      Serial.println("B");
    } else if (currentMode==2) {
      Serial.println("C");
    } else {
      Serial.println("???");
    }

    Serial.println("-------------------------------------------");

  }
}

//////////////////////////////////////////////////////////////////////////////////////////

void LighthouseOOTX::getBaseStationPitchAndRoll(volatile double &pitch, volatile double &roll) {
  pitch = baseStationPitch;
  roll  = baseStationRoll;
}

int LighthouseOOTX::getBaseStationMode() {
  return (int) baseStationMode;
}

void LighthouseOOTX::getBaseStationInfo(volatile double &pitch,
  volatile double &roll, volatile int &mode) {
  if (isOOTXInfoAvailable()) {
    pitch = baseStationPitch;
    roll = baseStationRoll;
    mode = baseStationMode;
  }
}
