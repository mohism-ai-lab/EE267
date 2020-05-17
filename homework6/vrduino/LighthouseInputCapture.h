/**
 *  @class LighthouseInputCapture
 *  This class implements interrupts and timer decoding of photodiodes pulses.
 *  It inherits from a base InputCapture timer, which is a
 *  Teensy-specific library for precise timing interrupts.
 *
 *  The pins connected to the photodiodes are normally HI, but go LO when illuminated by
 *  the infrared pules. This Base InputCapture class will detect when the pins go LO, and
 *  trigger an ISR(). The ISR records the precise timing, and triggers the callback()
 *  in this class. This class will then decode the pulse length to determine whether
 *  it is a sweep or sync pulse.
 *
 *  If it is a sync pulse:
 *    - record sweep pulse timing data of the previous period into permanent buffers
 *     for read-out. reset temp buffers to be updated this period.
 *    - record additional info such as base station pitch and roll encoded in the pulse length.
 *      see: https: *github.com/nairol/LighthouseRedox/blob/master/docs/Light%20Emissions.md
 *    - data is recorded into the pulseData struct. see that struct for info on the fields
 *
 *  If it is a sweep pulse:
 *    - record pulse timing data into temp buffers
 *    - interreflections could cause multiple sweep pulses within the same period.
 *     choose the pulse that is closest in timing to the pulse from the previous period.
 *     the simplest solution would be to choose the first pulse and ignore the rest,
 *     but the adaptive solution seems to work better.
 *
 * This class can handle with 2 synchronized or 1 lighthouse station(s). It updates
 * pulseData.station[i] where i = 0 or 1, depending on which station it came from.
 *
 * If one base station is used with mode 'A' or 'B', the sync pulse timing is as follows:
 * (1: HI, 0: LO - sync pulse)
 * \verbatim
 * event: a         b         c           d
 * horiA: 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1
 * vertB: 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1
 *
 * event: ticks
 * a : t
 * b : t +  400000
 * c : t +  800000
 * d : t + 1200000
 * \endverbatim
 * During a sync pulse, the data from the previous period is moved to permanent
 * buffers in pulseData for read-out. Since only 1 base station is used, this
 * is always in pulseData.station[0].
 *
 * If two base stations are used with optical sync in modes 'B' and 'C',
 * each base station will still flash the sync pulse for each axis at 60 Hz,
 * but at a slight offset (20000 ticks) from each other.
 * Additionally, each one will skip sweeping every other sync, so that
 * only one lighthouse is sweeping at one time.
 * The timing is as follows:
 * \verbatim
 * event: a   b     c   d     e   f       g   h
 * horiB: 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1
 * vertB: 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1
 * horiC: 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1
 * vertC: 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1
 *
 * event: ticks : skip?
 * a: t          noskip
 * b: t +  20000 skip
 * c: t + 400000 noskip
 * d: t + 420000 skip
 * e: t + 800000 skip
 * f: t + 820000 noskip
 * g: t + 120000 skip
 * h: t + 140000 noskip
 * \endverbatim
 * Hence the time offset between the previous sync pulse is used to
 * determine if it's from station 0, station 1. The station mode cannot
 * be used to determine the identity, as this information is only available
 * after a full frame of databits has been transmitted through the sync pulse.
 * During a sync pulse from station i, the info from the previous pulse of
 * station i, is transmitted to permanent read-out buffers in pulseData.station[i]
 *
 */

#pragma once

#include "InputCapture.h"
#include "LighthouseOOTX.h"
#include "PulseData.h"
#include <Arduino.h>

#if !defined(CLOCKS_PER_MICROSECOND)
#if defined(KINETISK)
//#define CLOCKS_PER_MICROSECOND ((double)F_BUS / 1000000.0)
#define CLOCKS_PER_MICROSECOND (F_BUS / 1000000)
#elif defined(KINETISL)
// PLL is 48 Mhz, which is 24 clocks per microsecond, but
// there is a divide by two for some reason.
#define CLOCKS_PER_MICROSECOND (F_PLL / 2000000)
#endif
#endif

class LighthouseInputCapture : public InputCapture {

  public:
   /**
    * @param pin - Teensyduino pin number
    * @param polarityIn - FALLING or RISING
    * @param sensorIndexIn - 0(UL), 1(UR), 2(LR), 3(LL)
    * @param pulseDataIn - pulseData struct. this will be updated with pulse info during pulses
    */
    LighthouseInputCapture(int pin, int polarityIn, int sensorIndexIn, PulseData* pulseDataIn);

    /** polarity of edge. defined as FALLING or RISING in Arduino.h */
    int polarity;

    /** sensorIndex (0-3) */
    int sensorIndex;

    /** struct containing pulse data for all 4 diodes */
    PulseData* pulseData;

    /**
     *  overrides the base InputCapture callback function.
     *  this is called at the end of the ISR in InputCapture, with the
     *  timer value when the interrupt was called.
     *  this function will determine the pulse width and decode it.
     *  @param [in] val - the timer value when the interrupt, in clock ticks
     *
     */
    void callback(uint32_t val);

    /**
     * decode the length of a pulse in us
     * the base station's sync pulse contains information embedded in its length
     * decode the info base on this:
     * https: *github.com/nairol/LighthouseRedox/blob/master/docs/Light%20Emissions.md
     * @param [in] pulseLength - pulse width in microseconds
     * @param [out] skipBit - skipbit in the pulse
     * @param [out] dataBit - databit in the pulse
     * @param [out] axisBit - axis info in the pulse. 0: hori, 1: verti
     * @returns 1: sync pulse, 0: sweep pulse, -1 invalid pulse
     */
    int decodePulseLength(float pulseLength, bool  &skipBit, bool &dataBit, bool &axisBit);

};
