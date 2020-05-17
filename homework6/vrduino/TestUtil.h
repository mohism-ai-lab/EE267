#pragma once
#include "Quaternion.h"

bool doubleNear(double d1, double d2);

bool floatNear(float d1, float d2);

bool quaternionNear(Quaternion& q1, Quaternion& q2);
