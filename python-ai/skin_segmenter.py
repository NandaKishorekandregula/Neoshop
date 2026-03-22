# python-ai/skin_segmenter.py
# Fix 2: Isolate pure skin pixels using MediaPipe Face Mesh
# Removes beard, hair, eyes, lips, background before analysis

import cv2
import mediapipe as mp
import numpy as np

# Initialize once at module load — expensive to create per request
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

# MediaPipe Face Mesh landmark indices for PURE SKIN zones only
# Deliberately excludes: lips, eyes, beard/jaw area, hairline
LEFT_CHEEK  = [116, 123, 147, 213, 192, 214, 212, 216, 206, 203,
               36, 142, 126, 117, 118, 119, 120, 121, 128, 245]
RIGHT_CHEEK = [345, 352, 376, 433, 416, 434, 432, 436, 426, 423,
               266, 371, 355, 346, 347, 348, 349, 350, 357, 465]
FOREHEAD    = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
               361, 288, 397, 365, 379, 378, 400, 377, 152, 148]
NOSE_BRIDGE = [6, 197, 195, 5, 4, 1, 2, 98, 327]

SKIN_ZONES = LEFT_CHEEK + RIGHT_CHEEK + FOREHEAD + NOSE_BRIDGE


def get_skin_pixels(image_bytes: bytes) -> tuple:
    """
    Uses MediaPipe Face Mesh to extract only skin pixels.

    Process:
    1. Detect 468 facial landmarks
    2. Select only cheek, forehead, nose bridge points (no beard/lips/eyes)
    3. Draw convex hull of those points as a mask
    4. Extract pixels inside the mask
    5. Filter out extreme brightness values (shadows, highlights)

    Returns: (skin_pixels_array, metadata_dict)
             skin_pixels_array shape: (N, 3) — N pixels, each with R,G,B
             Returns (None, meta) if no face detected
    """
    np_array = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image_bgr is None:
        return None, {"error": "Could not decode image"}

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    h, w = image_rgb.shape[:2]

    results = face_mesh.process(image_rgb)

    if not results.multi_face_landmarks:
        return None, {
            "face_detected": False,
            "error": "No face detected. Please use a clear front-facing photo."
        }

    face_landmarks = results.multi_face_landmarks[0]

    # Build binary mask — white where skin is, black everywhere else
    mask = np.zeros((h, w), dtype=np.uint8)

    # Convert normalized landmark coords to pixel coords
    skin_points = []
    for idx in SKIN_ZONES:
        lm = face_landmarks.landmark[idx]
        px = max(0, min(int(lm.x * w), w - 1))
        py = max(0, min(int(lm.y * h), h - 1))
        skin_points.append([px, py])

    pts = np.array(skin_points, dtype=np.int32)
    hull = cv2.convexHull(pts)          # Outer boundary of skin zone
    cv2.fillConvexPoly(mask, hull, 255) # Fill with white

    # Extract RGB values where mask is white
    skin_pixels = image_rgb[mask == 255]

    # Remove extreme brightness values:
    # < 100 = shadows, beard hairs, eyelashes
    # > 720 = specular highlights, glasses reflections
    brightness = skin_pixels.sum(axis=1)
    valid = (brightness > 100) & (brightness < 720)
    skin_pixels = skin_pixels[valid]

    if len(skin_pixels) < 50:
        return None, {
            "face_detected": True,
            "error": "Too few valid skin pixels. Please use a well-lit, clear photo."
        }

    return skin_pixels, {
        "face_detected": True,
        "total_skin_pixels": len(skin_pixels),
        "segmentation_applied": True
    }


def get_average_skin_color(skin_pixels: np.ndarray) -> dict:
    """
    Get representative skin color using median (robust against outliers).

    Median is better than mean here because:
    - Mean is shifted by outlier pixels (one bright spot moves the average)
    - Median takes the middle value — unaffected by extremes
    """
    median_color = np.median(skin_pixels, axis=0)
    return {
        'r': int(median_color[0]),
        'g': int(median_color[1]),
        'b': int(median_color[2])
    }


def create_skin_only_image(skin_pixels: np.ndarray, size: int = 200):
    """
    Creates a 200x200 image filled ONLY with the isolated skin pixels.
    This is what we send to Gemini — it literally cannot see anything
    except the user's actual skin color.

    Gemini then classifies this color patch, not the original photo.
    """
    from PIL import Image as PILImage

    n_pixels = size * size

    if len(skin_pixels) < n_pixels:
        # Tile pixels to fill canvas
        repeats = (n_pixels // len(skin_pixels)) + 1
        tiled = np.tile(skin_pixels, (repeats, 1))[:n_pixels]
    else:
        indices = np.random.choice(len(skin_pixels), n_pixels, replace=False)
        tiled = skin_pixels[indices]

    canvas = tiled.reshape(size, size, 3).astype(np.uint8)
    return PILImage.fromarray(canvas, 'RGB')