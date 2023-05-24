from flask import render_template

from viper import app
from viper.model.novara import get_novara_places


@app.route('/')
def about() -> str:
    return render_template('index.html')


@app.route('/novara')
def novara() -> str:
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
        })

    return render_template('novara.html', places=list_of_places)
