import cv2
import mediapipe as mp
import numpy as np
import time
import serial  # <--- ต้องมีไลบรารีนี้เพื่อคุยกับ ESP32
import sys
import glob
import serial
import platform

# ฟังก์ชันหา Serial Port อัตโนมัติ
def get_serial_port():
    system_name = platform.system()
    
    if system_name == "Darwin": # นี่คือ Mac
        # Mac มักจะชื่อ /dev/tty.usbmodem... หรือ /dev/tty.usbserial...
        ports = glob.glob('/dev/tty.usb*') + glob.glob('/dev/tty.slab*')
    
    elif system_name == "Linux": # นี่คือ Jetson Nano
        # Jetson มักจะชื่อ /dev/ttyUSB0 หรือ /dev/ttyACM0
        ports = glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*')
    
    else: # Windows
        ports = ['COM3', 'COM4', 'COM5'] # เดาเอา หรือใช้ list_ports

    # คืนค่า port แรกที่เจอ
    if ports:
        return ports[0]
    return None

# --- การนำไปใช้ ---
found_port = get_serial_port()

if found_port:
    print(f"✅ Found Port: {found_port}")
    try:
        ser = serial.Serial(found_port, 115200, timeout=1)
        time.sleep(2)
    except:
        print("❌ Cannot connect")
        ser = None
else:
    print("❌ No Serial Port found")
    ser = None

# --- 2. ตั้งค่า MediaPipe ---
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
    model_complexity=1
)

cap = cv2.VideoCapture(1) # กล้อง 0 หรือ 1
width = 1280
height = 720
cap.set(3, width)
cap.set(4, height)

# --- 3. ตัวแปรควบคุมหุ่น ---
deadZone = 150
targetBodyHeight = 370
errorMargin = 25

# ตัวแปรระบบจำทิศทาง (Lost Target Memory)
last_known_direction = "CENTER"
last_seen_time = 0
SEARCH_TIMEOUT = 2.0  # หมุนหาต่อ 2 วินาที

def get_body_command(cx, body_h):
    dir_cmd = "CENTER"
    dist_cmd = "STOP_DIST"
    final_cmd = "STOP"

    # Logic เลี้ยวซ้าย/ขวา
    if cx < (width // 2) - deadZone:
        dir_cmd = "LEFT"
    elif cx > (width // 2) + deadZone:
        dir_cmd = "RIGHT"
    else:
        dir_cmd = "CENTER"

    # Logic เดินหน้า/ถอยหลัง
    if body_h < targetBodyHeight - errorMargin:
        dist_cmd = "FORWARD"
    elif body_h > targetBodyHeight + errorMargin:
        dist_cmd = "BACKWARD"
    else:
        dist_cmd = "STOP_DIST"

    # รวมคำสั่ง
    if dir_cmd != "CENTER":
        final_cmd = dir_cmd
    elif dist_cmd == "FORWARD":
        final_cmd = "FORWARD"
    elif dist_cmd == "BACKWARD":
        final_cmd = "BACKWARD"
    else:
        final_cmd = "STOP"

    return final_cmd, dist_cmd, dir_cmd

while True:
    success, img = cap.read()
    if not success:
        break

    img = cv2.flip(img, 1) # Flip ภาพ (ซ้ายเป็นซ้าย ขวาเป็นขวา)
    imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = pose.process(imgRGB)

    command = "SEARCHING"

    # วาดเส้น Dead Zone
    cv2.line(img, ((width // 2) - deadZone, 0), ((width // 2) - deadZone, height), (0, 255, 255), 2)
    cv2.line(img, ((width // 2) + deadZone, 0), ((width // 2) + deadZone, height), (0, 255, 255), 2)

    if results.pose_landmarks:
        # --- เจอคน ---
        last_seen_time = time.time() # รีเซ็ตเวลา
        
        lm = results.pose_landmarks.landmark
        
        # (ส่วนดึง Landmark เหมือนเดิม...)
        nose = (int(lm[0].x * width), int(lm[0].y * height))
        # ... ผมละส่วนดึง Landmark อื่นๆ ไว้เพราะโค้ดเดิมคุณถูกต้องแล้ว ...
        
        # สมมติ Logic การหา Box (ย่อมาจากโค้ดเดิมของคุณ)
        h, w, c = img.shape
        x_list, y_list = [], []
        for id, lm_val in enumerate(lm):
            if id in [11, 12, 23, 24, 0]: # ไหล่ สะโพก จมูก
                x_list.append(int(lm_val.x * w))
                y_list.append(int(lm_val.y * h))
        
        if x_list and y_list:
            min_x, max_x = min(x_list)-20, max(x_list)+20
            min_y, max_y = min(y_list)-30, max(y_list)+30
            cx = (min_x + max_x) // 2
            body_h = max_y - min_y

            # วาด UI
            cv2.rectangle(img, (min_x, min_y), (max_x, max_y), (0, 255, 0), 2)
            cv2.circle(img, (cx, (min_y+max_y)//2), 5, (0, 0, 255), cv2.FILLED)

            # คำนวณคำสั่ง
            final_cmd, dist_st, dir_st = get_body_command(cx, body_h)
            command = final_cmd
            
            # จำทิศทาง
            if dir_st != "CENTER":
                last_known_direction = dir_st
    
    else:
        # --- ไม่เจอคน (Lost Target) ---
        time_elapsed = time.time() - last_seen_time
        
        if time_elapsed < SEARCH_TIMEOUT:
            # หายไปไม่นาน -> หมุนหาทางเดิม
            if last_known_direction == "LEFT":
                command = "SEARCH_LEFT"
            elif last_known_direction == "RIGHT":
                command = "SEARCH_RIGHT"
        else:
            # หายนานแล้ว -> หยุด
            command = "STOP (LOST)"

    # --- 4. ส่งค่าไป ESP32 ---
    if ser is not None:
        try:
            # ส่งแค่คำหลักๆ (ตัดคำในวงเล็บออก เช่น "STOP (LOST)" -> "STOP")
            clean_cmd = command.split(' ')[0] 
            ser.write(f"{clean_cmd}\n".encode('utf-8'))
        except:
            print("Serial Write Error")

    # --- แสดงผลหน้าจอ ---
    cv2.rectangle(img, (0, 0), (width, 80), (0, 0, 0), cv2.FILLED)
    
    color_cmd = (0, 255, 0)
    if "STOP" in command: color_cmd = (0, 0, 255)
    elif "SEARCH" in command: color_cmd = (0, 255, 255)
    else: color_cmd = (0, 255, 0)

    cv2.putText(img, f"CMD: {command}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, color_cmd, 3)
    
    cv2.imshow("Body Tracking Robot", img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

if ser is not None:
    ser.close()
cap.release()
cv2.destroyAllWindows()