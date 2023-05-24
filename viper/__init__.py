from pathlib import Path

from flask import Flask, Response

app = Flask(__name__, instance_relative_config=True)
app.config.from_object('config')
app.config.from_pyfile('production.py')

# pylint: disable=wrong-import-position, import-outside-toplevel
from viper import views

ROOT_PATH = Path(__file__).parent

STATIC_PATH = ROOT_PATH / 'static'


@app.after_request
def apply_caching(response: Response) -> Response:
    response.headers['Strict-Transport-Security'] = \
        'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response
