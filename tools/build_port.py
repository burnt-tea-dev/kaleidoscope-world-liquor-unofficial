#!/usr/bin/env python3
"""Run the pinned Java converter, then normalize world-facing wall-record geometry.

The original converter is retained byte-for-byte in _build_port_source.py.
The public build command stays unchanged. This final pass is idempotent and
preserves every model, UV, loot table, persistent state and non-record block.
"""
from pathlib import Path
import runpy
from wall_record_definition import normalize


def main():
    tools = Path(__file__).resolve().parent
    runpy.run_path(str(tools/'_build_port_source.py'), run_name='__main__')
    normalize(tools.parent/'runtime/BP/blocks/wall_record.json')


if __name__ == '__main__':
    main()
