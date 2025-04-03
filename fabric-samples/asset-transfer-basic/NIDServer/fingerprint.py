from flask import Flask, request, jsonify
import cv2
import numpy as np
from skimage.feature import local_binary_pattern
import os
import json
import tempfile

app = Flask(__name__)

# Reusing the functions from previous implementation
def preprocess_fingerprint(image):
    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    image = clahe.apply(image)
    image = cv2.fastNlMeansDenoising(image)
    _, image = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return image

def extract_features(image):
    radius = 3
    n_points = 8 * radius
    lbp = local_binary_pattern(image, n_points, radius, method='uniform')
    hist, _ = np.histogram(lbp.ravel(), bins=np.arange(0, n_points + 3), range=(0, n_points + 2))
    hist = hist.astype("float")
    hist /= (hist.sum() + 1e-7)
    return hist

# Load citizen data
def load_citizens():
    file_path = os.path.join(os.path.dirname(__file__), 'citizens.json')
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

# Global variable to store fingerprint database
fingerprint_database = {}

def load_database(database_path, start_id=5000000001, end_id=5000000150):
    """Load fingerprint database at server startup"""
    global fingerprint_database
    for fingerprint_id in range(start_id, end_id + 1):
        image_path = os.path.join(database_path, f"{fingerprint_id}.bmp")
        if os.path.exists(image_path):
            image = cv2.imread(image_path)
            if image is not None:
                processed_image = preprocess_fingerprint(image)
                features = extract_features(processed_image)
                fingerprint_database[fingerprint_id] = features
    print(f"Loaded {len(fingerprint_database)} fingerprints into database")

def match_fingerprint(query_features, threshold=0.3):
    """Match fingerprint features against database"""
    best_score = float('inf')
    best_match_id = None

    for fingerprint_id, db_features in fingerprint_database.items():
        score = cv2.compareHist(query_features.astype(np.float32), 
                                db_features.astype(np.float32), 
                                cv2.HISTCMP_CHISQR)
        if score < best_score:
            best_score = score
            best_match_id = fingerprint_id

    return best_match_id if best_score < threshold else None

@app.route('/match', methods=['POST'])
def match_endpoint():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(suffix='.bmp', delete=False) as temp_file:
            file.save(temp_file.name)
            query_image = cv2.imread(temp_file.name)
            if query_image is None:
                return jsonify({'error': 'Invalid image file'}), 400

            # Process and match fingerprint
            processed_query = preprocess_fingerprint(query_image)
            query_features = extract_features(processed_query)
            match_id = match_fingerprint(query_features)

            # Clean up temporary file
            os.unlink(temp_file.name)

            if match_id:
                # Fetch citizen data using matched fingerprint ID
                citizens = load_citizens()
                citizen = next((c for c in citizens if c['nid_no'] == str(match_id)), None)

                if citizen:
                    return jsonify({
                        'match_found': True,
                        'nid_no': match_id,
                        'citizen_data': citizen
                    })
                else:
                    return jsonify({
                        'match_found': True,
                        'nid_no': match_id,
                        'citizen_data': 'Citizen data not found'
                    })
            else:
                return jsonify({
                    'match_found': False,
                    'nid_no': None,
                    'citizen_data': None
                })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/nid', methods=['POST'])
def get_citizen_by_nid():
    data = request.form
    nid_no = data.get('nid_no')
    if not nid_no:
        return jsonify({'error': 'No NID number provided'}), 400

    citizens = load_citizens()
    citizen = next((c for c in citizens if c['nid_no'] == nid_no), None)

    if citizen:
        return jsonify({'nid_no': nid_no, 'citizen_data': citizen})
    else:
        return jsonify({'error': 'Citizen not found'}), 404

if __name__ == '__main__':
    DATABASE_PATH = "./fingerprints_raw"  # Update this path
    load_database(DATABASE_PATH)
    app.run(host='0.0.0.0', port=15000)
