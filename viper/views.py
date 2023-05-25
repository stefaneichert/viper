from flask import render_template, request

from viper import app
from viper.model.novara import get_novara_places, get_novara_moves


@app.route('/')
def about() -> str:
    moves = get_novara_moves()
    for row in moves:
        s = row['description']
        if s is not None:
            start = s.find('##en_') + 8
            end = s.find('_en##', start) - 2
            row['description'] = s[start:end]
        else:
            row['description'] = ""
    return render_template('index.html', moves=moves)


@app.route('/novara/places')
def novara_places() -> str:
    places = get_novara_places()
    return render_template('novara.html', entities=places)


@app.route('/novara/moves')
def novara_move() -> str:
    moves = get_novara_moves()
    return render_template('novara.html', entities=moves)


@app.route('/iiif/')
def iiif() -> str:
    return render_template('iiif.html', manifest=request.args.get('manifest'))
