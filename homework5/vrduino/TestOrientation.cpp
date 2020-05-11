#include "TestOrientation.h"


/* length() */
bool test1() {
  Serial.println();
  Quaternion q = Quaternion(2.3, 1.2, 2.1, 3.0);
  double l = q.length();
  double exp = 4.487761;
  Serial.printf("Expected length: %f\n", exp);
  Serial.printf("Your result: %f\n", l);
  Serial.println();
  return doubleNear(l, exp);
}


/* normalize() */
bool test2() {
  Quaternion q = Quaternion(2.3, 1.2, 2.1, 3.0);
  Quaternion qExp = Quaternion(
    0.512505, 0.267394, 0.467939, 0.668485);
  q.normalize();
  Serial.println("Expected normalized quaternion:");
  qExp.serialPrint();
  Serial.println("Your result: ");
  q.serialPrint();
  Serial.println();
  return quaternionNear(q, qExp);
}

/* inverse() */
bool test3() {
  Quaternion p = Quaternion(3.2, 3.3, 5.2, 0.1);
  Quaternion pExp = Quaternion(0.066418, -0.068493, -0.107929, -0.002076);
  p.inverse();
  Serial.println("Expected inverse quaternion:");
  pExp.serialPrint();
  Serial.println("Your result: ");
  p.serialPrint();
  Serial.println();
  return quaternionNear(p, pExp);
}

/* setFromAngleAxis() */
bool test4() {
  Quaternion q0 = Quaternion().setFromAngleAxis(
    2, 1 / sqrt(14), 2 / sqrt(14), 3 / sqrt(14));

  Quaternion qExp = Quaternion(
    0.999848, 0.004664, 0.009329, 0.013993);

  Serial.println("Expected constructed quaternion:");
  qExp.serialPrint();
  Serial.println("Your result: ");
  q0.serialPrint();
  Serial.println();
  return quaternionNear(q0, qExp);
}


/* multiply() */
bool test5() {
  Quaternion q1   = Quaternion(0.512505, 0.267394, 0.467939, 0.668485);
  Quaternion q2   = Quaternion(0.461017, -0.475423, -0.749152, -0.014407);
  Quaternion q1q2 = Quaternion().multiply(q1, q2);
  Quaternion qExp = Quaternion(
    0.723587, 0.373672, -0.482177, 0.322949);
  Serial.println("Expected multiplied quaternion:");
  qExp.serialPrint();
  Serial.println("Your result: ");
  q1q2.serialPrint();
  Serial.println();
  return quaternionNear(q1q2, qExp);
}

  /* rotate() */
bool test6() {
  Quaternion q3 = Quaternion(0.512505, 0.267394, 0.467939, 0.668485);
  Quaternion q4 = Quaternion(0.461017, -0.475423, -0.749152, -0.014407);
  Quaternion q5 = q3.rotate(q4);
  Quaternion qExp = Quaternion(
    0.512505, -0.145908, 0.750596, -0.390712);
  Serial.println("Expected multiplied quaternion:");
  qExp.serialPrint();
  Serial.println("Your result: ");
  q5.serialPrint();
  Serial.println();
  return quaternionNear(q5, qExp);
}

/** run all tests */
void testMain() {

  Serial.printf("Testing quaternion:\n\n");
  int res = test1() + test2() + test3() + test4()
    + test5() + test6();
  Serial.printf("total passes: %d/6\n", res);


}
