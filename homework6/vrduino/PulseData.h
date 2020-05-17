#pragma once

/**
 *
 * This struct contains info about the pulse data such as clock timings,
 * and base station info.
 *
 * This struct can handle data from 2 base stations, synced to each other.
 * Data that is unique to each base station is stored in a Station struct.
 * There is a array of 2 Stations to keep track of data from each station.
 * The ordering of the stations in the array is arbitrary, hence users should
 * check the mode of accessing checking pulseData->station[i].mode after a
 * base station info frame has been received.
 *
 * Some fields have a 'temp' and permanent buffer. The 'temp' buffers are
 * updated by sweep pulses. At the start of a new sync pulse, the data
 * from the 'temp' buffers are moved into permanent buffers for read-out.
 * Users should only readout from the non-temp buffers, as data
 * in the temp buffers could still be updated. See timing diagram:
 *
 * \verbatim
 * period: |-----Tprev-----|-----Tcurr--
 * sync  : 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1
 * event :                 a           b
 *
 * event : description
 * a : sync pulse. data from temp buffers from Tprev
 *     moved to permanent buffers. temp buffers reset
 *     to be updated during Tcurr.
 * b : read-out requested. complete data should be read
 *     permanent buffers.
 * \endverbatim
 *
 * Fields are listed as 'volatile' since they will be updated in an ISR.
 *
 * If a field is an 8d vector, the info is from:
 * [sensor0H, sensor0V, ... sensor3H, sensor3V]
 *
 */

struct PulseData {

  struct Station {

    /**
     * the ticks of the sweep pulse from the previous period
     */
    volatile uint32_t sweepPulseTicks[8];
    volatile uint32_t sweepPulseTicksTemp[8];

    /**
     * the width of the sweep pulse of the previous period
     */
    volatile uint32_t sweepPulseWidth[8];
    volatile uint32_t sweepPulseWidthTemp[8];

    /**
     * the number of detections for each sensor in the previous period
     * if a diode is covered, then detections should be 0
     * detections could be > 1 because of interreflections
     */
    volatile uint32_t numPulseDetections[8];
    volatile uint32_t numPulseDetectionsTemp[8];

    /**
     * pulse difference between current and previous period. used
     * to choose which pulse to select in the case of multiple
     * sweep pulse detections due to interreflections
     */
    volatile uint32_t minPulseDifferences[8];

    /**
     * true if there are new pulse timings from this station.
     */
    volatile bool dataAvailable;

    /** 0 if horizontal, 1 if vertical */
    volatile int axis;

    /** true if current period has a skip bit. (laser turns off for sweep)  */
    volatile bool skip;

    /** in degrees */
    volatile double pitch;

    /** in degrees */
    volatile double roll;

    /** 0:A, 1:B, 2:C */
    volatile int mode;

    /** decoder for base station info */
    LighthouseOOTX ootx;

    Station() :
      sweepPulseTicks{0,0,0,0,0,0,0,0},
      sweepPulseTicksTemp{0,0,0,0,0,0,0,0},
      sweepPulseWidth{0,0,0,0,0,0,0,0},
      sweepPulseWidthTemp{0,0,0,0,0,0,0,0},
      numPulseDetections{0,0,0,0,0,0,0,0},
      numPulseDetectionsTemp{0,0,0,0,0,0,0,0},
      minPulseDifferences{0,0,0,0,0,0,0,0},
      dataAvailable(false),
      axis(0),
      skip(true),
      pitch(0.0),
      roll(0.0),
      mode(-1),
      ootx()
    {

   }

  };

  int currentIndex;

  /**
   * time when the previous valid sync pulse started
   * valid means a sync pulse with skip = 0
   */
  volatile uint32_t lastValidSyncPulseTicks;

  /**
   * time when the previous valid or invalid sync pulse started
   */
  volatile uint32_t lastAnySyncPulseTicks;

  /**
   * ticks of the last falling edge for each sensor (0-3)
   */
  volatile uint32_t fallingEdgeTicks[4];

  /**
   * Array of data from each station
   */
  Station station[2];

  PulseData() :
    //initialize fields
    currentIndex(0),
    lastValidSyncPulseTicks(0),
    lastAnySyncPulseTicks(0),
    fallingEdgeTicks{0,0,0,0},
    station{Station(), Station()}
  {}
};

typedef PulseData PulseData;
