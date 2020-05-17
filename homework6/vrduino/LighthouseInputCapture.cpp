#include "LighthouseInputCapture.h"

LighthouseInputCapture::LighthouseInputCapture( int pinIn, int polarityIn, int sensorIndexIn, PulseData* pulseDataIn) :

  polarity(polarityIn),
  sensorIndex(sensorIndexIn),
  pulseData(pulseDataIn)

{

  // start timer (from Base InputCapture)
  begin(pinIn, polarity);
  //pulseData[0]->baseStationMode = 0;

}


/**  interrupt service routine for both edges (falling and rising) */
void LighthouseInputCapture::callback(uint32_t value) {

  //callback for falling edge:
  //just record the pulse position
  if (polarity == FALLING) {
    pulseData->fallingEdgeTicks[sensorIndex] = value;
    return;
  }

  //callback for rising edge:

  // get last time a falling edge was detected
  uint32_t fallingEdgeTicks = pulseData->fallingEdgeTicks[sensorIndex];
  uint32_t pulseLengthTicks = value - fallingEdgeTicks;

  //decode pulse base on pulse length
  int pulseType;
  float pulseLengthUS;
  bool skipBit, dataBit, axisBit;

  if (pulseLengthTicks <= 60 * CLOCKS_PER_MICROSECOND) {

    //decode quickly if sweep pulse, without going into decode function.
    pulseType = 0;

  } else {

    //call decode function to
    //get 3 bits of data encoded in the pulse length
    pulseLengthUS = float(pulseLengthTicks)/float(CLOCKS_PER_MICROSECOND);

    pulseType = decodePulseLength(pulseLengthUS, skipBit, dataBit, axisBit);

  }

  if (pulseType == 0) {
    // this is a sweep pulse

    //pid has been set during the sync pulse
    int pid = pulseData->currentIndex;

    //each sensor updates the same pulseData struct with pulse timing info of its owns sensor.
    //only update the temp buffer, the permanent buffer will be updated atomically during sync
    //axis=0: Horizontal, axis=1: Vertical
    uint32_t sweepTicks = fallingEdgeTicks - pulseData->lastValidSyncPulseTicks;

    int index = 2*sensorIndex + pulseData->station[pid].axis;

    pulseData->station[pid].numPulseDetectionsTemp[index]++;

    //we could still have multiple sweep pulses in a period
    //get difference from previous pulse position,
    // and choose the pulse with smallest difference
    long pulseDiff = labs((long long)sweepTicks -
      (long long)pulseData->station[pid].sweepPulseTicks[index]);

    if (pulseData->station[pid].numPulseDetectionsTemp[index] == 1 ||
      pulseDiff < (long)pulseData->station[pid].minPulseDifferences[index]) {

      pulseData->station[pid].sweepPulseTicksTemp[index] = sweepTicks;
      pulseData->station[pid].sweepPulseWidthTemp[index] = pulseLengthTicks;
      pulseData->station[pid].minPulseDifferences[index] = pulseDiff;

    }

  } else if (pulseType == 1 ) {
  // this is a sync pulse

    //During a sync pulses, we decode base station info,
    //and update the sweepPulseTicks buffer.
    //the numPulseDetections and pulseWidth are just for debugging purposes
    //numPulseDetections specifies how many sweep pulses were seen.
    //pulseWidth specifies the length of the pulse in clock ticks

    //All diodes will run this interrupt,
    //but we only want sensor0 to update everything.
    if (sensorIndex != 0) {
      return;
    }

    //add databit to ootx frame. we keep track of 2 frames X,Y in case there
    //2 base stations.
    //the sync pulse order is as follows:
    //HX HY        VX VY        HX HY        VX VY
    //t_HY - t_HX =  20000 ticks
    //t_VX - t_HY = 380000 ticks

    //use the time since the last sync pulse to decode whether pid=0 or 1
    int pid = 0;
    if (pulseData->lastAnySyncPulseTicks > 0) {

      uint32_t sweepPulsePeriod = fallingEdgeTicks -
        pulseData->lastAnySyncPulseTicks;

      pid = (sweepPulsePeriod >= 40000) ? 0 : 1;

      pulseData->station[pid].ootx.addBit(dataBit);

      pulseData->station[pid].ootx.getBaseStationInfo(
        pulseData->station[pid].pitch,
        pulseData->station[pid].roll,
        pulseData->station[pid].mode
      );

    }


    //copy data from period that just finished from temp to permananent buffer

    //if some diodes have 0 detections, then sweeppulseticks, pulseWidth will be 0.
    if (!pulseData->station[pid].skip) {

      for (int i = 0; i < 4; i++) {

        int j = 2*i + pulseData->station[pid].axis;
        pulseData->station[pid].sweepPulseTicks[j] = pulseData->station[pid].sweepPulseTicksTemp[j];
        pulseData->station[pid].sweepPulseWidth[j] = pulseData->station[pid].sweepPulseWidthTemp[j];
        pulseData->station[pid].numPulseDetections[j] = pulseData->station[pid].numPulseDetectionsTemp[j];

      }

      pulseData->station[pid].dataAvailable = true;

    }

    //then prepare flags for next period
    if (!skipBit) {

      //reset vectors. only registers pertaining to current axis
      for (int i = 0; i < 4; i++) {

        int index = 2*i + (int)axisBit;
        pulseData->station[pid].sweepPulseTicksTemp[index] = 0;
        pulseData->station[pid].sweepPulseWidthTemp[index] = 0;
        pulseData->station[pid].numPulseDetectionsTemp[index] = 0;

      }

      pulseData->lastValidSyncPulseTicks = fallingEdgeTicks;
      pulseData->currentIndex = pid;

    }

    pulseData->station[pid].axis = axisBit;
    pulseData->station[pid].skip = skipBit;

    //keep record of every sync pulse ticks, even invalid ones
    pulseData->lastAnySyncPulseTicks = fallingEdgeTicks;

  }

}

