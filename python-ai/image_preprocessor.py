
import cv2
import numpy as np


def apply_gray_world(image_bgr: np.ndarray) -> np.ndarray:
    """
    Gray-World Color Constancy.

    Theory: In a natural image, the average of all pixels should be
    neutral gray. If the average is yellowish, the scene has warm light.
    We scale each channel so its average matches the neutral target.

    Effect: Removes yellow (incandescent), blue (fluorescent), or
    green (LED) color casts from room lighting.
    """
    image_float = image_bgr.astype(np.float64)

    # Calculate per-channel averages across all pixels
    avg_b = np.mean(image_float[:, :, 0])
    avg_g = np.mean(image_float[:, :, 1])
    avg_r = np.mean(image_float[:, :, 2])

    # Target: overall neutral gray
    avg_gray = (avg_b + avg_g + avg_r) / 3

    if avg_b == 0 or avg_g == 0 or avg_r == 0:
        return image_bgr  # Guard against divide by zero

    # Scale each channel toward neutral gray
    normalized = image_float.copy()
    normalized[:, :, 0] = image_float[:, :, 0] * (avg_gray / avg_b)
    normalized[:, :, 1] = image_float[:, :, 1] * (avg_gray / avg_g)
    normalized[:, :, 2] = image_float[:, :, 2] * (avg_gray / avg_r)

    return np.clip(normalized, 0, 255).astype(np.uint8)


def apply_white_patch(image_bgr: np.ndarray) -> np.ndarray:
    """
    White Patch (Retinex) Color Constancy.

    Theory: The brightest pixel in the scene should be white.
    Scale all channels so the maximum pixel value reaches 255.

    Used for: Dark/underexposed images where Gray-World is too aggressive.
    """
    image_float = image_bgr.astype(np.float64)

    max_b = np.max(image_float[:, :, 0])
    max_g = np.max(image_float[:, :, 1])
    max_r = np.max(image_float[:, :, 2])

    if max_b == 0 or max_g == 0 or max_r == 0:
        return image_bgr

    normalized = image_float.copy()
    normalized[:, :, 0] = image_float[:, :, 0] * (255.0 / max_b)
    normalized[:, :, 1] = image_float[:, :, 1] * (255.0 / max_g)
    normalized[:, :, 2] = image_float[:, :, 2] * (255.0 / max_r)

    return np.clip(normalized, 0, 255).astype(np.uint8)


def normalize_lighting(image_bytes: bytes) -> tuple:
    """
    Main entry point. Picks best algorithm based on image brightness.

    - Dark images  (brightness < 80):  White Patch (more aggressive)
    - Normal images (brightness >= 80): Gray-World (more balanced)

    Returns: (normalized_bytes, metadata_dict)
    """
    np_array = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image_bgr is None:
        raise ValueError("Could not decode image — file may be corrupted")

    # Measure image brightness
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))

    # Choose algorithm
    if mean_brightness < 80:
        normalized_bgr = apply_white_patch(image_bgr)
        algorithm_used = "white_patch"
        reason = f"Low brightness ({mean_brightness:.0f}) — White Patch applied"
    else:
        normalized_bgr = apply_gray_world(image_bgr)
        algorithm_used = "gray_world"
        reason = f"Normal brightness ({mean_brightness:.0f}) — Gray-World applied"

    # Encode back to JPEG bytes
    success, encoded = cv2.imencode('.jpg', normalized_bgr,
                                    [cv2.IMWRITE_JPEG_QUALITY, 95])
    if not success:
        raise ValueError("Failed to encode normalized image")

    metadata = {
        "algorithm": algorithm_used,
        "reason": reason,
        "originalBrightness": round(mean_brightness, 2),
        "lightingNormalized": True
    }

    return encoded.tobytes(), metadata