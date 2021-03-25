import sqlite3
from flask import Flask
from flask import jsonify
from flask import request
from flask_cors import CORS
import itertools

app = Flask(__name__)
cors = CORS(app)

# Database resolvers


def get_all_sdks():
    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    sdks = []
    for row in c.execute('SELECT id, name FROM sdk ORDER BY name'):
        sdks.append(dict(zip(('id', 'name'), row)))

    return sdks


def get_sdk_general_info(args):
    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    sdk_id = args.get('sdk_id')

    general_data = {}

    if sdk_id:
        c.execute(
            f'SELECT COUNT(*) FROM app_sdk WHERE sdk_id = {sdk_id} AND installed')
        general_data["num_installed_apps"] = c.fetchone()[0]

        c.execute(
            f'SELECT COUNT(*) FROM( SELECT app_id FROM app_sdk WHERE sdk_id={sdk_id} AND installed INTERSECT SELECT app_id FROM app_sdk WHERE sdk_id NOT IN({sdk_id}) AND installed=0)')
        general_data["acquired_total"] = c.fetchone()[0]

        c.execute(
            f'SELECT COUNT(*) FROM( SELECT app_id FROM app_sdk WHERE sdk_id={sdk_id} AND installed = 0 INTERSECT SELECT app_id FROM app_sdk WHERE sdk_id NOT IN({sdk_id}) AND installed=1)')
        general_data["churned_total"] = c.fetchone()[0]

        c.execute(f'SELECT name FROM sdk WHERE id={sdk_id}')
        general_data["name"] = c.fetchone()[0]

        return general_data

    return {"ERROR": "no sdk_id argument provided."}


def get_sdk_churn(args):

    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    sdk1_id = args.get('sdk1_id')
    sdk2_id = args.get('sdk2_id')

    sdk_ids = [sdk1_id, sdk2_id]

    acqui_dict = {}
    churn_dict = {}

    for a in sdk_ids:
        for b in sdk_ids:
            if a != b:
                c.execute(
                    f'SELECT COUNT(*) FROM( SELECT app_id FROM app_sdk WHERE sdk_id={a} AND installed=1 INTERSECT SELECT app_id FROM app_sdk WHERE sdk_id={b} AND installed=0) ')
                result1 = c.fetchone()
                if a in acqui_dict:
                    acqui_dict[a]['acquired_from'][b] = result1[0]
                else:
                    acqui_dict[a] = {'acquired_from': {b: result1[0]}}

                # if lists already order, just a linear scan. more efficiently than that, 

                c.execute(
                    f'SELECT COUNT(*) FROM( SELECT app_id FROM app_sdk WHERE sdk_id={b} AND installed=1 INTERSECT SELECT app_id FROM app_sdk WHERE sdk_id={a} AND installed=0) ')
                result2 = c.fetchone()
                if a in churn_dict:
                    churn_dict[a]['churned_to'][b] = result2[0]
                else:
                    churn_dict[a] = {'churned_to': {b: result2[0]}}

    merged_dict = {k: {**churn_dict[k], **acqui_dict[k]}
                   for k in acqui_dict.keys()}

    return merged_dict


def get_app(args):

    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    apps = []

    app_id = args.get('app_id')

    if app_id:
        c.execute(f'SELECT id, name FROM app WHERE id = {app_id}')
        return c.fetchone()[0]

        for row in c.execute(f'SELECT COUNT(*) FROM app_sdk WHERE sdk_id = {app_id} AND installed'):
            apps.append(row)
        return apps

    else:
        for row in c.execute('SELECT id, name FROM app LIMIT 30'):
            apps.append(row)
        return dict(apps)


def get_total_number_of_apps():
    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    c.execute('SELECT COUNT(*) FROM app')
    return c.fetchone()[0]


def get_all_app_sdks(args):
    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    apps_sdks = []
    app_id = args.get('app_id')
    sdk_id = args.get('sdk_id')

    if app_id and sdk_id:
        for row in c.execute('SELECT * FROM app_sdk'):
            data = dict(zip(('app_id', 'sdk_id', 'installed'), row))
            apps_sdks.append(data)
        return apps_sdks


def get_sample_apps(args):
    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    sdk_id = args.get('sdk_id')

    app_names = []
    for row in c.execute(f'SELECT A.name FROM app_sdk AS S JOIN app AS A ON S.app_id = A.id WHERE sdk_id = {sdk_id} LIMIT 10'):
        data = row[0]
        app_names.append(data)
    return {sdk_id: {"sample_apps": app_names}}


# API routes

@ app.route('/api/sdk')
def example1():
    return jsonify(get_all_sdks())


@ app.route('/api/sdk/general_info')
def example2():
    args = request.args
    return jsonify(get_sdk_general_info(args))


@ app.route('/api/sdk/churn')
def example3():
    args = request.args
    return jsonify(get_sdk_churn(args))


@ app.route('/api/sdk/sample_apps')
def example4():
    args = request.args
    return jsonify(get_sample_apps(args))


@ app.route('/api/app')
def example5():
    args = request.args
    return jsonify(get_app(args))


@ app.route('/api/app/count')
def example6():
    return jsonify(get_total_number_of_apps())


@ app.route('/api/app_sdk')
def example7():
    args = request.args
    return jsonify(get_all_app_sdks(args))


if __name__ == '__main__':
    app.run()