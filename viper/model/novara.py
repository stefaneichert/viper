from typing import Any

import requests

from viper import app


def get_novara_places() -> dict[str, Any]:
    req = requests.get(
        f"{app.config['THANADOS_API']}/system_class/place",
        params={'type_id': 197085,
                'limit': 20,
                'show': ['links', 'when', 'types', 'geometry']})
    return req.json()['results']
