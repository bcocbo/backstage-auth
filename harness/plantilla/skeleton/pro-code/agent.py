"""Agente ${{ values.nombre }} (pro-code, ${{ values.runtime }}).

Esqueleto mínimo: lee harness.yaml para saber qué modelo y qué MCPs usar.
Las llamadas al modelo y a los MCPs pasan por los gateways del harness.
"""
from pathlib import Path

import yaml

HARNESS = yaml.safe_load((Path(__file__).parent.parent / "harness.yaml").read_text(encoding="utf-8"))


def main() -> None:
    spec = HARNESS["spec"]
    print("Agente:", HARNESS["metadata"]["name"])
    print("Modelo:", spec["modelo"]["ref"], "via", spec["modelo"]["via"])
    for mcp in spec["mcps"]:
        print("MCP:", mcp["ref"], "scope", mcp["scope"], "via", mcp["via"])


if __name__ == "__main__":
    main()
