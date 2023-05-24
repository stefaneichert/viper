from flask import render_template

from viper import app
from viper.model.novara import get_novara_places


@app.route('/')
def about() -> str:
    return render_template('index.html')


@app.route('/novara')
def novara() -> str:
    places = get_novara_places()
    print(places)
    return render_template('novara.html')
