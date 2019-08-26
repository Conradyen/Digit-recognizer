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
from io import BytesIO
import numpy as np
import requests
from keras.preprocessing import image

app = Flask(__name__)

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
    model.add(Dense(10, activation = "softmax"))
    model.load_weights(weights, by_name=True) 
    model._make_predict_function()
    return model 

def build_model():

    global model
    global graph

    model = load_lenet(weights='Lenet_model_01.h5')
    graph = tf.get_default_graph()

#def preprocess_img(b64_img):

@app.route("/regonize",methods = ['POST'])
def regonize():

    if request.method == 'POST': 
        data = request.get_json()
        img = data.get('in_image','')
        #print(img)
    #img = image.img_to_array(image.load_img(BytesIO(base64.b64decode(request.form['in_image'])),target_size=(28, 28))) / 255.
    img = np.asarray(img).reshape(1,28,28,-1)
    img = 0.5 - img/2
    pred = model.predict(img)
    print(pred)
    payload = {"pred":pred.tolist()}

    return jsonify(payload)

@app.route("/")
def digit_reg():

    return render_template("paint_app.html")



if __name__ == '__main__':
    print('*loading lenet model...')
    build_model()
    print('*starting flask app...')
    app.run(debug=True)