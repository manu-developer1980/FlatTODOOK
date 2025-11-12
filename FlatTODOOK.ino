// Librerias
#include <Preferences.h>
#include "BluetoothSerial.h"
#include <ESP32Servo.h>
// Definimos los pines
#define servoPin  18
#define ledPin    27
#define LED_BUILTIN 2

int brightness = 0;

// Vairables
Preferences   preferences;
BluetoothSerial SerialBT;

// Parámetros del servo
const int minPulseWidth = 460;  // Ancho de pulso mínimo en microsegundos (0 grados, cerrado)
const int maxPulseWidth = 2500; // Ancho de pulso máximo en microsegundos (270 grados, abierto)
const int frequency = 120;       // Frecuencia del servo en Hz
const int resolution = 16;      // Resolución de PWM en bits
const long interval = 9;       // Intervalo en milisegundos para mover el servo
unsigned long previousMillis = 0;

enum devices {
  FLAT_MAN_L = 10,
  FLAT_MAN_XL = 15,
  FLAT_MAN = 19,
  FLIP_FLAT = 99
};

enum motorStatuses {
  STOPPED = 0,
  RUNNING
};

enum lightStatuses {
  OFF = 0,
  ON
};

enum shutterStatuses {
  NEITHER_OPEN_NOR_CLOSED = 0, // ie not open or closed...could be moving
  CLOSED,
  OPEN,
  TIMED_OUT
};

enum motorDirection {
  OPENING = 0,
  CLOSING,
  NONE
};

int deviceId = FLIP_FLAT; //set this to FLAT_MAN if you want to remove or not use the motor handling
int motorStatus = STOPPED;
int lightStatus = OFF;
int coverStatus = CLOSED;
int targetAngle;
int currentAngle = 0;
int motorDirection = NONE;
int angle_open = 266;
int angle_close = 0;

void setup() {

  //Primera vez para programar algo en la memoria
  // preferences.begin("config", false);
  // preferences.putInt("angle_open", 260);
  // preferences.putInt("angle_close", 0);
  // preferences.end();
  
  //Aplico las configuraciones guardadas en la NVM
  preferences.begin("config", true);
  angle_open = preferences.getInt("angle_open");
  angle_close = preferences.getInt("angle_close");
  preferences.end();

  // initialize the serial communication:
  Serial.begin(9600);
  SerialBT.begin("AuroraFlatPanel");
  
  // initialize the ledPin as an output:
  pinMode(ledPin, OUTPUT);
  ledcSetup(0, frequency, resolution);
  ledcAttachPin(ledPin, 0);
  ledcWrite(0, 0); // Apagar LED inicialmente

  // initialize servo pin
  ledcSetup(1, frequency, resolution);
  ledcAttachPin(servoPin, 1);

  //initialize LED_BUILTIN
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
}

void loop() {
  //handleSerial();
  handleComm(Serial);
  handleComm(SerialBT);
  handleMotor();
}

// void handleSerial() {
//   if ( Serial.available() >= 6 ) { // all incoming communications are fixed length at 6 bytes including the \n
//     char* cmd;
//     char* data;
//     char temp[10];

//     char str[20];
//     memset(str, 0, 20);
//     Serial.readBytesUntil('\r', str, 20);

//     cmd = str + 1;
//     data = str + 2;

//     switch (*cmd) {
//       case 'P':
//         sprintf(temp, "*P%dOOO\n", deviceId);
//         Serial.write(temp);
//         break;

//       case 'O':
//         sprintf(temp, "*O%dOOO\n", deviceId);
//         setShutter(OPEN);
//         Serial.write(temp);
//         break;

//       case 'C':
//         sprintf(temp, "*C%dOOO\n", deviceId);
//         setShutter(CLOSED);
//         Serial.write(temp);
//         break;

//       case 'L':
//         sprintf(temp, "*L%dOOO\n", deviceId);
//         Serial.write(temp);
//         lightStatus = ON;
//         //ledcWrite(0, map(brightness, 0, 255, 0, (1 << resolution) - 1));
//         ledcWrite(0, map(brightness, 0, 255, 140, 1000));
//         break;

