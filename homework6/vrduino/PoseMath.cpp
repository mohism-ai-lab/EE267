#include "PoseMath.h"


void convertTicksTo2DPositions(uint32_t clockTicks[8], double pos2D[8])
{
  for (int i = 0; i < 8; i +=2) {
    // horizontal component
    double deltaT_h = (double)clockTicks[i]/(double)CLOCKS_PER_SECOND;
    double a_h = -deltaT_h*360.0*60.0 + 90.0;
    double x = tan(a_h *2*PI/360.0);

    // vertical component
    double deltaT_v = (double)clockTicks[i+1]/(double)CLOCKS_PER_SECOND;
    double a_v = deltaT_v*360.0*60.0 - 90.0;
    double y = tan(a_v*2*PI/360.0);
    
    pos2D[i] = x;
    pos2D[i+1] = y;
  }

}


void formA(double pos2D[8], double posRef[8], double Aout[8][8]) {
  for (int i = 0; i < 8; i += 2) {
      Aout[i][0] = posRef[i]; // x
      Aout[i][1] = posRef[i+1]; //y
      Aout[i][2] = 1;
      Aout[i][3] = 0;
      Aout[i][4] = 0;
      Aout[i][5] = 0;
      Aout[i][6] = -posRef[i]*pos2D[i];
      Aout[i][7] = -posRef[i+1]*pos2D[i];
      
      Aout[i+1][0] = 0;
      Aout[i+1][1] = 0;
      Aout[i+1][2] = 0;
      Aout[i+1][3] = posRef[i];
      Aout[i+1][4] = posRef[i+1];
      Aout[i+1][5] = 1;
      Aout[i+1][6] = -posRef[i]*pos2D[i+1];
      Aout[i+1][7] = -posRef[i+1]*pos2D[i+1];
  }

}

bool solveForH(double A[8][8], double b[8], double hOut[8]) {

 int inv = Matrix.Invert((double*)A, 8);
  if (inv == 0) {
    return false;
  }
  
  Matrix.Multiply((double*)A, b, 8, 8, 1, hOut);
  
  return inv;

}


void getRtFromH(double h[8], double ROut[3][3], double pos3DOut[3]) {
  double s = 2/( sqrt( sq(h[0])+sq(h[3])+sq(h[6]) ) + sqrt( sq(h[1]) + sq(h[4]) + sq(h[7]) ) );

  pos3DOut[0] = s*h[2];
  pos3DOut[1] = s*h[5];
  pos3DOut[2] = -s;

   //column 1
   double r11 = h[0]/sqrt(sq(h[0]) + sq(h[3]) +sq(h[6]));
   double r21 = h[3]/sqrt( sq(h[0])+sq(h[3])+sq(h[6]));
   double r31 = h[6]/sqrt( sq(h[0])+sq(h[3])+sq(h[6]));

   //column 2
   double r12_t = h[1] - ( r11*( r11*h[1]+r21*h[4]+r31*h[7] ) );
   double r22_t = h[4] - ( r21*( r11*h[1]+r21*h[4]+r31*h[7] ) );
   double r32_t = -h[7] - ( r31*( r11*h[1]+r21*h[4]+r31*h[7] ) );

   //divide each my l2 norm
   double l2 = sqrt( sq(r12_t)+sq(r22_t)+sq(r32_t) );
   double r12 = r12_t/l2;
   double r22 = r22_t/l2;
   double r32 = r32_t/l2;

   //column 3: cross prod
   double r13 = r21 * r32 - r31 * r22;
   double r23 = r31 * r12 - r11 * r32;
   double r33 = r11 * r22 - r21 * r12;

   ROut[0][0] = r11;
   ROut[1][0] = r21;
   ROut[2][0] = r31;

   ROut[0][1] = r12;
   ROut[1][1] = r22;
   ROut[2][1] = r32;
   
   ROut[0][2] = r13;
   ROut[1][2] = r23;
   ROut[2][2] = r33;

}

Quaternion getQuaternionFromRotationMatrix(double R[3][3]) {

  double qw = sqrt(1 + R[0][0] + R[1][1] + R[2][2]) / 2;
  double qx = (R[2][1] - R[1][2]) / (4*qw);
  double qy = (R[0][2] - R[2][0]) / (4*qw);
  double qz = (R[1][0] - R[0][1]) / (4*qw);

  double l2 = sqrt(sq(qw)+sq(qx)+sq(qy)+sq(qz));
  qw /= l2;
  qx /= l2;
  qy /= l2;
  qz /= l2;
  return Quaternion(qw, qx, qy, qz);

}
