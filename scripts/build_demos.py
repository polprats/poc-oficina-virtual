"""Build three independently usable static demos without changing old Git tags.

Usage: python scripts/build_demos.py [--output <absolute-or-relative-directory>]
The current checkout supplies the DOM/modal demo. v1.0.0 and v1.1.0 are read
with git archive into ignored scratch folders. Their only temporary adaptation
is the asset URL prefix needed to host them beneath their own subdirectories.
"""
import argparse
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', default=str(ROOT / 'hosting-dist'))
args = parser.parse_args()
output = Path(args.output).resolve()
if output == ROOT or ROOT in output.parents and output.name in ['src', 'public', 'node_modules']:
    raise SystemExit('Choose a dedicated build output directory')
output.mkdir(parents=True, exist_ok=True)
scratch = ROOT / '.demo-builds'
scratch.mkdir(exist_ok=True)
vite = ROOT / 'node_modules/vite/bin/vite.js'
node = shutil.which('node')
if not node or not vite.exists():
    raise SystemExit('Run npm ci first; Node.js is required')

def snapshot(ref):
    target = Path(tempfile.mkdtemp(prefix=ref + '-', dir=scratch))
    data = subprocess.run(['git', 'archive', '--format=tar', ref], cwd=ROOT, capture_output=True, check=True).stdout
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        # Validate every extraction target before writing archived repository files.
        for member in archive.getmembers():
            resolved = (target / member.name).resolve()
            if not resolved.is_relative_to(target) or member.issym() or member.islnk():
                raise ValueError('Unsafe archive entry')
        archive.extractall(target, filter='data')
    scene = target / 'src/game/OfficeScene.js'
    source = scene.read_text(encoding='utf-8')
    # Do not edit tag history. Only the disposable build copy gets deployment-aware URLs.
    source = re.sub(r'''(['"])/assets/([^'"]+)\1''',
                    lambda m: '`${import.meta.env.BASE_URL}assets/' + m.group(2) + '`', source)
    scene.write_text(source, encoding='utf-8')
    return target

demos = [
    ('inicial', 'v1.0.0', snapshot('v1.0.0')),
    ('george', 'v1.1.0', snapshot('v1.1.0')),
    ('dom', json.loads((ROOT / 'package.json').read_text())['version'], ROOT),
]
for slug, version, checkout in demos:
    dest = output / slug
    result = subprocess.run([node, str(vite), 'build', '--base=/' + slug + '/', '--outDir=' + str(dest)],
                            cwd=checkout, text=True, capture_output=True)
    if result.returncode:
        print(result.stdout)
        print(result.stderr)
        raise SystemExit(result.returncode)
    # Small navigation lives outside Vue, so each immutable app can return to the gallery.
    tag = version if version.startswith('v') else 'v' + version
    nav = f'''<nav aria-label="Versions de la demo" style="position:fixed;bottom:10px;right:12px;z-index:40;display:flex;gap:12px;align-items:center;padding:9px 13px;border:1px solid #bdcdbd;border-radius:9px;background:#f7faf3f2;color:#36583f;font:11px sans-serif;box-shadow:0 3px 12px #15362220"><a href="/" style="color:inherit">← Tres demos</a><span>{tag}</span><a href="https://github.com/polprats/poc-oficina-virtual/tree/{tag}" target="_blank" rel="noopener" style="color:inherit">GitHub ↗</a></nav>'''
    html = dest / 'index.html'
    html.write_text(html.read_text(encoding='utf-8').replace('</body>', nav + '</body>'), encoding='utf-8')
    print('Built /' + slug + '/ (' + tag + ')')

shutil.copy2(ROOT / 'hosting/index.html', output / 'index.html')
images = output / 'images'
images.mkdir(exist_ok=True)
for ref, name in [('v1.0.0', 'inicial'), ('v1.1.0', 'george')]:
    data = subprocess.run(['git', 'show', ref + ':screenshots/oficina.png'], cwd=ROOT, capture_output=True, check=True).stdout
    (images / (name + '.png')).write_bytes(data)
shutil.copy2(ROOT / 'screenshots/monitor-modal.png', images / 'dom.png')
print(json.dumps({'directory': str(output), 'routes': ['/', '/inicial/', '/george/', '/dom/']}))
