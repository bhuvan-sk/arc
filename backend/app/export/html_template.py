"""HTML document template generator for PDF exports."""
from typing import Any


def render_session_html(session: dict[str, Any], svg_by_layer: dict[str, str] | None = None) -> str:
    title = session.get("title", "Architecture Explanation")
    subtitle = session.get("subtitle", "")
    layers = session.get("layers", [])
    unlocked = session.get("unlocked_index", 0)
    graph = session.get("graph", {})
    scale = graph.get("scale", {})

    layers_html = []
    for l in layers:
        idx = l.get("index", 0)
        if idx > unlocked:
            continue

        l_name = l.get("name", f"Layer {idx+1}")
        band_label = l.get("band_label", "")
        narrative = l.get("narrative", {}) or {}
        n_title = narrative.get("title", l_name)
        n_body = narrative.get("body", "")
        items = narrative.get("items", [])
        decisions = l.get("scale_decisions", [])

        svg_markup = ""
        if svg_by_layer and l.get("id") in svg_by_layer:
            svg_markup = f'<div class="diagram">{svg_by_layer[l.get("id")]}</div>'

        items_html = ""
        if items:
            items_lis = "".join(
                f'<div class="item"><strong>{it.get("title")}</strong><span>{it.get("sub")}</span></div>'
                for it in items
            )
            items_html = f'<div class="items-grid">{items_lis}</div>'

        decisions_html = ""
        if decisions:
            dec_lis = "".join(
                f'<div class="decision"><div class="concern">{d.get("concern","").upper()}</div><div class="dec-body">{d.get("decision")}</div><div class="tradeoff">Trade-off: {d.get("tradeoff_seed")}</div></div>'
                for d in decisions
            )
            decisions_html = f'<div class="section-title">SCALE DECISIONS</div>{dec_lis}'

        layers_html.append(f"""
        <div class="layer-block">
            <div class="kicker">{band_label}</div>
            <h2>{n_title}</h2>
            <p>{n_body}</p>
            {svg_markup}
            {items_html}
            {decisions_html}
        </div>
        """)

    body_content = "\n".join(layers_html)

    band = scale.get("band", "unknown") if scale else "unknown"

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {{
    size: A4;
    margin: 20mm;
    @bottom-right {{
      content: counter(page);
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 9pt;
      color: #888;
    }}
  }}
  body {{
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
    font-size: 10pt;
  }}
  .header {{
    border-bottom: 2px solid #3b6fe5;
    padding-bottom: 15px;
    margin-bottom: 30px;
  }}
  .header h1 {{
    font-size: 24pt;
    margin: 0 0 5px 0;
    color: #0f0f11;
  }}
  .header .meta {{
    font-size: 10pt;
    color: #666;
  }}
  .layer-block {{
    margin-bottom: 40px;
    page-break-inside: avoid;
  }}
  .kicker {{
    font-size: 8pt;
    font-weight: bold;
    letter-spacing: 1.5px;
    color: #3b6fe5;
    margin-bottom: 4px;
  }}
  h2 {{
    font-size: 16pt;
    margin: 0 0 12px 0;
    color: #111;
  }}
  p {{
    margin: 0 0 15px 0;
    color: #333;
  }}
  .items-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }}
  .item {{
    background: #f4f5f8;
    border-left: 3px solid #3b6fe5;
    padding: 8px 12px;
    border-radius: 4px;
  }}
  .item strong {{
    display: block;
    font-size: 10pt;
    color: #111;
  }}
  .item span {{
    font-size: 8.5pt;
    color: #666;
  }}
  .section-title {{
    font-size: 8pt;
    font-weight: bold;
    letter-spacing: 1px;
    color: #888;
    margin: 15px 0 8px 0;
  }}
  .decision {{
    background: #fafafa;
    border: 1px solid #e5e5e5;
    padding: 10px 12px;
    border-radius: 4px;
    margin-bottom: 8px;
  }}
  .decision .concern {{
    font-size: 7.5pt;
    font-weight: bold;
    color: #3b6fe5;
    margin-bottom: 2px;
  }}
  .decision .dec-body {{
    font-size: 9.5pt;
    color: #222;
  }}
  .decision .tradeoff {{
    font-size: 8.5pt;
    color: #666;
    margin-top: 4px;
  }}
  .diagram {{
    margin: 15px 0;
    text-align: center;
  }}
  .diagram svg {{
    max-width: 100%;
    height: auto;
  }}
</style>
</head>
<body>
  <div class="header">
    <h1>{title}</h1>
    <div class="meta">{subtitle} &nbsp;·&nbsp; Scale Band: <strong>{band.upper()}</strong></div>
  </div>
  {body_content}
</body>
</html>
"""
