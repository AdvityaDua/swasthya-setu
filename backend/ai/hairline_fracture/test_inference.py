
import os
import sys
import torch

# Add backend directory to path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from ai.hairline_fracture.inference import predict_hairline_fracture

def test_inference():
    print("Testing Hairline Fracture Inference...")
    
    # Path to a test image
    # Trying to find one from the file list I saw earlier
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    image_path = os.path.join(base_dir, "diagnostic_images/scan.jpg")
    
    if not os.path.exists(image_path):
        print(f"Test image not found at {image_path}. Trying another...")
        # Try another one
        image_path = os.path.join(base_dir, "media/diagnostic_images/PHOTO-2026-01-29-02-11-30.jpg")
        if not os.path.exists(image_path):
             print(f"Test image also not found at {image_path}. Creating a dummy image.")
             from PIL import Image
             import numpy as np
             dummy_data = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)
             img = Image.fromarray(dummy_data)
             image_path = os.path.join(os.path.dirname(__file__), "test_dummy.jpg")
             img.save(image_path)
             print(f"Created dummy image at {image_path}")

    print(f"Using image: {image_path}")
    
    try:
        result = predict_hairline_fracture(image_path)
        
        print("\n--- Result ---")
        for k, v in result.items():
            print(f"{k}: {v}")
            
        if "error" in result:
            print("\nFAIL: Error in result")
            return
            
        # Verify keys
        required_keys = ["diagnosis", "probability", "confidence", "heatmap_path", "bbox_image_path", "bbox"]
        missing_keys = [k for k in required_keys if k not in result]
        
        if missing_keys:
            print(f"\nFAIL: Missing keys: {missing_keys}")
        else:
            print("\nSUCCESS: All keys present.")
            
            # Verify output files exist
            if os.path.exists(result["heatmap_path"]):
                print(f"Confirmed heatmap verified at {result['heatmap_path']}")
            else:
                print(f"FAIL: Heatmap file missing at {result['heatmap_path']}")
                
            if os.path.exists(result["bbox_image_path"]):
                print(f"Confirmed bbox image verified at {result['bbox_image_path']}")
            else:
                print(f"FAIL: Bbox image file missing at {result['bbox_image_path']}")

    except Exception as e:
        print(f"\nCRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_inference()
