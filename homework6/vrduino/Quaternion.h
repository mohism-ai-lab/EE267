/**
 * Quaternion class
 *
 * We are using C++! Not JavaScript!
 * Unlike JavaScript, "this" keyword is representing a pointer!
 * If you want to access the member variable q[0], you should write
 * this->q[0].
 *
 * @copyright The Board of Trustees of the Leland  Stanford Junior University
 * @version 2017/03/28
 */

#ifndef QUATERNION_H
#define QUATERNION_H

#include "Arduino.h"

class Quaternion {
public:

  /***
   * public member variables to hold the values
   *
   * Definition:
   * q = q[0] + q[1] * i + q[2] * j + q[3] * k
   */
  double q[4];


  /* Default constructor */
  Quaternion() :
    q{1.0, 0.0, 0.0, 0.0} {}


  /* Constructor with some inputs */
  Quaternion(double q0, double q1, double q2, double q3) :
    q{q0, q1, q2, q3} {}


  /* function to create another quaternion with the same values. */
  Quaternion clone() {
    return Quaternion(this->q[0], this->q[1], this->q[2], this->q[3]);
  }

  /* function to construct a quaternion from angle-axis representation */
  Quaternion& setFromAngleAxis(double angle, double vx, double vy, double vz) {
    double halfangle = angle * 0.5 * DEG_TO_RAD;

    double s = sin(halfangle);

    this->q[0] = cos(halfangle);

    this->q[1] = vx * s;

    this->q[2] = vy * s;

    this->q[3] = vz * s;

    return *this;
  }

  /* function to compute the length of a quaternion */
  double length() {
    return sqrt(sq(this->q[0]) + sq(this->q[1]) +
                sq(this->q[2]) + sq(this->q[3]));
  }

  /* function to normalize a quaternion */
  Quaternion& normalize() {
    double length = this->length();

    this->q[0] /= length;
    this->q[1] /= length;
    this->q[2] /= length;
    this->q[3] /= length;

    return *this;
  }

  /* function to invert a quaternion */
  Quaternion& inverse() {

    double s = sq(this->q[0]) + sq(this->q[1]) +
               sq(this->q[2]) + sq(this->q[3]);

    this->q[0] /= s;
    this->q[1] /= -s;
    this->q[2] /= -s;
    this->q[3] /= -s;

    return *this;
  }

  /* function to multiply two quaternions */
  Quaternion multiply(Quaternion& a, Quaternion& b) {

    /*
    this->q[0] = a.q[0] * b.q[0] - a.q[1] * b.q[1]
                 - a.q[2] * b.q[2] - a.q[3] * b.q[3];

    this->q[1] = a.q[0] * b.q[1] + a.q[1] * b.q[0]
                 + a.q[2] * b.q[3] - a.q[3] * b.q[2];

    this->q[2] = a.q[0] * b.q[2] - a.q[1] * b.q[3]
                 + a.q[2] * b.q[0] + a.q[3] * b.q[1];

    this->q[3] = a.q[0] * b.q[3] + a.q[1] * b.q[2]
                 - a.q[2] * b.q[1] + a.q[3] * b.q[0];

    return *this;

    */

    Quaternion q;
    q.q[0] = a.q[0] * b.q[0] - a.q[1] * b.q[1]
                 - a.q[2] * b.q[2] - a.q[3] * b.q[3];

    q.q[1] = a.q[0] * b.q[1] + a.q[1] * b.q[0]
                 + a.q[2] * b.q[3] - a.q[3] * b.q[2];

    q.q[2] = a.q[0] * b.q[2] - a.q[1] * b.q[3]
                 + a.q[2] * b.q[0] + a.q[3] * b.q[1];

    q.q[3] = a.q[0] * b.q[3] + a.q[1] * b.q[2]
                 - a.q[2] * b.q[1] + a.q[3] * b.q[0];

    return q;
  }

  /* function to rotate a quaternion by r * q * r^{-1} */
  Quaternion rotate(Quaternion& r) {
    Quaternion rinv = r.clone().inverse();

    Quaternion qrinv = Quaternion().multiply(*this, rinv);

    return Quaternion().multiply(r, qrinv);
  }


  /**
   * function to linearly interpolate between q0 and q1,
   * by a factor alpha [0, 1]. New q is renormalized
   * If alpha = 0, qnew = q0. if alpha = 1, qnew = q1
   */
  Quaternion nlerp(Quaternion& q0, Quaternion& q1, double alpha) {
    Quaternion qnew;
    if (alpha <= 0) {
      qnew =  q0.clone();
    } else if (alpha >= 1) {
      qnew =  q1.clone();
    } else {
      for (int i = 0; i < 4; i++) {
        qnew.q[i] = alpha * q0.q[i] + (1-alpha) * q1.q[i];
      }
    }
    qnew = qnew.normalize();
    return qnew;
  }



  /* helper function to print out a quaternion */
  void serialPrint() {
    Serial.print(q[0]);
    Serial.print(" ");
    Serial.print(q[1]);
    Serial.print(" ");
    Serial.print(q[2]);
    Serial.print(" ");
    Serial.print(q[3]);
    Serial.println();
  }
};

#endif // ifndef QUATERNION_H
