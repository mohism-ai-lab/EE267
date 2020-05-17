/** 
 * This class sets manages a set of (four) photodiodes to detect pulses
 * the base statinons.
 * It sets up timing interrupts to detect timing information from the pulses.
 * It provides access to the pulse data through the readTimings() function.
 */

#pragma once
#include "LighthouseInputCapture.h"
#include <Wire.h>
#include "PulseData.h"


class Lighthouse {

  public:

    /** constructor */
    Lighthouse();


    /**
     * function that reads out most recent pulse timings
     * values are in 8 element arrays. the order corresponds to:
     * [sweepH0, sweepV0, ... sweepH3, sweepV3].
     * to ensure a synchronized read-out of all 4 sensors, interrupts are
     * turned off when this function is called.
     * @param [in] baseStationMode - mode of desired base station (0:A, 1:B, 2:C).
     *   values from base station with desired mode will be reported.
     * @param [in,out] values - clock timings of sweep pulses, in clock ticks (48 MHz)
     * @param [in,out] numPulseDetections - number of sweep pulses detected. for debugging
     *   purposes. can be used to detect interreflections
     * @param [in,out] pulseWidth - the pulse widths of the sweep pulses. for debugging
     * @returns true if new data is available from the base station that matches the input mode,
     *  false if data is not available
     *
     */
    bool readTimings(int baseStationMode, unsigned long values[8], unsigned long numPulseDetections[8],
      unsigned long pulseWidth[8], double &pitch, double &roll);

  private:

    /** the pins of of the sensors */
    int sensor0_pin_rising  = 5;
    int sensor0_pin_falling = 6;
    int sensor1_pin_rising  = 9;
    int sensor1_pin_falling = 10;
    int sensor2_pin_rising  = 20;
    int sensor2_pin_falling = 21;
    int sensor3_pin_rising  = 22;
    int sensor3_pin_falling = 23;

    /** struct that contain pulse info */
    PulseData pulseData;

    /** timer interrupts*/
    LighthouseInputCapture timer0_ic_falling;
    LighthouseInputCapture timer0_ic_rising;
    LighthouseInputCapture timer1_ic_falling;
    LighthouseInputCapture timer1_ic_rising;
    LighthouseInputCapture timer2_ic_falling;
    LighthouseInputCapture timer2_ic_rising;
    LighthouseInputCapture timer3_ic_falling;
    LighthouseInputCapture timer3_ic_rising;

    /** standby pin (turn low to enable sensors) */
    int standbyPin          = 12;

};
