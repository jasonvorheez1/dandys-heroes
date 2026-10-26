"""One-time bundle patches for the Hundred Acre Wood: voice clips, sounds and local uploads. Idempotent."""
import subprocess
B = '/workspace/tools/bundle.py'
def get(n): subprocess.check_call(['python3', '-I', B, 'get', n, '/tmp/_p.js']); return open('/tmp/_p.js', encoding='utf-8').read()
def put(n, s): open('/tmp/_p.js', 'w', encoding='utf-8').write(s); subprocess.check_call(['python3', '-I', B, 'put', n, '/tmp/_p.js'])
c = get('core.js')
for f in ['pooh-yummy.wav', 'pooh-alot.wav', 'pooh-more.wav', 'pooh-ooh.wav', 'pooh-extra.wav']:
    if "'" + f + "'" not in c: c = c.replace("new Set([", "new Set(['" + f + "', ", 1)
put('core.js', c)
a = get('audio.js')
if 'pooh_yummy' not in a:
    old = "  kh_blip: ['kh-blip.wav']\n};"
    assert a.count(old) == 1
    a = a.replace(old, "  kh_blip: ['kh-blip.wav'],\n" + ",\n".join(f"  wood_{n}: ['wood/{n}.wav']" for n in []) + "\n};")
    old2 = "  sora_down: ['sorako.wav'],\n"
    assert a.count(old2) == 1
    a = a.replace(old2, old2 + "  pooh_yummy: ['pooh-yummy.wav'],\n  pooh_alot: ['pooh-alot.wav'],\n  pooh_more: ['pooh-more.wav'],\n  pooh_ooh: ['pooh-ooh.wav'],\n  pooh_extra: ['pooh-extra.wav'],\n")
put('audio.js', a)
print('wood audio patched')
