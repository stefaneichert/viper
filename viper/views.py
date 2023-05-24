from flask import render_template

from viper import app
from viper.model.novara import get_novara_places, get_novara_moves


@app.route('/')
def about() -> str:
    return render_template('index.html')


@app.route('/novara/places')
def novara_places() -> str:
    places = get_novara_places()
    list_of_places = []
    for place in places:
        entity = place['features'][0]
        list_of_places.append({
            'title': entity['properties']['title'],
            'when': entity['when'],
            'geometry': entity['geometry'],
            'types': [item['label'] for item in entity['types']],
            'reference': [item['identifier'] for item in entity['links']]
            if entity['links'] else ''
        })
    return render_template('novara.html', entities=list_of_places)


@app.route('/novara/moves')
def novara_move() -> str:
    moves = get_novara_moves()

    return render_template('novara.html', entities=moves['results'])