/**
 *  decodes the pulse length.
 *  also writes skip, data, and axis bit
 *  see this website for sync pulse lengths:
 *    https://github.com/nairol/LighthouseRedox/blob/master/docs/Light%20Emissions.md
 *  @returns
 *    - 1 if this was a sync pulse (i.e., if it could be decoded)
 *    - 0 if this was a sweep pulse
 *    - -1 if not a valid pulse (too long or too short)
 */
int LighthouseInputCapture::decodePulseLength(float pulseLength, bool  &skipBit, bool &dataBit, bool &axisBit) {

  float tolerance = 5;
  if (pulseLength <= 62.5 - tolerance) {
    //pulse is a sweep pulse
    return 0;
  } else if ((pulseLength > 62.5-tolerance) && (pulseLength <= 62.5+tolerance)) {
    skipBit = 0;
    dataBit = 0;
    axisBit = 0;
    return 1;
  } else if ((pulseLength > 72.9-tolerance) && (pulseLength <= 72.9+tolerance)) {
    skipBit = 0;
    dataBit = 0;
    axisBit = 1;
    return 1;
  } else if ((pulseLength > 83.3-tolerance) && (pulseLength <= 83.3+tolerance)) {
    skipBit = 0;
    dataBit = 1;
    axisBit = 0;
    return 1;
  } else if ((pulseLength > 93.8-tolerance) && (pulseLength <= 93.8+tolerance)) {
    skipBit = 0;
    dataBit = 1;
    axisBit = 1;
    return 1;
  } else if ((pulseLength > 104-tolerance) && (pulseLength <= 104+tolerance)) {
    skipBit = 1;
    dataBit = 0;
    axisBit = 0;
    return 1;
  } else if ((pulseLength > 115-tolerance) && (pulseLength <= 115+tolerance)) {
    skipBit = 1;
    dataBit = 0;
    axisBit = 1;
    return 1;
  } else if ((pulseLength > 125-tolerance) && (pulseLength <= 125+tolerance)) {
    skipBit = 1;
    dataBit = 1;
    axisBit = 0;
    return 1;
  } else if ((pulseLength > 135-tolerance) && (pulseLength <= 135+tolerance)) {
    skipBit = 1;
    dataBit = 1;
    axisBit = 1;
    return 1;
  } else {
    return -1;
  }

}
