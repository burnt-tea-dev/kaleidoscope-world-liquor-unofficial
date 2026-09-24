#!/usr/bin/env python3
"""Build review-only Bedrock geometry and editable models from pinned Java sources.

No network access, game runtime, fallback artwork, or source mutation. Unknown parents,
textures, UV rotations and unsupported inverted cuboids stop that candidate instead of being repaired
silently. Coordinate/UV conventions are documented in docs/CONVERSION.zh-TW.md.
"""
from __future__ import annotations

import argparse
import base64
import copy
import hashlib
import json
import math
import re
import shutil
import sys
import uuid
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "upstream/assets"
NS = "kaleidoscope_grilling"
FACES = ("north", "east", "south", "west", "up", "down")
UUID_NS = uuid.UUID("9633f1b6-13a6-4b96-b80b-66e3cfa0cd0a")
BOTTLE_OFFSETS = [
    [[0, 0]], [[4, 3], [-3, -1]],
    [[4, 4], [-3, 3], [3, -3.75]],
    [[4, 5], [-3, 4], [3.5, -3.25], [-4.25, -3.25]],
]

class AssetError(ValueError):
    """The input cannot be converted faithfully by this restricted exporter."""


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def checked_id(identifier: str) -> tuple[str, str]:
    if not isinstance(identifier, str) or not re.fullmatch(r"[a-z0-9_.-]+:[a-z0-9_./-]+", identifier):
        raise AssetError(f"Invalid resource id: {identifier!r}")
    ns, path = identifier.split(":", 1)
    if any(x in ("", ".", "..") for x in path.split("/")):
        raise AssetError(f"Unsafe resource path: {identifier}")
    return ns, path


def resource_path(identifier: str, kind: str, root: Path = ASSETS) -> Path:
    ns, path = checked_id(identifier)
    extension = ".png" if kind == "textures" else ".json"
    return root / ns / kind / (path + extension)


def resolve_model(identifier: str, root: Path = ASSETS, chain: tuple[str, ...] = ()) -> dict:
    if isinstance(identifier, str) and ":" not in identifier:
        identifier = "minecraft:" + identifier
    if identifier in chain or len(chain) >= 48:
        raise AssetError("Parent cycle/depth: " + " -> ".join((*chain, identifier)))
    if identifier in ("minecraft:block/block", "minecraft:block", "minecraft:item/generated", "minecraft:item/handheld"):
        return {}
    path = resource_path(identifier, "models", root)
    if not path.is_file():
        raise AssetError(f"Missing parent/model: {identifier}")
    own = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(own, dict):
        raise AssetError(f"Model is not an object: {identifier}")
    merged: dict = {}
    if own.get("parent"):
        merged = resolve_model(own["parent"], root, (*chain, identifier))
    for key, value in own.items():
        if key == "parent":
            continue
        if key in ("textures", "display"):
            merged[key] = {**merged.get(key, {}), **copy.deepcopy(value)}
        else:
            merged[key] = copy.deepcopy(value)
    return merged


def texture_id(ref: str, aliases: dict[str, str]) -> str:
    seen: set[str] = set()
    while ref.startswith("#"):
        if ref in seen:
            raise AssetError(f"Texture alias cycle: {ref}")
        seen.add(ref)
        key = ref[1:]
        if key not in aliases:
            raise AssetError(f"Missing texture alias: {ref}")
        ref = aliases[key]
    checked_id(ref)
    return ref


def check_vector(value: Any, n: int, label: str) -> list[float]:
    if not isinstance(value, list) or len(value) != n or any(
        isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for x in value
    ):
        raise AssetError(f"Invalid {label}: {value!r}")
    return value


def inspect_model(model: dict, allow_native_uv_rotation: bool = False) -> list[dict]:
    if not isinstance(model.get("elements"), list) or not model["elements"]:
        raise AssetError("No authored elements; procedural/vanilla templates are not substituted.")
    warnings = []
    for i, e in enumerate(model["elements"]):
        a = check_vector(e.get("from"), 3, f"element {i} from")
        b = check_vector(e.get("to"), 3, f"element {i} to")
        if any(y < x for x, y in zip(a, b)):
            raise AssetError(f"Inverted dimensions at element {i}; inward surfaces need separate review.")
        if any(x == y for x, y in zip(a, b)):
            warnings.append({"code": "PLANAR_ELEMENT_PRESERVED", "element": i})
        rotation = e.get("rotation", {})
        if rotation:
            if rotation.get("axis") not in ("x", "y", "z"):
                raise AssetError(f"Unsupported rotation axis at element {i}")
            check_vector(rotation.get("origin"), 3, "rotation pivot")
            check_vector([rotation.get("angle")], 1, "rotation angle")
            if rotation.get("rescale"):
                raise AssetError("Java rescale rotation requires a separate verified conversion.")
        for name, face in e.get("faces", {}).items():
            if name not in FACES:
                raise AssetError(f"Unknown cube face: {name}")
            check_vector(face.get("uv"), 4, "face UV")
            angle = face.get("rotation", 0)
            allowed = (0, 90, 180, 270) if allow_native_uv_rotation else (0,)
            if isinstance(angle, bool) or angle not in allowed:
                raise AssetError("Face UV rotation requires a valid, explicitly enabled native 1.21.0 path.")
            if "tintindex" in face:
                raise AssetError("Tinted faces need a colour source; not silently ignored.")
    return warnings


