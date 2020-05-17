#include "Lighthouse.h"


Lighthouse::Lighthouse() :

  // init pulsedata and timer interrupts.
  // all interrupts share the address of the pulse data, so
  // they update the same struct.
  pulseData(),
  timer0_ic_falling(sensor0_pin_falling, FALLING, 0, &pulseData),
  timer0_ic_rising( sensor0_pin_rising,  RISING,  0, &pulseData),
  timer1_ic_falling(sensor1_pin_falling, FALLING, 1, &pulseData),
  timer1_ic_rising( sensor1_pin_rising,  RISING,  1, &pulseData),
  timer2_ic_falling(sensor2_pin_falling, FALLING, 2, &pulseData),
  timer2_ic_rising( sensor2_pin_rising,  RISING,  2, &pulseData),
  timer3_ic_falling(sensor3_pin_falling, FALLING, 3, &pulseData),
  timer3_ic_rising( sensor3_pin_rising,  RISING,  3, &pulseData)

 {

  // turn standby pin to low
  pinMode(standbyPin, OUTPUT);
  digitalWrite(standbyPin, LOW);

}


bool Lighthouse::readTimings(int baseStationMode, unsigned long values[8], unsigned long numPulseDetections[8],
  unsigned long pulseWidth[8], double &pitch, double &roll) {

  //disable interrupts so that pulses aren't updated in between reads
  __disable_irq();

  //get the pulse index in pulseData.station that matches the base station mode
  int pid = -1;
  for (int i = 0; i < 2; i++) {
    if (pulseData.station[i].dataAvailable && baseStationMode == pulseData.station[i].mode) {
      pid = i;
    }
  }

  bool success = pid >= 0;

  if (success) {

    for (int i = 0; i < 8; i++) {
      //copy values from pulseData into output buffers
      values[i] = pulseData.station[pid].sweepPulseTicks[i];
      numPulseDetections[i] = pulseData.station[pid].numPulseDetections[i];
      pulseWidth[i] = pulseData.station[pid].sweepPulseWidth[i];
    }

    pitch = pulseData.station[pid].pitch;
    roll = pulseData.station[pid].roll;

    //we have read, so set dataAvailable to false
    //to prevent multiple reads of the same values
    pulseData.station[pid].dataAvailable = false;

  }

  __enable_irq();

  return success;

}
