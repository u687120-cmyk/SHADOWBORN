"""
SHADOWBORN: AWAKENING - Computer Vision Gesture Bridge
Real-time MediaPipe Hand Landmark Detector and Gesture Classifier
Streams gesture events over UDP / Localhost socket to Unity or local runtime.
"""

import cv2
import time
import socket
import json
import math
import sys

# Try importing mediapipe
try:
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False
    print("[WARNING] MediaPipe not yet installed. Run: pip install mediapipe opencv-python")

UDP_IP = "127.0.0.1"
UDP_PORT = 8765

class GestureTracker:
    def __init__(self, camera_index=0, width=640, height=480):
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        self.prev_wrist = None
        self.prev_time = time.time()
        self.last_punch_time = 0
        self.punch_cooldown = 0.6
        self.state = "IDLE"
        
        if MP_AVAILABLE:
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.65,
                min_tracking_confidence=0.65
            )
            self.mp_draw = mp.solutions.drawing_utils

    def calculate_distance(self, p1, p2):
        return math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)

    def classify_gesture(self, landmarks):
        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]
        
        # Check finger curled state (distance to wrist)
        index_curled = self.calculate_distance(index_tip, wrist) < 0.28
        middle_curled = self.calculate_distance(middle_tip, wrist) < 0.28
        ring_curled = self.calculate_distance(ring_tip, wrist) < 0.28
        pinky_curled = self.calculate_distance(pinky_tip, wrist) < 0.28
        
        is_fist = index_curled and middle_curled and ring_curled and pinky_curled
        is_pointing = (not index_curled) and middle_curled and ring_curled and pinky_curled
        
        # Velocity estimation (Z or XY translation speed)
        now = time.time()
        dt = max(now - self.prev_time, 0.001)
        velocity = 0.0
        
        if self.prev_wrist is not None:
            dx = wrist.x - self.prev_wrist.x
            dy = wrist.y - self.prev_wrist.y
            dz = wrist.z - self.prev_wrist.z
            # Forward motion into camera appears as negative dz or rapid expansion
            velocity = math.sqrt(dx**2 + dy**2 + dz**2) / dt
            
        self.prev_wrist = wrist
        self.prev_time = now
        
        # Gesture state transitions
        gesture = "NONE"
        if is_fist:
            if velocity > 1.8 and (now - self.last_punch_time) > self.punch_cooldown:
                gesture = "FORWARD_PUNCH"
                self.last_punch_time = now
                self.state = "PUNCH_EXECUTED"
            else:
                gesture = "CLOSED_FIST"
                self.state = "FIST_CHARGED"
        elif is_pointing:
            gesture = "INDEX_POINTING"
            self.state = "TARGETING"
        else:
            self.state = "IDLE"
            
        return gesture, velocity

    def run(self):
        cap = cv2.VideoCapture(self.camera_index)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        
        if not cap.isOpened():
            print(f"[ERROR] Cannot open webcam index {self.camera_index}")
            return
            
        print("[INFO] Webcam Gesture Bridge Started. Press 'q' to quit.")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            frame = cv2.flip(frame, 1) # Mirror preview
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            gesture = "NONE"
            velocity = 0.0
            
            if MP_AVAILABLE:
                results = self.hands.process(rgb)
                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        self.mp_draw.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                        gesture, velocity = self.classify_gesture(hand_landmarks.landmark)
                        
                        # Send event over UDP
                        if gesture in ["FORWARD_PUNCH", "CLOSED_FIST", "INDEX_POINTING"]:
                            payload = json.dumps({
                                "gesture": gesture,
                                "velocity": round(velocity, 2),
                                "timestamp": time.time()
                            }).encode('utf-8')
                            self.sock.sendto(payload, (UDP_IP, UDP_PORT))
            
            # HUD Overlay
            color = (0, 255, 0) if gesture != "FORWARD_PUNCH" else (0, 0, 255)
            cv2.putText(frame, f"SHADOWBORN CV BRIDGE | STATE: {self.state}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 200, 50), 2)
            cv2.putText(frame, f"GESTURE: {gesture} | VEL: {velocity:.2f}", (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            cv2.putText(frame, "PUNCH: Close Fist + Thrust Forward", (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                        
            cv2.imshow("SHADOWBORN - Gesture Recognition Debug", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    tracker = GestureTracker()
    tracker.run()
