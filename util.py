import joblib
import json
import numpy as np
import base64
import cv2
from wavelet import w2d

__class_name_to_number = {}
__class_number_to_name = {}

__model = None

def class_number_to_name(class_num):
    return __class_number_to_name[class_num]

def load_saved_artifacts():
    print("loading saved artifacts...start")
    # this ensures that when using these variables inside the function
    # it will not create new ones
    global __class_name_to_number
    global __class_number_to_name

    with open("class_dictionary.json", "r") as f:
        # load the dictionary
        __class_name_to_number = json.load(f)

        # reverse the dictionary
        __class_number_to_name = {v:k for k,v in __class_name_to_number.items()}
        
    # load the model
    global __model
    if __model is None:
        with open('saved_model.pkl', 'rb') as f:
            __model = joblib.load(f)
    print("loading saved artifacts...done")


def get_cv2_image_from_base64_string(b64str):
    # credit: https://stackoverflow.com/questions/33754935/read-a-base-64-encoded-image-from-memory-using-opencv-python-library
    
    # Get the elements separated by comma in a list. The image is the second element.
    # The first is just metadata.
    encoded_data = b64str.split(',')[1]

    # Decode the string into bytes in a buffer
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)

    # read an image from a buffer in memory
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def get_cropped_image_if_2_eyes(image_path, image_base64_data):
    face_cascade = cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier('./opencv/haarcascades/haarcascade_eye.xml')

    if image_path:
        img = cv2.imread(image_path)
    else:
        img = get_cv2_image_from_base64_string(image_base64_data)

    if img is None: return None

    cropped_faces = []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    for (x,y,w,h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        roi_color = img[y:y+h, x:x+w]
        eyes = eye_cascade.detectMultiScale(roi_gray)
        if len(eyes) >= 2:
            cropped_faces.append(roi_color)

    return cropped_faces

def classify_image(image_base64_data, file_path=None):
    result = []

    imgs = get_cropped_image_if_2_eyes(file_path, image_base64_data)
    for img in imgs:
        scalled_raw_img = cv2.resize(img, (32, 32))
        img_har = w2d(img)
        scalled_img_har = cv2.resize(img_har, (32, 32))
        combined_img = np.vstack((scalled_raw_img.reshape(32 * 32 * 3, 1), scalled_img_har.reshape(32 * 32, 1)))
        final = combined_img.reshape(1, 4096).astype(float)

        result.append({
            # the name of the predicted person
            'class': class_number_to_name(__model.predict(final)[0]),

            # the probabilities rounded to 2 decimal places
            'class_probability': np.around(__model.predict_proba(final)*100,2).tolist()[0],
            
            # the number of the predicted class
            'class_dictionary': __class_name_to_number
        })

    return result

