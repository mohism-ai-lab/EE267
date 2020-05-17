#include "OrientationMath.h"

/** TODO: see documentation in header file */
double computeAccPitch(double acc[3]) {

  int signAccY = (acc[1] >= 0) * 1 + (acc[1] < 0) * (-1);
  double pitch = -atan2(acc[2],
      signAccY * sqrt(sq(acc[0]) + sq(acc[1]))) * RAD_TO_DEG;
  return pitch;

}

/** TODO: see documentation in header file */
double computeAccRoll(double acc[3]) {

  return -atan2(-acc[0], acc[1]) * RAD_TO_DEG;

}

/** TODO: see documentation in header file */
double computeFlatlandRollGyr(double flatlandRollGyrPrev, double gyr[3], double deltaT) {

  return flatlandRollGyrPrev + deltaT * gyr[2];

}

/** TODO: see documentation in header file */
double computeFlatlandRollAcc(double acc[3]) {

  return RAD_TO_DEG * atan2(acc[0], acc[1]);

}

/** TODO: see documentation in header file */
double computeFlatlandRollComp(double flatlandRollCompPrev, double gyr[3], double flatlandRollAcc, double deltaT, double alpha) {

  return alpha * ( flatlandRollCompPrev + deltaT * gyr[2] ) +
    (1 - alpha) * flatlandRollAcc ;

}


/** TODO: see documentation in header file */
void updateQuaternionGyr(Quaternion& q, double gyr[3], double deltaT) {

  // integrate gyro
  double normW = sqrt( gyr[0]*gyr[0] + gyr[1]*gyr[1] + gyr[2]*gyr[2] ); // shouldn't matter that it's in deg/s
  Quaternion qDelta;
  if (normW >= 1e-8) {
    // really important to prevent division by zero on Teensy!
    qDelta = Quaternion().setFromAngleAxis(
      deltaT * normW, gyr[0] / normW, gyr[1] / normW, gyr[2]/normW);
  }

  //update quaternion variable
  q = Quaternion().multiply(q,qDelta).normalize();

}


/** TODO: see documentation in header file */
void updateQuaternionComp(Quaternion& q, double gyr[3], double acc[3], double deltaT, double alpha) {

  // integrate gyro
  double normW = sqrt( gyr[0]*gyr[0] + gyr[1]*gyr[1] + gyr[2]*gyr[2] ); // shouldn't matter that it's in deg/s
  Quaternion qDelta;
  if (normW >= 1e-8) {
    // really important to prevent division by zero on Teensy!
    qDelta = Quaternion().setFromAngleAxis(
      deltaT * normW, gyr[0] / normW, gyr[1] / normW, gyr[2]/normW);
  }

  Quaternion qw = Quaternion().multiply(q,qDelta).normalize();

  // get accelerometer quaternion in world
  Quaternion qa = Quaternion(0,acc[0],acc[1],acc[2]);
  qa = qa.rotate(qw);

  // compute tilt correction quaternion
  double normA = sqrt( qa.q[1]*qa.q[1] + qa.q[2]*qa.q[2] + qa.q[3]*qa.q[3] );
  double phi = RAD_TO_DEG * acos(qa.q[2]/normA);

  // tilt correction quaternion
  double normN = sqrt( qa.q[1]*qa.q[1] + qa.q[3]*qa.q[3] );
  Quaternion qt;
  if (normN >= 1e-8) { // really important to prevent division by zero on Teensy!
    qt = Quaternion().setFromAngleAxis( (1-alpha)*phi, -qa.q[3]/normN, 0.0, qa.q[1]/normN).normalize();
  }

  // update complementary filter
  q = Quaternion().multiply(qt, qw).normalize();

}