//       case 'D':
//         sprintf(temp, "*D%dOOO\n", deviceId);
//         Serial.write(temp);
//         lightStatus = OFF;
//         ledcWrite(0, 0);
//         break;

//       case 'B':
//         brightness = atoi(data);
//         if (lightStatus == ON)
//           //ledcWrite(0, map(brightness, 0, 255, 0, (1 << resolution) - 1));
//           ledcWrite(0, map(brightness, 0, 255, 140, 1000));
//         sprintf(temp, "*B%d%03d\n", deviceId, brightness);
//         Serial.write(temp);
//         break;

//       case 'J':
//         sprintf(temp, "*J%d%03d\n", deviceId, brightness);
//         Serial.write(temp);
//         break;

//       case 'S':
//         sprintf(temp, "*S%d%d%d%d\n", deviceId, motorStatus, lightStatus, coverStatus);
//         Serial.write(temp);
//         break;

//       case 'V':
//         sprintf(temp, "*V%d003\n", deviceId);
//         Serial.write(temp);
//         break;
//     }

//     while (Serial.available() > 0) {
//       Serial.read();
//     }
//   }
// }

void handleComm(Stream &port) {
  if ( port.available() >= 6 ) { // all incoming communications are fixed length at 6 bytes including the \n
    char* cmd;
    char* data;
    char temp[10];

    char str[20];
    memset(str, 0, 20);
    port.readBytesUntil('\r', str, 20);

    cmd = str + 1;
    data = str + 2;

    switch (*cmd) {
      case 'P':
        sprintf(temp, "*P%dOOO\n", deviceId);
        port.write(temp);
        break;

      case 'O':
        sprintf(temp, "*O%dOOO\n", deviceId);
        setShutter(OPEN);
        port.write(temp);
        break;

      case 'C':
        sprintf(temp, "*C%dOOO\n", deviceId);
        setShutter(CLOSED);
        port.write(temp);
        break;

      case 'L':
        sprintf(temp, "*L%dOOO\n", deviceId);
        port.write(temp);
        lightStatus = ON;
        digitalWrite(LED_BUILTIN, HIGH);
        ledcWrite(0, map(brightness, 0, 255, 10, 1000));
        break;

      case 'D':
        sprintf(temp, "*D%dOOO\n", deviceId);
        port.write(temp);
        lightStatus = OFF;
        digitalWrite(LED_BUILTIN, LOW);
        ledcWrite(0, 0);
        break;

      case 'B':
        // brightness = atoi(data);
        // if (lightStatus == ON){
        //   ledcWrite(0, map(brightness, 0, 255, 140, 1000));
        // }
        // sprintf(temp, "*B%d%03d\n", deviceId, brightness);
        // port.write(temp);

        brightness = atoi(data);
        int duty;

        if (brightness == 0) {
            duty = 0;  // LED apagado
        } else if (brightness <= 200) {
            duty = map(brightness, 1, 220, 10, 1000);  // lineal 1–220
        } else {  // 221–255
            duty = map(brightness, 221, 255, 1001, (1 << resolution) - 1);  // lineal 201–255
        }

        if (lightStatus == ON) {
            ledcWrite(0, duty);
        }

        sprintf(temp, "*B%d%03d\n", deviceId, brightness);
        port.write(temp);
        break;

      case 'J':
        sprintf(temp, "*J%d%03d\n", deviceId, brightness);
        port.write(temp);
        break;

      case 'S':
        sprintf(temp, "*S%d%d%d%d\n", deviceId, motorStatus, lightStatus, coverStatus);
        port.write(temp);
        break;

      case 'V':
        sprintf(temp, "*V%d003\n", deviceId);
        port.write(temp);
        break;

      //Mis cases (Libres: I, K, M, N, Q, R, T, U, W, X, Y, Z)
      case 'A':  // reducir apertura 1 grado
        if (angle_open > 0) {       // evitar valores negativos
            angle_open--;
        }
        sprintf(temp, "*A%03d\n", angle_open);  // respuesta opcional
        port.write(temp);
        break;

      case 'F':  // aumentar apertura 1 grado
        if (angle_open < 270) {     // máximo 270 grados
            angle_open++;
        }
        sprintf(temp, "*F%03d\n", angle_open);  // respuesta opcional
        port.write(temp);
        break;

      case 'G':  // reducir cierre 1 grado (menos cerrado)
        if (angle_close > 0) {       // evitar valores negativos
            angle_close--;
        }
        sprintf(temp, "*G%03d\n", angle_close);  // respuesta opcional
        port.write(temp);
        break;

      case 'H':  // aumentar cierre 1 grado (más cerrado)
        if (angle_close < 270) {     // máximo 270 grados
            angle_close++;
        }
        sprintf(temp, "*H%03d\n", angle_close);  // respuesta opcional
        port.write(temp);
        break;

      case 'E':  // guardar parámetros en EEPROM
        preferences.begin("config", false);
        preferences.putInt("angle_open", angle_open);
        preferences.putInt("angle_close", angle_close);
        preferences.end(); 
        port.write(temp);
        break;
    }

    while (port.available() > 0) {
      port.read();
    }
  }
}