def lower_inward_surfaces(model: dict) -> tuple[dict, list[dict]]:
    """Preserve six-plane semantics of all-axis-reversed authored cuboids.

    Each original face stays at its own plane with its own outward normal and
    corner UVs. This is NOT abs(size), a filled replacement box, or extra thickness.
    Mixed-axis inversions remain blocked pending a dedicated verified mapping.
    """
    out = copy.deepcopy(model)
    out["elements"] = []
    changes = []
    for i, e in enumerate(model.get("elements", [])):
        a = check_vector(e.get("from"), 3, "from")
        b = check_vector(e.get("to"), 3, "to")
        inverted = [b[j] < a[j] for j in range(3)]
        if not any(inverted):
            out["elements"].append(copy.deepcopy(e))
            continue
        if not all(inverted):
            raise AssetError("Mixed-axis inverted dimensions still require separate review")
        planes = {"north": (2, a[2]), "south": (2, b[2]),
                  "west": (0, a[0]), "east": (0, b[0]),
                  "up": (1, b[1]), "down": (1, a[1])}
        for face, data in e.get("faces", {}).items():
            if data.get("rotation", 0):
                raise AssetError("Rotated UV on inward face is not yet supported")
            axis, value = planes[face]
            lo, hi = list(b), list(a)
            lo[axis] = hi[axis] = value
            uv = data["uv"]
            f = copy.deepcopy(data)
            f["uv"] = [uv[2], uv[3], uv[0], uv[1]]
            plane = {"name": f"source_{i}_inward_{face}", "from": lo, "to": hi,
                     "faces": {face: f}}
            if "rotation" in e:
                plane["rotation"] = copy.deepcopy(e["rotation"])
            if "shade" in e:
                plane["shade"] = e["shade"]
            out["elements"].append(plane)
        changes.append({"code": "INWARD_SURFACES_TO_ONE_SIDED_PLANES", "source_element": i,
                        "source_faces": list(e.get("faces", {})),
                        "planes_created": len(e.get("faces", {})),
                        "added_thickness": 0, "source_retained": True})
    inspect_model(out)
    return out, changes


