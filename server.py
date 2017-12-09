from flask import Flask, url_for, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.secret_key = '1qaz!QAZ'
    app.debug = True
    app.run(host='0.0.0.0', port=8080)
