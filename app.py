from flask import Flask ,request, jsonify,render_template
import pandas as pd
import tensorflow as tf
import keras
from keras.models import load_model
from keras.models import Sequential
from keras.layers import Dense, Dropout, Flatten, Conv2D, MaxPool2D
from keras.optimizers import RMSprop
import base64
import json
import cv2
from io import BytesIO
import numpy as np
import requests
from keras.preprocessing import image
from flask_cors import CORS
import pickle
import base64
from io import BytesIO
from PIL import Image
from binascii import a2b_base64

app = Flask(__name__)
CORS(app)

model = None

def load_lenet(weights = 'Lenet_model_01.h5'):

    model = Sequential()
    model.add(Conv2D(filters = 32, kernel_size = (5,5),padding = 'Same',activation ='relu', input_shape = (28,28,1)))
    model.add(Conv2D(filters = 32, kernel_size = (5,5),padding = 'Same', activation ='relu'))
    #model.add(Dropout(0.25))
    model.add(Conv2D(filters = 64, kernel_size = (3,3),padding = 'Same',activation ='relu'))
    model.add(MaxPool2D(pool_size=(2,2), strides=(2,2)))
    model.add(Conv2D(filters = 64, kernel_size = (3,3),padding = 'Same',activation ='relu'))
    model.add(Flatten())
    model.add(Dense(256, activation = "relu"))
    #model.add(Dropout(0.5))
    model.add(Dense(10))
    model.load_weights(weights, by_name=True)
    model._make_predict_function()
    return model

def build_model():

    global model
    global graph

    model = load_lenet(weights='Lenet_model_01.h5')
    graph = tf.get_default_graph()

#def preprocess_img(b64_img):

def pad_image(img, pad_t, pad_r, pad_b, pad_l):
    """Add padding of zeroes to an image.
    Add padding to an array image.
    :param img:
    :param pad_t:
    :param pad_r:
    :param pad_b:
    :param pad_l:
    """
    height, width= img.shape

    # Adding padding to the left side.
    pad_left = np.zeros(( height, pad_l))
    img = np.concatenate((pad_left, img), axis = 1)

    # Adding padding to the top.
    pad_up = np.zeros((pad_t, pad_l + width))
    img = np.concatenate((pad_up, img), axis = 0)

    # Adding padding to the right.
    pad_right = np.zeros((height + pad_t, pad_r))
    img = np.concatenate((img, pad_right), axis = 1)

    # Adding padding to the bottom
    pad_bottom = np.zeros((pad_b, pad_l + width + pad_r))
    img = np.concatenate((img, pad_bottom), axis = 0)

    return img

def center_image(img):
    """Return a centered image.
    :param img:
    """
    col_sum = np.where(np.sum(img, axis=0) > 0)
    row_sum = np.where(np.sum(img, axis=1) > 0)
    y1, y2 = row_sum[0][0], row_sum[0][-1]
    x1, x2 = col_sum[0][0], col_sum[0][-1]

    cropped_image = img[y1:y2, x1:x2]

    zero_axis_fill = (img.shape[0] - cropped_image.shape[0])
    one_axis_fill = (img.shape[1] - cropped_image.shape[1])

    top = zero_axis_fill / 2
    bottom = zero_axis_fill - top
    left = one_axis_fill / 2
    right = one_axis_fill - left

    padded_image = pad_image(cropped_image, int(top), int(left), int(bottom), int(right))

    return padded_image

def resize_image(img, size=(28,28)):
    print(img.shape)
    h, w = img.shape

    if h == w:
        return cv2.resize(img, size, cv2.INTER_AREA)

    dif = h if h > w else w

    if dif > (size[0]+size[1])//2:
        interpolation = cv2.INTER_AREA
    else:
        interpolation = cv2.INTER_CUBIC


    x_pos = (dif - w)//2
    y_pos = (dif - h)//2

    if len(img.shape) == 2:
        mask = np.zeros((dif, dif), dtype=img.dtype)
        mask[y_pos:y_pos+h, x_pos:x_pos+w] = img[:h, :w]
    else:
        mask = np.zeros((dif, dif, c), dtype=img.dtype)
        mask[y_pos:y_pos+h, x_pos:x_pos+w, :] = img[:h, :w, :]

    return cv2.resize(mask, size, interpolation)

def toencodeStr(arr):
    retval, buffer = cv2.imencode('.jpg', pic_img)
    pic_str = base64.b64encode(buffer)
    pic_str = pic_str.decode()

    return pic_str

@app.route("/app/recognize", methods=['POST'])
def regonize():

    if request.method == 'POST':
        data = str(request.data,encoding = "utf-8").split(';')[1]

        encoded_data = data.split(',')[1][:-2]
        #decoded_image = base64.b64decode(encoded_data)
        binary_data = a2b_base64(encoded_data)

        img = Image.open(BytesIO(binary_data)).resize((280, 280)).convert('LA')

        pixels = np.asarray(img, dtype='uint8')[:,:,1]

        img = center_image(pixels)
        nninput = resize_image(img)/255
    print(np.maximum(nninput))
    img = nninput.reshape(1, 28, 28, -1)
    print(img.shape)
    with graph.as_default():
        pred = model.predict(img)
    result = np.argmax(pred)
    payload = {"pred":pred.tolist(),
                "result":str(result)
    }

    return jsonify(payload)

@app.route("/app")
def digit_reg():

    return render_template("paint_app.html")

@app.route("/")
def index():

    return render_template("index.html")


if __name__ == '__main__':
    print('*loading lenet model...')
    build_model()
    print('*starting flask app...')
    #host='0.0.0.0', port=80
    app.run(debug=True,host='0.0.0.0', port=80)
