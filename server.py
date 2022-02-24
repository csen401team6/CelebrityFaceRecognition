from flask import Flask, request, jsonify
import util

app = Flask(__name__)


@app.route('/classify_image', methods=['GET', 'POST'])
def classify_image():

    # get the image from the POST request body
    image_data = request.form['image_data']

    # classify the image using classify_image() function in util.py, then 
    # convert the output into JSON
    response = jsonify(util.classify_image(image_data))

    # allow access from any domain, not just the domain our API is hosted on
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response

if __name__ == "__main__":
    # indicator that our server is starting
    print("Starting Python Flask Server For Sports Celebrity Image Classification")

    # load artifacts
    util.load_saved_artifacts()

    # run the server
    app.run(port=5000)