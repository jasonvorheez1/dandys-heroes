"""Read/replace/insert source files inside js/game.js (a JSON-line bundle).
usage: bundle.py get NAME OUTFILE | put NAME INFILE [--after OTHER | --before OTHER] | list
"""
import json, sys
SRC = '/workspace/js/game.js'

def load():
    lines = open(SRC, encoding='utf-8').read().split('\n')
    return lines

def parse(line):
    return json.loads(line[:-1] if line.endswith(',') else line)

def main():
    cmd = sys.argv[1]
    lines = load()
    idx = [i for i, l in enumerate(lines) if l.startswith('["')]
    names = {parse(lines[i])[0]: i for i in idx}
    if cmd == 'list':
        print('\n'.join(names)); return
    name = sys.argv[2]
    if cmd == 'get':
        open(sys.argv[3], 'w', encoding='utf-8').write(parse(lines[names[name]])[1]); return
    if cmd == 'put':
        body = open(sys.argv[3], encoding='utf-8').read()
        enc = json.dumps([name, body], ensure_ascii=True, separators=(',', ':')) + ','
        if name in names:
            lines[names[name]] = enc
        else:
            if '--after' in sys.argv: pos = names[sys.argv[sys.argv.index('--after') + 1]] + 1
            elif '--before' in sys.argv: pos = names[sys.argv[sys.argv.index('--before') + 1]]
            else: raise SystemExit('new file needs --after/--before')
            lines.insert(pos, enc)
        open(SRC, 'w', encoding='utf-8').write('\n'.join(lines)); return
main()
