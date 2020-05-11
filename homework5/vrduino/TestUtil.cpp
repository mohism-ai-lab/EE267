#include "TestUtil.h"

bool doubleNear(double d1, double d2) {
  return fabs(d1 - d2) <= 0.00001;
}

bool quaternionNear(Quaternion& q1, Quaternion& q2) {
  for (int i = 0; i < 4; i++) {
    if (!doubleNear(q1.q[i], q2.q[i])) {
      return false;
    }
  }
  return true;
}

bool floatNear(float d1, float d2) {
  return fabs(d1 - d2) <= 0.00001;
}
