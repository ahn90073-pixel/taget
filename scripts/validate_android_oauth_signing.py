#!/usr/bin/env python3
"""Validate that an APK signing certificate is registered for Firebase Google Sign-In."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


def normalize_sha1(value: str) -> str:
    normalized = re.sub(r"[^0-9a-fA-F]", "", str(value or ""))
    if len(normalized) != 40:
        raise ValueError("SHA-1 fingerprint must contain exactly 40 hexadecimal characters.")
    return normalized.lower()


def android_oauth_sha1s(firebase_config: dict[str, Any], package_name: str) -> set[str]:
    fingerprints: set[str] = set()
    for client in firebase_config.get("client", []):
        android_info = client.get("client_info", {}).get("android_client_info", {})
        if android_info.get("package_name") != package_name:
            continue
        for oauth_client in client.get("oauth_client", []):
            oauth_android = oauth_client.get("android_info", {})
            if oauth_client.get("client_type") != 1 or oauth_android.get("package_name") != package_name:
                continue
            certificate_hash = oauth_android.get("certificate_hash")
            if certificate_hash:
                fingerprints.add(normalize_sha1(certificate_hash))
    return fingerprints


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--firebase-config", required=True, type=Path)
    parser.add_argument("--package-name", required=True)
    parser.add_argument("--sha1", required=True)
    parser.add_argument("--mode", required=True, choices=("debug", "release"))
    parser.add_argument("--github-output", type=Path)
    args = parser.parse_args()

    config = json.loads(args.firebase_config.read_text(encoding="utf-8"))
    actual = normalize_sha1(args.sha1)
    registered = android_oauth_sha1s(config, args.package_name)
    matches = actual in registered

    if args.github_output:
        with args.github_output.open("a", encoding="utf-8") as output:
            output.write(f"matches={'true' if matches else 'false'}\n")
            output.write(f"sha1={actual}\n")

    if matches:
        print(f"{args.mode.capitalize()} APK SHA-1 is registered for {args.package_name}.")
        return 0

    print(f"{args.mode.capitalize()} APK SHA-1 {actual} is not registered in Firebase for {args.package_name}.")
    if args.mode == "debug":
        print("The Debug APK will be skipped; install the validated Release APK or register a stable Debug certificate in Firebase.")
        return 0

    print("Refusing to publish Release artifacts with an unregistered Google Sign-In certificate.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
