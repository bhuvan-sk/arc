"""Image ingestion — normalize orientation, cap longest edge at 2000px, return PNG bytes."""
import io
from PIL import Image, ImageOps


MAX_EDGE = 2000


def normalize_image(raw_bytes: bytes) -> bytes:
    """Normalize image orientation and cap to 2000px, return PNG bytes."""
    img = Image.open(io.BytesIO(raw_bytes))
    img = ImageOps.exif_transpose(img)  # fix rotation
    img = img.convert("RGB")

    # Cap longest edge
    w, h = img.size
    if max(w, h) > MAX_EDGE:
        ratio = MAX_EDGE / max(w, h)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
