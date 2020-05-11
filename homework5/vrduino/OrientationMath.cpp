#include "OrientationMath.h"

/** TODO: see documentation in header file */
double computeAccPitch(double acc[3]) {
  double sign_y;
  if (acc[1] > 0) {
    sign_y = 1;
  } else if (acc[1] == 0) {
    sign_y = 0;
  } else {
    sign_y = -1;
  }
  return -atan2(acc[2], sign_y * sqrt(sq(acc[0]) + sq(acc[1]))) * 180 / PI;

}

         /** TODO: see documentation in header file */
double computeAccRoll(double acc[3]) {

  return -atan2(-acc[0], acc[1]) * 180/PI;

}

/** TODO: see documentation in header file */
double computeFlatlandRollGyr(double flatlandRollGyrPrev, double gyr[3], double deltaT) {
  return flatlandRollGyrPrev + deltaT * gyr[2];
}

/** TODO: see documentation in header file */
double computeFlatlandRollAcc(double acc[3]) {
  return 360 / (2 * PI) * atan2(acc[0], acc[1]);

}

/** TODO: see documentation in header file */
double computeFlatlandRollComp(double flatlandRollCompPrev, double gyr[3], double flatlandRollAcc, double deltaT, double alpha) {

  double gyro_only = computeFlatlandRollGyr(flatlandRollCompPrev, gyr, deltaT);
  return alpha * gyro_only + (1 - alpha) * flatlandRollAcc;

}


/** TODO: see documentation in header file */
void updateQuaternionGyr(Quaternion& q, double gyr[3], double deltaT) {
  // qw = q_t * q_d -> normalize

  //  norm of gyro to rotation quaternion
  double norm = sqrt( sq(gyr[0]) + sq(gyr[1]) + sq(gyr[2]));

  Quaternion q_d = q.clone();

  if (norm >= 1e-8) { //else ignore measurement; prevent div by 0
    q_d = q_d.setFromAngleAxis(deltaT * norm, gyr[0] / norm, gyr[1] / norm, gyr[2] / norm);
  }

  q = Quaternion().multiply(q, q_d).normalize();

  
}


/** TODO: see documentation in header file */
void updateQuaternionComp(Quaternion& q, double gyr[3], double acc[3], double deltaT, double alpha) {

  // gyro to rotation quaternion
  Quaternion q_updated = q.clone();
  updateQuaternionGyr(q_updated, gyr, deltaT);
  
  // accel to quaternion
  Quaternion q_acc = Quaternion(0, acc[0], acc[1], acc[2]);
  q_acc = q_acc.rotate(q_updated).normalize();
  
  // compute tilt correction quaternion
//  
//  double norm_acc = sqrt( sq(q_acc.q[1]) + sq(q_acc.q[2]) + sq(q_acc.q[3]));
//  q_acc = q_acc.normalize();
  double phi = 180/PI * acos(q_acc.q[2]);
  double norm_n = sqrt( sq(q_acc.q[1]) + sq(q_acc.q[3]));
  
  Quaternion q_tilt;
  if (norm_n >= 1e-8) { //else ignore measurement; prevent div by 0
    q_tilt = Quaternion().setFromAngleAxis( (1 - alpha) * phi, -q_acc.q[3]/norm_n, 0.0, q_acc.q[1] / norm_n).normalize();
  }

  q = q.multiply(q_tilt, q_updated).normalize();

}
