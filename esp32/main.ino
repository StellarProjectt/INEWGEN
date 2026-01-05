#include <CytronMotorDriver.h>

// Motor 1 (ซ้าย), Motor 2 (ขวา)
CytronMD motor1(PWM_DIR, 25, 26);
CytronMD motor2(PWM_DIR, 33, 27);

String command = "";
unsigned long lastCommandTime = 0;

// --- ตั้งค่าความเร็วสูงสุด ---
int maxSpeedMove = 100;    
int maxSpeedTurn = 80;     
int maxSpeedSearch = 120;  

// --- ตัวแปรสำหรับ Soft Start ---
float currentSpeed1 = 0; // ความเร็วปัจจุบันของมอเตอร์ 1
float currentSpeed2 = 0; // ความเร็วปัจจุบันของมอเตอร์ 2
float targetSpeed1 = 0;  // ความเร็วที่อยากให้เป็น (เป้าหมาย)
float targetSpeed2 = 0;  // ความเร็วที่อยากให้เป็น (เป้าหมาย)

// *** ปรับความนุ่มนวลตรงนี้ ***
// ยิ่งเลขน้อย ยิ่งนุ่ม (แต่ตอบสนองช้า)
// ยิ่งเลขมาก ยิ่งพุ่งเร็ว (กระชาก)
float acceleration = 3.0; 

void setup() {
  Serial.begin(115200);
  stopMotorsImmediate();
}

void loop() {
  // 1. รับคำสั่งจาก Python
  if (Serial.available() > 0) {
    command = Serial.readStringUntil('\n');
    command.trim();
    lastCommandTime = millis();
    processCommand(command);
  }

  // 2. Safety: ถ้าเงียบนานเกิน หยุด
  if (millis() - lastCommandTime > 500) {
    targetSpeed1 = 0;
    targetSpeed2 = 0;
  }

  // 3. ฟังก์ชันสำคัญ: ค่อยๆ ปรับความเร็ว (Ramping)
  handleMotorRamp();

  // หน่วงเวลาเล็กน้อยเพื่อให้จังหวะการเร่งสม่ำเสมอ
  delay(10); 
}

void handleMotorRamp() {
  // --- Motor 1 Logic ---
  if (currentSpeed1 < targetSpeed1) {
    currentSpeed1 += acceleration;
    if (currentSpeed1 > targetSpeed1) currentSpeed1 = targetSpeed1; // กันเกิน
  } else if (currentSpeed1 > targetSpeed1) {
    currentSpeed1 -= acceleration;
    if (currentSpeed1 < targetSpeed1) currentSpeed1 = targetSpeed1; // กันเกิน
  }

  // --- Motor 2 Logic ---
  if (currentSpeed2 < targetSpeed2) {
    currentSpeed2 += acceleration;
    if (currentSpeed2 > targetSpeed2) currentSpeed2 = targetSpeed2;
  } else if (currentSpeed2 > targetSpeed2) {
    currentSpeed2 -= acceleration;
    if (currentSpeed2 < targetSpeed2) currentSpeed2 = targetSpeed2;
  }

  // สั่งงานมอเตอร์จริงๆ ตรงนี้
  motor1.setSpeed((int)currentSpeed1);
  motor2.setSpeed((int)currentSpeed2);
}

void processCommand(String cmd) {
  // เปลี่ยนจากการสั่ง motor.setSpeed ตรงๆ เป็นการตั้ง targetSpeed แทน
  
  if (cmd == "FORWARD") {
    targetSpeed1 = maxSpeedMove;
    targetSpeed2 = maxSpeedMove;
  }
  else if (cmd == "BACKWARD") {
    targetSpeed1 = -maxSpeedMove;
    targetSpeed2 = -maxSpeedMove;
  }
  else if (cmd == "LEFT") {
    targetSpeed1 = -maxSpeedTurn;
    targetSpeed2 = maxSpeedTurn;
  }
  else if (cmd == "RIGHT") {
    targetSpeed1 = maxSpeedTurn;
    targetSpeed2 = -maxSpeedTurn;
  }
  else if (cmd == "SEARCH_LEFT") {
    targetSpeed1 = -maxSpeedSearch;
    targetSpeed2 = maxSpeedSearch;
  }
  else if (cmd == "SEARCH_RIGHT") {
    targetSpeed1 = maxSpeedSearch;
    targetSpeed2 = -maxSpeedSearch;
  }
  else {
    // STOP
    targetSpeed1 = 0;
    targetSpeed2 = 0;
  }
}

void stopMotorsImmediate() {
  targetSpeed1 = 0;
  targetSpeed2 = 0;
  currentSpeed1 = 0;
  currentSpeed2 = 0;
  motor1.setSpeed(0);
  motor2.setSpeed(0);
}