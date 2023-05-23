from flask import render_template

from viper import app


@app.route('/')
def about() -> str:
    return render_template('index.html')