def lower_mixed_axis_surfaces(model: dict) -> tuple[dict, list[dict]]:
    """Preserve signed-cuboid face winding via oriented, zero-thickness planes.

    This path is opt-in. It handles negative extents without filling inward walls,
    swapping a face's physical location, or modifying PNG pixels. Quarter-turn
    UVs and already-planar inverted cuboids remain explicitly unsupported.
    """
    def quad(a, b, face):
        x,y,z=a; X,Y,Z=b
        return {
            "north": [(X,Y,z),(x,Y,z),(x,y,z),(X,y,z)],
            "south": [(x,Y,Z),(X,Y,Z),(X,y,Z),(x,y,Z)],
            "east": [(X,Y,Z),(X,Y,z),(X,y,z),(X,y,Z)],
            "west": [(x,Y,z),(x,Y,Z),(x,y,Z),(x,y,z)],
            "up": [(x,Y,z),(X,Y,z),(X,Y,Z),(x,Y,Z)],
            "down": [(x,y,Z),(X,y,Z),(X,y,z),(x,y,z)],
        }[face]
    out=copy.deepcopy(model); out["elements"]=[]; changes=[]
    for i,element in enumerate(model.get("elements", [])):
        a=check_vector(element.get("from"),3,"from")
        b=check_vector(element.get("to"),3,"to")
        negative=[axis for axis in range(3) if b[axis]<a[axis]]
        if not negative:
            out["elements"].append(copy.deepcopy(element)); continue
        planes={"north":(2,a[2]),"south":(2,b[2]),"east":(0,b[0]),
                "west":(0,a[0]),"up":(1,b[1]),"down":(1,a[1])}
        created=[]
        for face,data in element.get("faces",{}).items():
            axis,value=planes[face]
            lo=[min(a[j],b[j]) for j in range(3)]
            hi=[max(a[j],b[j]) for j in range(3)]
            lo[axis]=hi[axis]=value
            source=quad(a,b,face)
            if len(set(tuple(v) for v in source))<4:continue # zero-area side of a planar element
            u0,v0,u1,v1=check_vector(data.get("uv"),4,"mixed-axis face UV")
            original_uv=[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]
            turns=data.get("rotation",0)//90
            original_uv=original_uv[turns:]+original_uv[:turns]
            match=None
            for target in (("east","west"),("up","down"),("north","south"))[axis]:
                dest=quad(lo,hi,target)
                order=[source.index(vertex) for vertex in dest]
                if any(order==[(start+j)%4 for j in range(4)] for start in range(4)):
                    desired=[original_uv[j] for j in order]
                    for turn in range(4):
                        unrotated=desired[-turn:]+desired[:-turn] if turn else desired
                        uv=[*unrotated[0],*unrotated[2]]
                        if unrotated==[(uv[0],uv[1]),(uv[2],uv[1]),(uv[2],uv[3]),(uv[0],uv[3])]:
                            match=(target,uv,turn*90);break
                    if match:break
            if match is None:
                raise AssetError("No orientation-preserving mixed-axis plane mapping")
            target,uv,uvrot=match
            plane={"name":f"source_{i}_mixed_{face}","from":lo,"to":hi,
                   "faces":{target:{**copy.deepcopy(data),"uv":uv,"rotation":uvrot}}}
            for key in ("rotation","shade"):
                if key in element: plane[key]=copy.deepcopy(element[key])
            out["elements"].append(plane);created.append({"from":face,"to":target})
        changes.append({"code":"SIGNED_CUBOID_TO_ORIENTED_PLANES","source_element":i,
                        "negative_axes":["xyz"[j] for j in negative],
                        "face_mapping":created,"planes_created":len(created),
                        "added_thickness":0,"source_retained":True})
    inspect_model(out,allow_native_uv_rotation=True)
    return out,changes


def lower_uv_half_turns(model: dict, allow_quarter_turns: bool = False) -> tuple[dict, list[dict]]:
    """Bake 180-degree per-face UV rotation to reversed endpoints, not new pixels.

    The source remains unchanged. Legacy callers still reject quarter turns.
    Explicitly enabled quarter turns stay native and require geometry 1.21.0.
    """
    out = copy.deepcopy(model)
    changes = []
    for i, e in enumerate(out.get("elements", [])):
        for name, face in e.get("faces", {}).items():
            angle = face.get("rotation", 0)
            allowed = (0, 90, 180, 270) if allow_quarter_turns else (0, 180)
            if isinstance(angle, bool) or angle not in allowed:
                raise AssetError(f"UV rotation {angle!r} is not verified by this exporter")
            if angle in (90, 270):
                changes.append({"code": "FACE_UV_QUARTER_TURN_NATIVE", "source_element": i,
                                "face": name, "degrees": angle, "geometry_format": "1.21.0",
                                "source_retained": True})
            if angle == 180:
                u0, v0, u1, v1 = check_vector(face["uv"], 4, "half-turn UV")
                face["uv"] = [u1, v1, u0, v0]
                del face["rotation"]
                changes.append({"code": "FACE_UV_HALF_TURN_BAKED", "source_element": i,
                                "face": name, "degrees": 180, "source_retained": True})
    return out, changes


def metadata_warnings(model: dict) -> list[dict]:
    """Record source requirements without silently claiming runtime support."""
    warnings = []
    ref = model.get("textures", {}).get("particle")
    if ref is not None:
        try:
            texture_id(ref, model["textures"])
        except (AssetError, TypeError, AttributeError) as exc:
            warnings.append({"code": "UNRESOLVED_SOURCE_PARTICLE_ALIAS", "source_value": ref,
                             "reason": str(exc), "affects_body_face_uv": False,
                             "particle_runtime_implemented": False})
    for i, e in enumerate(model.get("elements", [])):
        if "neoforge_data" in e:
            warnings.append({"code": "SOURCE_LIGHTING_METADATA_NOT_PORTED", "source_element": i,
                             "source_value": copy.deepcopy(e["neoforge_data"]),
                             "geometry_and_uv_preserved": True,
                             "bedrock_emissive_material_implemented": False,
                             "offline_fullbright_simulated": False})
    return warnings


