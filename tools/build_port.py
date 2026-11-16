#!/usr/bin/env python3
"""Generate World Liquor resources from the pinned Java sources.

The default command retains the full converter and record/texture normalization.
--thrown-drink-only writes the scoped projectile and shared freezer resources
through the same owners, preserving all other current runtime output.
"""
import argparse
from pathlib import Path
import runpy
from wall_record_definition import normalize
from texture_paths import normalize as normalize_texture_paths
from freezer_ingredient_art import normalize_shared_geometry
from thrown_drink_visual import bottle_item_sources, generate as generate_thrown_drink_visual


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--thrown-drink-only', action='store_true',
                        help='Regenerate only the thrown-item sprite and identical freezer bindings')
    args = parser.parse_args()
    tools = Path(__file__).resolve().parent
    if args.thrown_drink_only:
        generate_thrown_drink_visual(tools.parent, bottle_item_sources(tools.parent))
        normalize_shared_geometry(tools.parent)
        return
    runpy.run_path(str(tools/'_build_port_source.py'), run_name='__main__')
    normalize(tools.parent/'runtime/BP/blocks/wall_record.json')
    normalize_texture_paths(tools.parent/'runtime/RP')
    normalize_shared_geometry(tools.parent)


if __name__ == '__main__':
    main()
