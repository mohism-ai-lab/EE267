/**
 *  This class decodes an incoming bitstream from the individual data bits sent by the
 *  lighthouse base station.
 *
 *  Details:  First, we will be looking for a preamble, that is a binary sequence of 17 zeros
 *            and 1 one. Then, we read the length of the payload and then the payload.
 *
 *  OOTX Frame: details of the format of OOTX frames and also the code base of this class are
 *              adopted from nairol (https://github.com/nairol) - thanks for the documentation
 *              and the code !!
 *              https://github.com/nairol/LighthouseRedox/blob/master/docs/Light%20Emissions.md
 *
 *  Gordon Wetzstein
 *  gordon.wetzstein@stanford.edu
 *  Stanford University
 *  September 12, 2017
 *
 */

#pragma once

#include <Wire.h>

class LighthouseOOTX {

  //////////////////////////////////////////////////////////////////////////////////////////
  // private variables
  private:

    // flag that indicates if preamble of OOTX frame was received (data is only being recorded after)
    bool waiting_for_preamble;

    // flag that indicates if the length of the payload was received (this is the second 16 bit
    // chunck transmitted after the preamble
    bool waiting_for_length;

    // variable to store incoming bitstream in
    // even though any set of 2 bytes is read separately, we need to check if the 17th bit (the sync
    // bit) is set correctly, so let's use unsigned long datatype (32 bit) instead of unsigned short (16 bits)
    unsigned long accumulator;

    // count number of bits collected in accumulator
    unsigned accumulator_bits;

    // counter for current data byte that's being written to the list
    unsigned rx_bytes;
    unsigned padding; // if there is a padding byte

    // length of payload in bytes
    unsigned length;

    // flag that indicates if the entire payload was read
    bool complete;

    // flag that indicates whether payload was completely read at least once
    bool bCompleteOnce;

    // this is a buffer with the actual data bytes; does not contain the sync bits
    unsigned char bytes[256];

    // pitch and roll angles in degrees (only available afer the entire ootx frame is read at least once)
    double baseStationPitch  = 0.0;
    double baseStationRoll   = 0.0;

    int baseStationMode;

  //////////////////////////////////////////////////////////////////////////////////////////
  // public variables

  //////////////////////////////////////////////////////////////////////////////////////////
  // private functions
  private:

    // something went wrong when trying to decode the bitstream, start again
    void reset();

    // read a 16 bit chung of data, add to list
    void add_word(unsigned long word);

    // flip the order of the last two bytes in this 32 bit sequence (do not reverse bit order)
    unsigned long flipByteOrder(unsigned long bitsequence);

  //////////////////////////////////////////////////////////////////////////////////////////
  // public functions
  public:

    // constructor
	  LighthouseOOTX();

    // add an incoming data bit for decoding
	  void addBit(unsigned long bit);

    // print all decoded data
    void printAllData(void);

    // see if OOTX info is available
    bool isOOTXInfoAvailable(void) { return bCompleteOnce; }

    // get pitch and roll angles of the base station from the OOTX frame - this is reported in degrees
    void getBaseStationPitchAndRoll(volatile double &pitch, volatile double &roll);

    int getBaseStationMode();

    void getBaseStationInfo(volatile double &pitch, volatile double &roll, volatile int &mode);

};
