import cv2
import numpy as np
import time
import serial
import platform
import glob

# ---------------- SERIAL AUTO DETECT ----------------
def get_serial_port():
    system_name = platform.system()
    if system_name == "Linux":
        ports = glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*')
    elif system_name == "Darwin":
        ports = glob.glob('/dev/tty.usb*')
    else:
        ports = ['COM3', 'COM4', 'COM5']
    return ports[0] if ports else None

found_port = get_serial_port()
ser = None
if found_port:
    try:
        ser = serial.Serial(found_port, 115200, timeout=1)
        time.sleep(2)
        print(f"Connected to {found_port}")
    except:
        print("Serial connection failed")

# ---------------- YOLO LOAD ----------------
CFG = "yolov4-tiny.cfg"
WEIGHTS = "yolov4-tiny.weights"
NAMES = "coco.names"

with open(NAMES, "r") as f:
    classes = f.read().strip().split("\n")

net = cv2.dnn.readNetFromDarknet(CFG, WEIGHTS)
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)  # Jetson Nano CPU (เสถียร)

layer_names = net.getLayerNames()
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]

# ---------------- CAMERA ----------------
cap = cv2.VideoCapture(0)
width, height = 1280, 720
cap.set(3, width)
cap.set(4, height)

# ---------------- CONTROL PARAM ----------------
deadZone = 150
targetBodyHeight = 370
errorMargin = 25

last_known_direction = "CENTER"
last_seen_time = 0
SEARCH_TIMEOUT = 2.0

# ---------------- COMMAND LOGIC ----------------
def get_body_command(cx, body_h):
    dir_cmd = "CENTER"
    dist_cmd = "STOP"

    if cx < (width // 2) - deadZone:
        dir_cmd = "LEFT"
    elif cx > (width // 2) + deadZone:
        dir_cmd = "RIGHT"

    if body_h < targetBodyHeight - errorMargin:
        dist_cmd = "FORWARD"
    elif body_h > targetBodyHeight + errorMargin:
        dist_cmd = "BACKWARD"

    if dir_cmd != "CENTER":
        return dir_cmd
    return dist_cmd

# ---------------- MAIN LOOP ----------------
while True:
    ret, img = cap.read()
    if not ret:
        break

    img = cv2.flip(img, 1)
    h, w = img.shape[:2]

    blob = cv2.dnn.blobFromImage(img, 1/255, (416,416), swapRB=True)
    net.setInput(blob)
    outs = net.forward(output_layers)

    boxes, confidences = [], []
    for out in outs:
        for det in out:
            scores = det[5:]
            class_id = np.argmax(scores)
            conf = scores[class_id]

            if class_id == 0 and conf > 0.5:  # person
                cx = int(det[0] * w)
                cy = int(det[1] * h)
                bw = int(det[2] * w)
                bh = int(det[3] * h)
                x = int(cx - bw / 2)
                y = int(cy - bh / 2)

                boxes.append([x, y, bw, bh])
                confidences.append(float(conf))

    idxs = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)

    command = "SEARCHING"

    # Draw dead zone
    cv2.line(img, ((w//2)-deadZone,0), ((w//2)-deadZone,h), (0,255,255), 2)
    cv2.line(img, ((w//2)+deadZone,0), ((w//2)+deadZone,h), (0,255,255), 2)

    if len(idxs) > 0:
        i = idxs.flatten()[0]
        x,y,bw,bh = boxes[i]
        cx = x + bw//2
        body_h = bh

        last_seen_time = time.time()

        cv2.rectangle(img,(x,y),(x+bw,y+bh),(0,255,0),2)
        cv2.circle(img,(cx,y+bh//2),5,(0,0,255),-1)

        command = get_body_command(cx, body_h)

        if command in ["LEFT","RIGHT"]:
            last_known_direction = command

    else:
        elapsed = time.time() - last_seen_time
        if elapsed < SEARCH_TIMEOUT:
            command = "SEARCH_" + last_known_direction
        else:
            command = "STOP"

    # SEND SERIAL
    if ser:
        try:
            ser.write(f"{command}\n".encode())
        except:
            pass

    # UI
    cv2.rectangle(img,(0,0),(w,80),(0,0,0),-1)
    color = (0,255,0)
    if "STOP" in command: color = (0,0,255)
    elif "SEARCH" in command: color = (0,255,255)

    cv2.putText(img,f"CMD: {command}",(20,50),
                cv2.FONT_HERSHEY_SIMPLEX,1.5,color,3)

    cv2.imshow("YOLO Body Tracking Robot", img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ---------------- CLEANUP ----------------
if ser:
    ser.close()
cap.release()
cv2.destroyAllWindows()