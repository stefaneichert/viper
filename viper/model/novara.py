from datetime import datetime
from typing import Any

import requests

from viper import app


def get_novara_places() -> list[dict[str, Any]]:
    req = requests.get(
        f"{app.config['THANADOS_API']}/system_class/place",
        params={
            'type_id': 197085,
            'limit': 0,
            'show': ['links', 'when', 'types', 'geometry', 'depictions']},
        timeout=30)
    list_of_places = []
    for place in req.json()['results']:
        entity = place['features'][0]
        list_of_places.append({
            'id': entity['@id'].rsplit('/', 1)[-1],
            'title': entity['properties']['title'],
            'description': entity['descriptions'][0]
            if entity['descriptions'] else '',
            'geometry': entity['geometry'],
            'types': [item['label'] for item in entity['types']
                      if 'Place' in item['hierarchy']],
            'reference': [item['identifier'] for item in entity['links']]
            if entity['links'] else '',
            'images': [
                {'title': str(image['title']), 'url': image['url']}
                for image in entity['depictions']]
            if entity['depictions'] else ''
        })
    return list_of_places


def get_novara_moves() -> list[dict[str, Any]]:
    place_ids = get_places_for_move_events()
    moves = get_moves()
    list_of_moves = []
    for move in moves:
        begin = move['timespan']['begin_of_the_begin'].replace('T00:00:00', '')
        end = move['timespan']['begin_of_the_end'].replace('T00:00:00', '')
        begin_time = datetime.strptime(begin, '%Y-%m-%d')
        end_time = datetime.strptime(end, '%Y-%m-%d')
        begin_time_str = begin_time.strftime('%a %d %B %Y')
        end_time_str = end_time.strftime('%a %d %B %Y')
        image_ = move['representation'][0]['digitally_shown_by'][0]
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


def get_places_for_move_events() -> dict[int, int]:
    req_places = requests.get(
        f"{app.config['THANADOS_API']}/query/",
        params={
            'entities':
                ['196145', '196764', '198037', '196098', '196697', '196178', '196180', '196205', '196212', '198040', '196199', '196197', '196188', '196227', '196234', '196217', '196175', '196115', '196157', '196222', '196214', '196409', '196117', '196224', '196133', '196210', '196232', '196065', '196412', '196284', '196887', '196707', '196884', '196141', '196874', '196079', '196230', '196112', '196208', '196093', '196703', '196184', '196193', '196365', '196126'],
            'format': 'loud',
            'limit': 0},
        timeout=30)
    places = req_places.json()['results']
    place_ids = {}
    for place in places:
        location_id = \
            place['former_or_current_location'][0]['id'].rsplit('/', 1)[-1]
        place_id = place['id'].rsplit('/', 1)[-1]
        place_ids[location_id] = place_id
    return place_ids


def get_moves() -> list[dict[str, Any]]:
    req_moves = requests.get(
        f"{app.config['THANADOS_API']}/query",
        params={
            'entities': ['196290', '196411', '196288', '196293', '196294', '196300', '196417', '196306', '196304', '196299', '196298', '196244', '196292', '196305', '196296', '196308', '196286', '196287', '196289', '196307', '196302', '196291', '196314', '196415', '196242', '196303', '196297', '196095', '196311', '196243', '196301', '196238', '196295', '196081', '196416'],
            'limit': 0,
            'format': 'loud',
            'column': 'begin_from',
            'sort': 'asc'},
        timeout=30)
    return req_moves.json()['results']