def build_atlas(model: dict, destination: Path, root: Path = ASSETS) -> dict[str, dict]:
    refs = sorted({texture_id(f["texture"], model.get("textures", {}))
                   for e in model["elements"] for f in e.get("faces", {}).values()})
    images: dict[str, Image.Image] = {}
    for ref in refs:
        p = resource_path(ref, "textures", root)
        if not p.is_file():
            raise AssetError(f"Missing texture: {ref}")
        if p.with_suffix(".png.mcmeta").exists():
            raise AssetError(f"Animated texture requires explicit frame policy: {ref}")
        with Image.open(p) as im:
            if im.width > 4096 or im.height > 4096:
                raise AssetError("Texture exceeds atlas limit.")
            images[ref] = im.convert("RGBA")
    width, height = sum(im.width for im in images.values()), max(im.height for im in images.values())
    if width > 4096 or height > 4096:
        raise AssetError("Atlas exceeds 4096 pixels.")
    atlas = Image.new("RGBA", (width, height))
    placement = {}
    x = 0
    for ref, im in images.items():
        atlas.paste(im, (x, 0))  # No mask: preserve RGBA, including hidden RGB under alpha=0.
        placement[ref] = {"x": x, "y": 0, "width": im.width, "height": im.height}
        x += im.width
    destination.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(destination)
    return placement


def pixel_uv(face: dict, model: dict, placement: dict) -> list[float]:
    rect = placement[texture_id(face["texture"], model.get("textures", {}))]
    u0, v0, u1, v1 = face["uv"]
    # Java UV uses normalized 0..16 texture coordinates, even for 32/64px textures.
    return [rect["x"] + u0 * rect["width"] / 16,
            rect["y"] + v0 * rect["height"] / 16,
            rect["x"] + u1 * rect["width"] / 16,
            rect["y"] + v1 * rect["height"] / 16]


def point_to_bedrock(point: list[float]) -> list[float]:
    return [8 - point[0], point[1], point[2] - 8]


def compile_element(e: dict, model: dict, placement: dict, dx: float = 0, dz: float = 0) -> dict:
    a, b = e["from"], e["to"]
    uv = {}
    for name, face in e.get("faces", {}).items():
        x0, y0, x1, y1 = pixel_uv(face, model, placement)
        # Bedrock's up/down endpoints are reversed relative to Java/Blockbench editor UV.
        if name in ("up", "down"):
            x0, y0, x1, y1 = x1, y1, x0, y0
        uv[name] = {"uv": [x0, y0], "uv_size": [x1 - x0, y1 - y0]}
        if face.get("rotation", 0):
            uv[name]["uv_rotation"] = face["rotation"]
    result = {"origin": [8 - b[0] - dx, a[1], a[2] + dz - 8],
              "size": [b[j] - a[j] for j in range(3)], "uv": uv}
    r = e.get("rotation")
    if r and r["angle"]:
        p = list(r["origin"])
        p[0] += dx
        p[2] += dz
        result["pivot"] = point_to_bedrock(p)
        axis = "xyz".index(r["axis"])
        angles = [0, 0, 0]
        # This is an engine convention, not a generic right-handed matrix mirror.
        angles[axis] = r["angle"] * (-1 if axis < 2 else 1)
        result["rotation"] = angles
    return result


def geometry(model: dict, name: str, placement: dict, offsets: list[list[float]],
             allow_native_uv_rotation: bool = False) -> dict:
    inspect_model(model, allow_native_uv_rotation=allow_native_uv_rotation)
    native_uv = any(f.get("rotation", 0) for e in model["elements"] for f in e.get("faces", {}).values())
    bones = [{"name": "root", "pivot": [0, 0, 0]}]
    for i, (dx, dz) in enumerate(offsets):
        for j, e in enumerate(model["elements"]):
            label = re.sub(r"[^a-zA-Z0-9_]", "_", e.get("name", f"element_{j}"))
            bones.append({"name": f"instance_{i}_{label}_{j}", "parent": "root", "pivot": [0, 0, 0],
                          "cubes": [compile_element(e, model, placement, dx, dz)]})
    return {"format_version": "1.21.0" if native_uv else "1.16.0", "minecraft:geometry": [{
        "description": {"identifier": f"geometry.kwl.{name}",
                        "texture_width": max(r["x"] + r["width"] for r in placement.values()),
                        "texture_height": max(r["y"] + r["height"] for r in placement.values()),
                        "visible_bounds_width": 4, "visible_bounds_height": 4,
                        "visible_bounds_offset": [0, 1, 0]},
        "bones": bones}]}