void setShutter(int val) {
  if (val == OPEN && coverStatus != OPEN) {
    motorDirection = OPENING;
    targetAngle = angle_open;
  } else if (val == CLOSED && coverStatus != CLOSED) {
    motorDirection = CLOSING;
    targetAngle = angle_close;
  }
}

// void handleMotor() {
//   unsigned long currentMillis = millis();

//   if (currentMillis - previousMillis >= interval) {
//     previousMillis = currentMillis;

//     if (currentAngle < targetAngle && motorDirection == OPENING) {
//       motorStatus = RUNNING;
//       coverStatus = NEITHER_OPEN_NOR_CLOSED;
//       setServoAngle(currentAngle);
//       currentAngle += 1;

//       if (currentAngle >= targetAngle) {
//         motorStatus = STOPPED;
//         motorDirection = NONE;
//         coverStatus = OPEN;
//       }
//     } else if (currentAngle > targetAngle && motorDirection == CLOSING) {
//       motorStatus = RUNNING;
//       coverStatus = NEITHER_OPEN_NOR_CLOSED;
//       setServoAngle(currentAngle);
//       currentAngle -= 1;

//       if (currentAngle <= targetAngle) {
//         motorStatus = STOPPED;
//         motorDirection = NONE;
//         coverStatus = CLOSED;
//       }
//     }
//   }
// }

void handleMotor() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    if (currentAngle < targetAngle && motorDirection == OPENING) {
      motorStatus = RUNNING;
      coverStatus = NEITHER_OPEN_NOR_CLOSED;
      setServoAngle(currentAngle);
      currentAngle += 1;

      if (currentAngle >= targetAngle) {
        motorStatus = STOPPED;
        motorDirection = NONE;
        coverStatus = OPEN;

        // Apagar servo al llegar
        ledcWrite(1, 0);
      }
    } 
    else if (currentAngle > targetAngle && motorDirection == CLOSING) {
      motorStatus = RUNNING;
      coverStatus = NEITHER_OPEN_NOR_CLOSED;
      setServoAngle(currentAngle);
      currentAngle -= 1;

      if (currentAngle <= targetAngle) {
        motorStatus = STOPPED;
        motorDirection = NONE;
        coverStatus = CLOSED;

        // Apagar servo al llegar
        ledcWrite(1, 0);
      }
    }
  }
}


void setServoAngle(int angle) 
{
  int pulseWidth = map(angle, 0, 270, minPulseWidth, maxPulseWidth);
  long period = 1000000 / frequency; // Período de la señal PWM en microsegundos
  int maxDuty = (1 << resolution) - 1; // Valor máximo del ciclo de trabajo basado en la resolución
  int dutyCycle = (pulseWidth * maxDuty) / period; // Convertir ancho de pulso a ciclo de trabajo
  ledcWrite(1, dutyCycle);
}
