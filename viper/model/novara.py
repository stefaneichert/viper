from typing import Any
from datetime import datetime
import requests

from viper import app

def get_novara_places() -> list[dict[str, Any]]:
    req = requests.get(
        f"{app.config['THANADOS_API']}/system_class/place",
        params={
            'type_id': 197085,
            'limit': 0,
            'show': ['links', 'when', 'types', 'geometry', 'depictions']})
    list_of_places = []
    for place in req.json()['results']:
        entity = place['features'][0]
        list_of_places.append({
            'id': entity['@id'].rsplit('/', 1)[-1],
            'title': entity['properties']['title'],
            'description': entity['descriptions'][0]
            if entity['descriptions'] else '',
            'geometry': entity['geometry'],
            'types': [item['label'] for item in entity['types'] if 'Place' in item['hierarchy']],
            'reference': [item['identifier'] for item in entity['links']]
            if entity['links'] else '',
            'images': [
                {'title': str(image['title']), 'url': image['url']}
                for image in entity['depictions']]
            if entity['depictions'] else ''
        })
    return list_of_places


def get_novara_moves() -> list[dict[str, Any]]:
    req_places = requests.get(
        f"{app.config['THANADOS_API']}/system_class/place",
        params={
            'type_id': 197085,
            'format': 'loud',
            'limit': 0})
    places = req_places.json()['results']
    place_ids = {}
    for place in places:
        location_id = place['former_or_current_location'][0]['id'].rsplit('/', 1)[-1]
        place_id = place['id'].rsplit('/', 1)[-1]
        place_ids[location_id] = place_id
    req_expedition = requests.get(
        f"{app.config['THANADOS_API']}/entity/196078",
        params={'format': 'loud'})
    move_ids = \
        [move['id'].rsplit('/', 1)[-1]
         for move in req_expedition.json()['part_of']]
    req_moves = requests.get(
        f"{app.config['THANADOS_API']}/query",
        params={
            'entities': move_ids,
            'limit': 0,
            'format': 'loud',
            'column': 'begin_from',
            'sort': 'asc'})
    moves = req_moves.json()['results']
    list_of_moves = []
    for move in moves:
        begin = move['timespan']['begin_of_the_begin'].replace('T00:00:00', '')
        end = move['timespan']['begin_of_the_end'].replace('T00:00:00', '')
        begin_time = datetime.strptime(begin, '%Y-%m-%d')
        end_time = datetime.strptime(end, '%Y-%m-%d')
        begin_time_str = begin_time.strftime('%a %d %b %Y')
        end_time_str = end_time.strftime('%a %d %b %Y')
        image_ =move['representation'][0]['digitally_shown_by'][0]
        place_from_id = move['moved_from'][0]['id'].rsplit('/', 1)[-1]
        place_to_id = move['moved_to'][0]['id'].rsplit('/', 1)[-1]
        list_of_moves.append({
            'id': move['id'].rsplit('/', 1)[-1],
            'title': move['_label'],
            'description': move['content'],
            'begin': begin_time_str,
            'end': end_time_str,
            'images': {'title': image_['_label'], 'url': image_['id']},
            'place_from': place_ids[place_from_id],
            'place_to': place_ids[place_to_id]})

    return list_of_moves
