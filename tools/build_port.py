#!/usr/bin/env python3
"""Run the pinned Java converter, then normalize world-facing wall-record geometry.

The source converter in _build_port_source.py invokes current scoped visual owners.
The public build command stays unchanged. This final pass is idempotent and
preserves every model, UV, loot table, persistent state and non-record block.
"""
from pathlib import Path
import runpy
from wall_record_definition import normalize
from texture_paths import normalize as normalize_texture_paths
from freezer_ingredient_art import normalize_shared_geometry


def main():
    tools = Path(__file__).resolve().parent
    runpy.run_path(str(tools/'_build_port_source.py'), run_name='__main__')
    normalize(tools.parent/'runtime/BP/blocks/wall_record.json')
    normalize_texture_paths(tools.parent/'runtime/RP')
    normalize_shared_geometry(write=True, root=tools.parent)


if __name__ == '__main__':
    main()
