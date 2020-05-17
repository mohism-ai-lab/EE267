/**
 * @class PoseTracker
 * This class performs tracking and sensor fusion using values from the
 * IMU and lighthouse.
 * This class is more of a Manager.
 * Low-level timing and sampling is performed by the Lighthouse and Imu classes.
 * All the math is done in PoseMath.h
 *
 */

#pragma once
#include "Lighthouse.h"
#include "OrientationTracker.h"
#include "PoseMath.h"
#include "simulatedLighthouseData.h"

class PoseTracker : public OrientationTracker {

  public:

    /**
     * constructor that initializes alpha filter params
     * @param [in] alphaImuTiltCorrectionIn - alpha value [0,1] for complementary filter
     *   1: ignore tilt correction from acc. 0: use full tilt correction from acc
     * @param [in] int baseStationMode - 0:A, 1:B, 2:C. Only responde to measurements
     *   from specified base station
     * @param [in] simulateLighthouseIn - if true, get lighthouse timings from external file
     *   and ignore lighthouse sensor, and IMU readings.
     */
    PoseTracker(double alphaImuFilterIn, int baseStationMode, bool simulateLighthouseIn=false) ;

    /**
     * samples photodiodes and processes timing to estimate pose.
     * updates position and quaternion variables.
     * updates the orientation, q
     * @returns
     *   - -2: no lighthouse timing available.
     *   - -1: lighthouse timing available, but invalid data because at
     *         least 1 diode has 0 detections
     *   -  0: timing available and all diodes have detections,
     *         but homography estimation fails
     *   -  1: timing available, diodes have detections, and pose updated
     */
    int processLighthouse();

    /**
     * x,y,z position of board from base station. units is mm
     */
    const double * getPosition() const { return position; };

    /**
     * get quaternion of board from base station.
     */
    const Quaternion& getQuaternionHm() const { return quaternionHm; };

    /**
     * get pitch of base station in degrees
     */
    double getBaseStationPitch() { return baseStationPitch; };

    /**
     * get roll of base station in degrees
     */
    double getBaseStationRoll() { return baseStationRoll; };

    /**
     * get mode of base station (0:A, 1:B, 2:C)
     */
    int getBaseStationMode() { return baseStationMode; };

    /**
     *  get 2D normalized coordinates of diodes, in base station 'sensor' plane
     *  order: sensor0.x, sensor0.y, ... sensor3.x, sensor3.y
     */
    const double * getPosition2D() const { return position2D; };

    /**
     * get clock ticks of sweep pulses for each diode, for each axis.
     * order: sensor0.x, sensor0.y, ... sensor3.x, sensor3.y
     */
    const unsigned long * getClockTicks() const { return clockTicks; };

    /**
     * get number of sweep pulse detections for each diode, for each axis.
     * order: sensor0.x, sensor0.y, ... sensor3.x, sensor3.y
     */
    const unsigned long * getNumPulseDetections() const { return numPulseDetections; };

    /**
     * get width of sweep pulse detections for each diode, for each axis.
     * order: sensor0.x, sensor0.y, ... sensor3.x, sensor3.y
     */
    const unsigned long *  getPulseWidth() const { return pulseWidth; };


    /**
     * sets desired mode of base station
     * @param [in] mode - desired mode (0:A, 1:B, 2:C)
     */
    void setMode(int mode) { baseStationMode = mode; };

  protected:

    /**
     * Use the functions in PoseMath.h to get from clockTicks, to a new
     * position and quaternion estimate, in the base station frame, where
     * y is the normal of the top face of the base station, z points to the back
     * You should not do any math here; use the functions in PoseMath.h.
     *
     * You will need to access the following fields defined in this class:
     *  - clockTicks
     *  - position2D
     *  - positionRef
     *  - position
     *  - quaternionHm
     *
     * The position and quaternionHm variables should be updated to the
     * new estimate.
     *
     * @returns  0:if any errors occur (eg failed matrix inversion),
     *           1: if successful.
     */
    int updatePose();

    /** lighthouse object for sampling from lighthouse */
    Lighthouse lighthouse;


    /**
     * if true, clockTicks and baseStationPitch/Roll come from external file
     * IMU is not turned off
     */
    bool simulateLighthouse;

    /**
     * internal counter of simulated values
     */
    int simulateLighthouseCounter;

    /**
     * most recent estimate of translation (ordrer: x,y,z) in mm
     */
    double position[3];


    /**
     * most recent  estimate of quaternion from the homography.
     */
    Quaternion quaternionHm;


    /**
     * base station pitch in degrees (rotation about x-axis)
     * ref frame is y points up, z points toward back of lighthouse (usually)
     */
    double baseStationPitch;

    /**
     * base station roll in degrees (rotation about z-axis)
     * ref frame is y points up, z points toward back of lighthouse (usually)
     */
    double baseStationRoll;

    /**
     * base station mode (0:A, 1:B, 2:C)
     */
    int baseStationMode;

    /**
     * 2D normalied coordinates of 4 photodiodes. These are the measured
     * reprojection of the photodiodes on the a plane a unit distance away
     * from the base station.
     * order is sensor0x, sensor0y,...sensor3x, sensor3y
     */
    double position2D[8];

    /**
     * 2D actual coordinates of the photodioes, based on the board layout.
     * units is mm. order is: sensor0x, sensor0y,...sensor3x, sensor3y
     */
    double positionRef[8] = {-42.0, 25.0, 42.0, 25.0, 42.0, -25.0, -42.0, -25.0};

    /**
     * clock ticks of sweep pulses since last sync pulse, as detected by
     * each photodiode
     * order is : sensor0H, sensor0V, ... sensor3H, sensor3V
     * not needed for visualization, can be used for debugging
     */
    unsigned long clockTicks[8];

    /**
     * number of pulse detections
     * order is : sensor0H, sensor0V, ... sensor3H, sensor3V
     * would be more than 1 if there are inter-reflections
     * would be 0 if 1 is covered
     */
    unsigned long numPulseDetections[8];

    /**
     * pulse width in clock ticks. 1 clock ticks is (1/48MHz) s
     * order is : sensor0H, sensor0V, ... sensor3H, sensor3V
     * for debugging purposes
     */
    unsigned long pulseWidth[8];


};
