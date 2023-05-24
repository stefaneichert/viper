from typing import Any

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
            'format': 'lp',
            'column': 'begin_from',
            'sort': 'asc',
            'show': ['links', 'when', 'types', 'geometry', 'depictions']})
    moves = req_moves.json()['results']
    list_of_moves = []
    for move in moves:
        entity = move['features'][0]
        list_of_moves.append({
            'id': entity['@id'].rsplit('/', 1)[-1],
            'title': str(entity['properties']['title']),
            'description': str(entity['descriptions'][0]) if entity[
                'descriptions'] else '',
            'begin': str(entity['when']['timespans'][0]['start']['earliest']),
            'geometry': entity['geometry'],
            'reference': [item['identifier'] for item in entity['links']]
            if entity['links'] else '',
            'images': [
                {'title': str(image['title']), 'url': image['url']}
                for image in entity['depictions']]
            if entity['depictions'] else ''
        })

    return list_of_moves
