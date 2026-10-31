"""Read, replace, or insert sources in the single-line js/game.js bundle.

usage: bundle.py list | get NAME OUTFILE | put NAME INFILE [--after OTHER | --before OTHER]
"""
import json
import sys
from pathlib import Path

SRC = Path('/workspace/js/game.js')
START = 'var S='
END = ';\nfor(var i='


def load():
    source = SRC.read_text(encoding='utf-8')
    prefix, remaining = source.split(START, 1)
    payload, suffix = remaining.split(END, 1)
    return prefix, json.loads(payload), END + suffix


def main():
    command = sys.argv[1]
    prefix, scripts, suffix = load()
    names = [name for name, _ in scripts]
    if command == 'list':
        print('\n'.join(names))
        return
    name = sys.argv[2]
    if command == 'get':
        Path(sys.argv[3]).write_text(scripts[names.index(name)][1], encoding='utf-8')
        return
    if command == 'put':
        body = Path(sys.argv[3]).read_text(encoding='utf-8')
        if name in names:
            scripts[names.index(name)][1] = body
        else:
            marker = '--after' if '--after' in sys.argv else '--before'
            if marker not in sys.argv:
                raise SystemExit('new file needs --after/--before')
            anchor = sys.argv[sys.argv.index(marker) + 1]
            index = names.index(anchor) + (marker == '--after')
            scripts.insert(index, [name, body])
        SRC.write_text(prefix + START + json.dumps(scripts, ensure_ascii=True, separators=(',', ':')) + suffix,
                       encoding='utf-8')
        return
    raise SystemExit('unknown command: ' + command)


if __name__ == '__main__':
    main()
