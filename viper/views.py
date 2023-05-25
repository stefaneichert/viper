from flask import render_template

from viper import app
from viper.model.novara import get_novara_places, get_novara_moves
import re


@app.route('/')
def about() -> str:
    moves = get_novara_moves()
    for row in moves:
        result = re.search('##en_;(.*)_en##', str(row['description']))
        if result:
            row['description'] = result.group(1)
    return render_template('index.html', placedata=get_novara_places(), moves=moves)


@app.route('/novara/places')
def novara_places() -> str:
    places = get_novara_places()
    return render_template('novara.html', entities=places)


@app.route('/novara/moves')
def novara_move() -> str:
    moves = get_novara_moves()
    return render_template('novara.html', entities=moves)

