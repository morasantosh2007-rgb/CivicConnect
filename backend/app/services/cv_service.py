import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, List
from app.core.config import settings

ANNOTATED_DIR = settings.UPLOAD_DIR / "annotated"
ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)

class InfrastructureVisionEngine:
    """
    Computer Vision model pipeline for civic infrastructure triage.
    Implements multi-class detection for:
    - Road potholes and depressions
    - Road cracks and structural fissures
    - Water leakage and waterlogging
    - Garbage accumulation and overflowing refuse
    - Electrical hazards and broken street fixtures
    """
    def __init__(self):
        self.version = "CivicVision-Hybrid-v2.4"

    def analyze_image(self, image_path: Path) -> Dict[str, Any]:
        if not image_path.exists():
            return {
                "status": "error",
                "message": "Image file not found",
                "detected_classes": [],
                "bounding_boxes": [],
                "confidence": 0.0,
                "model_version": self.version
            }

        img = cv2.imread(str(image_path))
        if img is None:
            return {
                "status": "error",
                "message": "Failed to decode image file",
                "detected_classes": [],
                "bounding_boxes": [],
                "confidence": 0.0,
                "model_version": self.version
            }

        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        detections: List[Dict[str, Any]] = []

        # 1. Pothole & Road Damage Detection (Cavity + Shadow Contrast + Texture Irregularity)
        potholes = self._detect_potholes(img, gray, height, width)
        detections.extend(potholes)

        # 2. Road Crack Detection (Ridge & Edge Connectivity)
        cracks = self._detect_cracks(gray, height, width)
        detections.extend(cracks)

        # 3. Water Leakage & Waterlogging (Specular Reflection + Wet Surface Pooling)
        water_issues = self._detect_water_issues(img, hsv, height, width)
        detections.extend(water_issues)

        # 4. Garbage Accumulation & Overflowing Refuse (High Chromatic Entropy & High-Frequency Debris Blobs)
        garbage = self._detect_garbage(img, hsv, height, width)
        detections.extend(garbage)

        # 5. Electrical Hazards & Exposed Wires (Hough Line Analysis for Sagging/Dangling Conduits)
        electrical = self._detect_electrical_hazards(gray, height, width)
        detections.extend(electrical)

        # Deduplicate overlapping boxes
        nms_detections = self._apply_nms(detections)

        # Draw annotations on a copy
        annotated_img = img.copy()
        for det in nms_detections:
            ymin = int(det["ymin"] * height)
            xmin = int(det["xmin"] * width)
            ymax = int(det["ymax"] * height)
            xmax = int(det["xmax"] * width)
            color = det.get("color", (0, 0, 255))
            label = f"{det['label']} ({int(det['confidence'] * 100)}%)"

            cv2.rectangle(annotated_img, (xmin, ymin), (xmax, ymax), color, 2)
            cv2.putText(
                annotated_img,
                label,
                (xmin, max(20, ymin - 8)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                color,
                2
            )

        annotated_filename = f"annotated_{image_path.stem}.jpg"
        annotated_path = ANNOTATED_DIR / annotated_filename
        cv2.imwrite(str(annotated_path), annotated_img)

        # Summary
        detected_classes = list(set(d["label"] for d in nms_detections))
        avg_confidence = float(np.mean([d["confidence"] for d in nms_detections])) if nms_detections else 0.0

        return {
            "status": "success",
            "model_version": self.version,
            "detected_classes": detected_classes,
            "bounding_boxes": nms_detections,
            "confidence": round(avg_confidence, 2),
            "annotated_image_url": f"/uploads/annotated/{annotated_filename}",
            "features_summary": {
                "total_defects_found": len(nms_detections),
                "image_resolution": f"{width}x{height}"
            }
        }

    def _detect_potholes(self, img: np.ndarray, gray: np.ndarray, height: int, width: int) -> List[Dict[str, Any]]:
        boxes = []
        # Road asphalt tends to be lower 2/3 of frame
        roi_start_y = int(height * 0.3)
        roi_gray = gray[roi_start_y:, :]
        
        blurred = cv2.GaussianBlur(roi_gray, (9, 9), 0)
        # Adaptive thresholding to capture dark cavity depressions
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 4
        )
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_area = (height * width) * 0.003
        max_area = (height * width) * 0.25

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area < area < max_area:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(w) / max(h, 1)
                # Potholes typically have reasonable aspect ratios (0.4 to 3.0)
                if 0.4 < aspect_ratio < 3.2:
                    abs_y = y + roi_start_y
                    boxes.append({
                        "label": "Pothole",
                        "ymin": round(abs_y / height, 3),
                        "xmin": round(x / width, 3),
                        "ymax": round(min(height, abs_y + h) / height, 3),
                        "xmax": round(min(width, x + w) / width, 3),
                        "confidence": round(min(0.95, 0.70 + (area / max_area) * 0.25), 2),
                        "color": (0, 0, 220) # Red
                    })
        return boxes

    def _detect_cracks(self, gray: np.ndarray, height: int, width: int) -> List[Dict[str, Any]]:
        boxes = []
        # Multi-scale Canny edge detection
        edges = cv2.Canny(gray, 60, 160)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        dilated = cv2.dilate(edges, kernel, iterations=1)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            length = cv2.arcLength(cnt, False)
            area = cv2.contourArea(cnt)
            # Cracks have long perimeter relative to area
            if length > 80 and (area == 0 or (length * length) / max(area, 1) > 40):
                x, y, w, h = cv2.boundingRect(cnt)
                if w > 40 or h > 40:
                    boxes.append({
                        "label": "Road crack",
                        "ymin": round(y / height, 3),
                        "xmin": round(x / width, 3),
                        "ymax": round(min(height, y + h) / height, 3),
                        "xmax": round(min(width, x + w) / width, 3),
                        "confidence": round(min(0.90, 0.65 + (length / (width + height)) * 0.3), 2),
                        "color": (0, 140, 255) # Orange
                    })
        return boxes

    def _detect_water_issues(self, img: np.ndarray, hsv: np.ndarray, height: int, width: int) -> List[Dict[str, Any]]:
        boxes = []
        # Water reflects light and creates specular pools or grayish/muddy hue
        lower_water = np.array([80, 20, 20])
        upper_water = np.array([140, 255, 200])
        mask = cv2.inRange(hsv, lower_water, upper_water)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
        mask_clean = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(mask_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_water_area = (height * width) * 0.015

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > min_water_area:
                x, y, w, h = cv2.boundingRect(cnt)
                boxes.append({
                    "label": "Water leakage / Waterlogging",
                    "ymin": round(y / height, 3),
                    "xmin": round(x / width, 3),
                    "ymax": round(min(height, y + h) / height, 3),
                    "xmax": round(min(width, x + w) / width, 3),
                    "confidence": round(min(0.92, 0.72 + (area / (height * width)) * 0.2), 2),
                    "color": (230, 180, 20) # Cyan
                })
        return boxes

    def _detect_garbage(self, img: np.ndarray, hsv: np.ndarray, height: int, width: int) -> List[Dict[str, Any]]:
        boxes = []
        # Garbage typically exhibits high color variance and spatial entropy
        # Split into grid blocks and calculate local standard deviation of hue and saturation
        step_y = max(30, height // 12)
        step_x = max(30, width // 12)

        for y in range(int(height * 0.3), height - step_y, step_y):
            for x in range(0, width - step_x, step_x):
                block = img[y:y+step_y, x:x+step_x]
                std_dev = np.std(block)
                # Refuse piles show dense multi-color texture variance
                if std_dev > 58.0:
                    boxes.append({
                        "label": "Garbage accumulation",
                        "ymin": round(y / height, 3),
                        "xmin": round(x / width, 3),
                        "ymax": round(min(height, y + step_y * 2) / height, 3),
                        "xmax": round(min(width, x + step_x * 2) / width, 3),
                        "confidence": round(min(0.88, 0.65 + (std_dev / 100.0) * 0.2), 2),
                        "color": (50, 200, 50) # Green
                    })
        return boxes

    def _detect_electrical_hazards(self, gray: np.ndarray, height: int, width: int) -> List[Dict[str, Any]]:
        boxes = []
        # Detect sagging lines or dangling wiring in upper/middle frame
        edges = cv2.Canny(gray, 70, 180)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=90, minLineLength=80, maxLineGap=15)
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                # If line is angled or sagging towards walking levels
                angle = abs(np.arctan2(y2 - y1, x2 - x1) * 180.0 / np.pi)
                if 15 < angle < 85 and max(y1, y2) > height * 0.4:
                    xmin, xmax = min(x1, x2), max(x1, x2)
                    ymin, ymax = min(y1, y2), max(y1, y2)
                    boxes.append({
                        "label": "Electrical hazard / Hanging wire",
                        "ymin": round(max(0, ymin - 15) / height, 3),
                        "xmin": round(max(0, xmin - 15) / width, 3),
                        "ymax": round(min(height, ymax + 15) / height, 3),
                        "xmax": round(min(width, xmax + 15) / width, 3),
                        "confidence": 0.84,
                        "color": (0, 255, 255) # Yellow
                    })
                    break # Don't overwhelm with multiple lines
        return boxes

    def _apply_nms(self, detections: List[Dict[str, Any]], iou_thresh: float = 0.45) -> List[Dict[str, Any]]:
        if not detections:
            return []
        
        # Sort by confidence descending
        dets = sorted(detections, key=lambda d: d["confidence"], reverse=True)
        keep = []

        while dets:
            current = dets.pop(0)
            keep.append(current)
            filtered = []
            for other in dets:
                iou = self._calculate_iou(current, other)
                if iou < iou_thresh:
                    filtered.append(other)
            dets = filtered
            if len(keep) >= 6: # limit top 6 distinct bounding boxes
                break
        return keep

    def _calculate_iou(self, a: Dict[str, Any], b: Dict[str, Any]) -> float:
        # Box coordinates: ymin, xmin, ymax, xmax
        y_a = max(a["ymin"], b["ymin"])
        x_a = max(a["xmin"], b["xmin"])
        y_b = min(a["ymax"], b["ymax"])
        x_b = min(a["xmax"], b["xmax"])

        inter_w = max(0.0, x_b - x_a)
        inter_h = max(0.0, y_b - y_a)
        inter_area = inter_w * inter_h

        area_a = (a["ymax"] - a["ymin"]) * (a["xmax"] - a["xmin"])
        area_b = (b["ymax"] - b["ymin"]) * (b["xmax"] - b["xmin"])
        union_area = area_a + area_b - inter_area

        if union_area <= 0:
            return 0.0
        return inter_area / union_area

cv_engine = InfrastructureVisionEngine()
