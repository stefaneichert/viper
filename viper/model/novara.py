from typing import Any

import requests

from viper import app


def get_novara_places() -> dict[str, Any]:
    req = requests.get(
        f"{app.config['THANADOS_API']}/system_class/place",
        params={
            'type_id': 197085,
            'limit': 0,
            'show': ['links', 'when', 'types', 'geometry']})
    return req.json()['results']


def get_novara_moves() -> dict[str, Any]:
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
    return req_moves.json()
