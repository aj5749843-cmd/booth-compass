# Inline the Vite build (JS + CSS) into a single index.html for GitHub Pages.
import pathlib, re
root = pathlib.Path(__file__).resolve().parent
tmp = root / "build-tmp"
html = (tmp / "dev.html").read_text()
def css(m):
    return "<style>\n" + (tmp / m.group(1).lstrip("./")).read_text() + "\n</style>"
def js(m):
    code = (tmp / m.group(1).lstrip("./")).read_text().replace("</script", "<\\/script")
    return '<script type="module">\n' + code + "\n</script>"
html = re.sub(r'<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css, html)
html = re.sub(r'<script type="module" crossorigin src="([^"]+)"></script>', js, html)
assert "assets/" not in html, "something was not inlined"
(root / "index.html").write_text(html)
print("index.html", len(html) // 1024, "KB")
